// improvedAssistant.js - Enhanced AI Assistant with smart context management

import { ChatOpenAI } from '@langchain/openai';
import { index } from '../config/pineconeInit.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_KEY = process.env.OPEN_AI_API_KEY;

// Configuration
const CONFIG = {
    // Relevance thresholds (Pinecone scores are 0-1, higher = more similar)
    MIN_RELEVANCE_SCORE: 0.7,

    // Context limits (approximate token counts)
    MAX_CONTEXT_TOKENS: 4000,
    MAX_CONVERSATION_TOKENS: 2000,

    // Retrieval limits (start small, expand if needed)
    INITIAL_TOP_K: 10,
    EXPANDED_TOP_K: 30,

    // Compaction settings
    MAX_MESSAGES_BEFORE_COMPACT: 10,
    COMPACTED_SUMMARY_LENGTH: 500,
};

/**
 * Compute embedding using OpenAI's API
 */
async function computeEmbedding(text) {
    const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        { model: 'text-embedding-ada-002', input: text },
        { headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    return response.data.data[0].embedding;
}

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
function estimateTokens(text) {
    return Math.ceil((text || '').length / 4);
}

/**
 * Format timestamp as MM:SS
 */
function formatTimestamp(seconds) {
    if (!seconds && seconds !== 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Classify query intent to optimize retrieval strategy
 */
function classifyQueryIntent(query) {
    const lowerQuery = query.toLowerCase();

    // Check for specific practical reference
    const hasPracticalRef = lowerQuery.includes('#') ||
        lowerQuery.includes('practical') ||
        lowerQuery.includes('session');

    // Check for student/participant reference
    const hasStudentRef = lowerQuery.includes('@') ||
        lowerQuery.includes('student') ||
        lowerQuery.includes('participant');

    // Check for transcript/video reference
    const hasTranscriptRef = lowerQuery.includes('said') ||
        lowerQuery.includes('transcript') ||
        lowerQuery.includes('video') ||
        lowerQuery.includes('mentioned') ||
        lowerQuery.includes('during');

    // Check for feedback/performance reference
    const hasFeedbackRef = lowerQuery.includes('feedback') ||
        lowerQuery.includes('comment') ||
        lowerQuery.includes('performance') ||
        lowerQuery.includes('rating') ||
        lowerQuery.includes('improve');

    // Check for comparison/analytics
    const hasComparisonRef = lowerQuery.includes('compare') ||
        lowerQuery.includes('average') ||
        lowerQuery.includes('overall') ||
        lowerQuery.includes('trend');

    // Check for general/help questions
    const isGeneralQuestion = lowerQuery.includes('how do i') ||
        lowerQuery.includes('what is') ||
        lowerQuery.includes('help') ||
        lowerQuery.includes('explain');

    return {
        hasPracticalRef,
        hasStudentRef,
        hasTranscriptRef,
        hasFeedbackRef,
        hasComparisonRef,
        isGeneralQuestion,
        // Determine primary focus
        primaryFocus: hasPracticalRef ? 'practical' :
                      hasTranscriptRef ? 'transcript' :
                      hasFeedbackRef ? 'feedback' :
                      hasComparisonRef ? 'analytics' :
                      'general'
    };
}

/**
 * Filter matches by relevance score and deduplicate
 */
function filterAndRankMatches(matches, minScore = CONFIG.MIN_RELEVANCE_SCORE) {
    if (!matches || matches.length === 0) return [];

    // Filter by minimum relevance score
    const filtered = matches.filter(m => m.score >= minScore);

    // Sort by score descending
    filtered.sort((a, b) => b.score - a.score);

    // Deduplicate by practical_id (keep highest scored)
    const seen = new Set();
    const deduped = [];
    for (const match of filtered) {
        const key = match.metadata?.practical_id || match.id;
        if (!seen.has(key)) {
            seen.add(key);
            deduped.push(match);
        }
    }

    return deduped;
}

/**
 * Build context string with token limit
 */
function buildContextWithLimit(matches, maxTokens, formatter) {
    let context = '';
    let tokenCount = 0;

    for (const match of matches) {
        const text = formatter(match);
        const textTokens = estimateTokens(text);

        if (tokenCount + textTokens > maxTokens) {
            break;
        }

        context += text + '\n';
        tokenCount += textTokens;
    }

    return { context: context.trim(), tokenCount };
}

/**
 * Compact conversation history by summarizing older messages
 */
async function compactConversation(messages, llm) {
    if (messages.length <= CONFIG.MAX_MESSAGES_BEFORE_COMPACT) {
        return messages;
    }

    // Keep the most recent messages
    const recentCount = Math.floor(CONFIG.MAX_MESSAGES_BEFORE_COMPACT / 2);
    const recentMessages = messages.slice(-recentCount);
    const olderMessages = messages.slice(0, -recentCount);

    // Summarize older messages
    const olderText = olderMessages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

    const summaryPrompt = `Summarize this conversation history in ${CONFIG.COMPACTED_SUMMARY_LENGTH} characters or less. Focus on key topics discussed and any important context:\n\n${olderText}`;

    try {
        const summaryResult = await llm.invoke([{ role: 'user', content: summaryPrompt }]);
        const summary = summaryResult.content;

        // Return compacted messages
        return [
            { role: 'system', content: `[Previous conversation summary: ${summary}]` },
            ...recentMessages
        ];
    } catch (error) {
        console.warn('[Assistant] Failed to compact conversation:', error.message);
        // Fall back to just keeping recent messages
        return recentMessages;
    }
}

/**
 * Smart retrieval with tiered approach
 */
async function smartRetrieval(queryEmbedding, baseFilter, intent) {
    const practicalNamespace = index.namespace('practicals');
    const commentsNamespace = index.namespace('comments');
    const transcriptsNamespace = index.namespace('transcripts');

    // Determine retrieval strategy based on intent
    let practicalTopK = CONFIG.INITIAL_TOP_K;
    let transcriptTopK = CONFIG.INITIAL_TOP_K;
    let commentTopK = CONFIG.INITIAL_TOP_K;

    // Adjust based on intent
    if (intent.primaryFocus === 'transcript') {
        transcriptTopK = CONFIG.EXPANDED_TOP_K;
        practicalTopK = 5;
    } else if (intent.primaryFocus === 'feedback') {
        commentTopK = CONFIG.EXPANDED_TOP_K;
        practicalTopK = 5;
    } else if (intent.primaryFocus === 'analytics' || intent.hasComparisonRef) {
        practicalTopK = CONFIG.EXPANDED_TOP_K;
    }

    // Query practicals
    const practicalResponse = await practicalNamespace.query({
        vector: queryEmbedding,
        topK: practicalTopK,
        includeMetadata: true,
        filter: baseFilter
    });

    const practicalMatches = filterAndRankMatches(practicalResponse.matches);

    // Get comment IDs from relevant practicals
    let commentIds = [];
    for (const match of practicalMatches) {
        let comments = match.metadata?.comments;
        if (typeof comments === 'string') {
            try { comments = JSON.parse(comments); } catch { comments = []; }
        }
        if (Array.isArray(comments)) {
            commentIds = commentIds.concat(comments);
        }
    }
    commentIds = [...new Set(commentIds)];

    // Query comments if we have IDs and intent suggests feedback
    let commentMatches = [];
    if (commentIds.length > 0 && (intent.hasFeedbackRef || intent.primaryFocus === 'feedback')) {
        const commentResponse = await commentsNamespace.query({
            vector: queryEmbedding,
            topK: commentTopK,
            includeMetadata: true,
            filter: { comment_id: { '$in': commentIds.slice(0, 100) } } // Limit filter size
        });
        commentMatches = filterAndRankMatches(commentResponse.matches);
    }

    // Query transcripts if intent suggests it
    let transcriptMatches = [];
    if (intent.hasTranscriptRef || intent.primaryFocus === 'transcript') {
        const transcriptResponse = await transcriptsNamespace.query({
            vector: queryEmbedding,
            topK: transcriptTopK,
            includeMetadata: true,
            filter: baseFilter
        });
        transcriptMatches = filterAndRankMatches(transcriptResponse.matches, 0.65); // Lower threshold for transcripts
    }

    return { practicalMatches, commentMatches, transcriptMatches };
}

/**
 * Build the system prompt based on role and context
 */
function buildSystemPrompt(role, intent) {
    let basePrompt = `You are Pulse Assistant, an AI teaching assistant for medical education practicals.`;

    if (role === 'student') {
        basePrompt += ` You're helping a student review their practical sessions, understand feedback, and improve their skills.`;
    } else if (role === 'instructor') {
        basePrompt += ` You're helping an instructor review student performances, provide insights, and track progress across sessions.`;
    }

    basePrompt += `

Guidelines:
- Be concise but helpful
- If referencing video content, include timestamps
- If you don't have enough context to answer, say so
- Focus on actionable insights when discussing performance
- Be encouraging while being honest about areas for improvement`;

    return basePrompt;
}

/**
 * Main improved call model function
 */
export async function improvedCallModel(state) {
    const { userId, role, filter, isChat } = state.config?.configurable || {};

    if (!userId || !role) {
        throw new Error("Missing userId or role in configuration");
    }

    const messages = state.messages;
    const currentQuery = messages[messages.length - 1].content;

    // Initialize LLM
    const llm = new ChatOpenAI({
        openAIApiKey: OPENAI_API_KEY,
        modelName: 'gpt-4o-mini',
        temperature: 0.3, // Slightly higher for more natural responses
        maxTokens: 1000,  // Limit response length
    });

    // 1. Classify query intent
    const intent = classifyQueryIntent(currentQuery);
    console.log('[Assistant] Query intent:', intent.primaryFocus);

    // 2. Handle general questions without retrieval
    if (intent.isGeneralQuestion && !intent.hasPracticalRef && !intent.hasStudentRef) {
        const systemPrompt = buildSystemPrompt(role, intent);
        const result = await llm.invoke([
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content }))
        ]);
        return {
            messages: messages.concat({ role: 'assistant', content: result.content })
        };
    }

    // 3. Compute embedding and build filter
    const queryEmbedding = await computeEmbedding(currentQuery);

    let baseFilter = {};
    if (role === 'student') {
        baseFilter = { user_participant: { '$eq': userId } };
    } else if (role === 'instructor') {
        baseFilter = { user_instructor_id: { '$eq': userId } };
    }

    const combinedFilter = { ...baseFilter, ...(filter || {}) };

    // 4. Smart retrieval based on intent
    const { practicalMatches, commentMatches, transcriptMatches } =
        await smartRetrieval(queryEmbedding, combinedFilter, intent);

    console.log(`[Assistant] Retrieved: ${practicalMatches.length} practicals, ${commentMatches.length} comments, ${transcriptMatches.length} transcripts`);

    // 5. Build context with token limits
    const practicalContext = buildContextWithLimit(
        practicalMatches,
        CONFIG.MAX_CONTEXT_TOKENS * 0.4,
        (m) => {
            const meta = m.metadata;
            return `Practical: ${meta.practical_name} | Rating: ${meta.avg_rating || 'N/A'} | Tasks: ${meta.tasks || 'N/A'}`;
        }
    );

    const commentContext = buildContextWithLimit(
        commentMatches,
        CONFIG.MAX_CONTEXT_TOKENS * 0.3,
        (m) => `Feedback: ${m.metadata.text || m.metadata.feedback_text || JSON.stringify(m.metadata)}`
    );

    const transcriptContext = buildContextWithLimit(
        transcriptMatches,
        CONFIG.MAX_CONTEXT_TOKENS * 0.3,
        (m) => `[${m.metadata.practical_name} @ ${formatTimestamp(m.metadata.start_time)}]: ${m.metadata.text}`
    );

    // 6. Compact conversation if needed
    const compactedMessages = await compactConversation(messages, llm);

    // 7. Build final prompt
    const systemPrompt = buildSystemPrompt(role, intent);

    let contextBlock = '';
    if (practicalContext.context) {
        contextBlock += `\n\nRelevant Practicals:\n${practicalContext.context}`;
    }
    if (commentContext.context) {
        contextBlock += `\n\nFeedback & Comments:\n${commentContext.context}`;
    }
    if (transcriptContext.context) {
        contextBlock += `\n\nVideo Transcript Excerpts:\n${transcriptContext.context}`;
    }

    if (!contextBlock) {
        contextBlock = '\n\nNo specific context found for this query.';
    }

    const fullSystemPrompt = systemPrompt + contextBlock;

    // 8. Call LLM
    const result = await llm.invoke([
        { role: 'system', content: fullSystemPrompt },
        ...compactedMessages.map(m => ({ role: m.role, content: m.content }))
    ]);

    return {
        messages: messages.concat({ role: 'assistant', content: result.content })
    };
}

export { classifyQueryIntent, compactConversation, CONFIG };
