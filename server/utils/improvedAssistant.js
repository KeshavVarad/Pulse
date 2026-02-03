// improvedAssistant.js - Enhanced AI Assistant with smart context management

import { ChatOpenAI } from '@langchain/openai';
import { index } from '../config/pineconeInit.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_KEY = process.env.OPEN_AI_API_KEY;

// Configuration - balanced for speed and context quality
const CONFIG = {
    // Relevance thresholds (Pinecone scores are 0-1, higher = more similar)
    MIN_RELEVANCE_SCORE: 0.65,  // Lowered to include more relevant transcripts

    // Context limits (approximate token counts)
    MAX_CONTEXT_TOKENS: 3500,  // Increased to include more transcript context
    MAX_CONVERSATION_TOKENS: 1500,

    // Retrieval limits
    INITIAL_TOP_K: 10,  // Increased for better coverage
    EXPANDED_TOP_K: 20,

    // Compaction settings
    MAX_MESSAGES_BEFORE_COMPACT: 8,
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
 * Compact conversation history - simplified to avoid extra LLM call
 * Uses simple truncation instead of summarization for speed
 */
function compactConversation(messages) {
    if (messages.length <= CONFIG.MAX_MESSAGES_BEFORE_COMPACT) {
        return messages;
    }

    // Keep the most recent messages (no LLM call needed)
    const recentCount = CONFIG.MAX_MESSAGES_BEFORE_COMPACT;
    return messages.slice(-recentCount);
}

/**
 * Smart retrieval with PARALLEL queries for speed
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

    // Build parallel query promises - always query all three namespaces
    const queryPromises = [
        // Always query practicals
        practicalNamespace.query({
            vector: queryEmbedding,
            topK: practicalTopK,
            includeMetadata: true,
            filter: baseFilter
        }).then(res => ({ type: 'practicals', matches: res.matches })),

        // Always query transcripts - they provide valuable context for any question
        transcriptsNamespace.query({
            vector: queryEmbedding,
            topK: transcriptTopK,
            includeMetadata: true,
            filter: baseFilter
        }).then(res => ({ type: 'transcripts', matches: res.matches })),

        // Always query comments - feedback is relevant to most questions
        commentsNamespace.query({
            vector: queryEmbedding,
            topK: commentTopK,
            includeMetadata: true,
            filter: baseFilter
        }).then(res => ({ type: 'comments', matches: res.matches }))
    ];

    // Execute all queries in parallel
    const results = await Promise.all(queryPromises);

    // Process results
    let practicalMatches = [];
    let commentMatches = [];
    let transcriptMatches = [];

    for (const result of results) {
        if (result.type === 'practicals') {
            practicalMatches = filterAndRankMatches(result.matches);
        } else if (result.type === 'transcripts') {
            transcriptMatches = filterAndRankMatches(result.matches, 0.65);
        } else if (result.type === 'comments') {
            commentMatches = filterAndRankMatches(result.matches);
        }
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
- IMPORTANT: Only reference timestamps that appear in the provided transcript excerpts. Use the exact format [MM:SS] (e.g., [2:34]). Never make up timestamps.
- If you don't have enough context or transcript data to answer, say so
- Focus on actionable insights when discussing performance
- Be encouraging while being honest about areas for improvement

Response Format:
When providing feedback summaries or performance reviews, structure your response with clear sections:
- Use "## Strengths" for positive aspects
- Use "## Areas to Improve" for constructive feedback
- Use "## Key Moments" when referencing specific video timestamps (only if transcripts are provided)
- Use bullet points for multiple items
- Keep each section focused and scannable`;

    return basePrompt;
}

/**
 * Main improved call model function
 */
export async function improvedCallModel(state) {
    const startTime = Date.now();
    const { userId, role, filter, isChat } = state.config?.configurable || {};

    if (!userId || !role) {
        throw new Error("Missing userId or role in configuration");
    }

    const messages = state.messages;
    const currentQuery = messages[messages.length - 1].content;

    // Initialize LLM - optimized for speed
    const llm = new ChatOpenAI({
        openAIApiKey: OPENAI_API_KEY,
        modelName: 'gpt-4o-mini',
        temperature: 0.2,  // Lower for faster, more focused responses
        maxTokens: 600,    // Reduced for faster generation
    });

    // 1. Classify query intent
    const intent = classifyQueryIntent(currentQuery);
    console.log(`[Assistant] Query intent: ${intent.primaryFocus} (${Date.now() - startTime}ms)`);

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
    const embeddingStart = Date.now();
    const queryEmbedding = await computeEmbedding(currentQuery);
    console.log(`[Assistant] Embedding computed (${Date.now() - embeddingStart}ms)`);

    let baseFilter = {};
    if (role === 'student') {
        baseFilter = { user_participant: { '$eq': userId } };
    } else if (role === 'instructor') {
        baseFilter = { user_instructor_id: { '$eq': userId } };
    }

    const combinedFilter = { ...baseFilter, ...(filter || {}) };

    // 4. Smart retrieval based on intent
    const retrievalStart = Date.now();
    const { practicalMatches, commentMatches, transcriptMatches } =
        await smartRetrieval(queryEmbedding, combinedFilter, intent);

    console.log(`[Assistant] Retrieved: ${practicalMatches.length} practicals, ${commentMatches.length} comments, ${transcriptMatches.length} transcripts (${Date.now() - retrievalStart}ms)`);

    // 5. Build context with token limits
    // Allocate more context to transcripts since they contain the actual content
    const practicalContext = buildContextWithLimit(
        practicalMatches,
        CONFIG.MAX_CONTEXT_TOKENS * 0.2,
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

    // Give transcripts the largest share - they have the most actionable detail
    const transcriptContext = buildContextWithLimit(
        transcriptMatches,
        CONFIG.MAX_CONTEXT_TOKENS * 0.5,
        (m) => `[${formatTimestamp(m.metadata.start_time)}] (${m.metadata.practical_name}): "${m.metadata.text}"`
    );

    // 6. Compact conversation if needed (no await - now synchronous)
    const compactedMessages = compactConversation(messages);

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
    const llmStart = Date.now();
    const result = await llm.invoke([
        { role: 'system', content: fullSystemPrompt },
        ...compactedMessages.map(m => ({ role: m.role, content: m.content }))
    ]);
    console.log(`[Assistant] LLM response (${Date.now() - llmStart}ms), total: ${Date.now() - startTime}ms`);

    return {
        messages: messages.concat({ role: 'assistant', content: result.content })
    };
}

/**
 * Streaming version of the assistant - yields chunks as they're generated
 * @param {Object} params - Parameters for the streaming call
 * @param {string} params.userId - User ID
 * @param {string} params.role - User role (student/instructor)
 * @param {Array} params.messages - Conversation messages
 * @param {Object} params.filter - Optional filter for Pinecone queries
 * @param {Function} params.onChunk - Callback for each chunk
 * @param {Function} params.onDone - Callback when streaming is complete
 */
export async function streamingAssistant({ userId, role, messages, filter, onChunk, onDone }) {
    if (!userId || !role) {
        throw new Error("Missing userId or role");
    }

    const currentQuery = messages[messages.length - 1].content;

    // 1. Classify query intent
    const intent = classifyQueryIntent(currentQuery);
    console.log('[StreamingAssistant] Query intent:', intent.primaryFocus);

    // 2. Build filter
    let baseFilter = {};
    if (role === 'student') {
        baseFilter = { user_participant: { '$eq': userId } };
    } else if (role === 'instructor') {
        baseFilter = { user_instructor_id: { '$eq': userId } };
    }
    const combinedFilter = { ...baseFilter, ...(filter || {}) };

    // 3. Prepare context (skip for general questions)
    let contextBlock = '';

    if (!(intent.isGeneralQuestion && !intent.hasPracticalRef && !intent.hasStudentRef)) {
        // Compute embedding and retrieve context
        const queryEmbedding = await computeEmbedding(currentQuery);
        const { practicalMatches, commentMatches, transcriptMatches } =
            await smartRetrieval(queryEmbedding, combinedFilter, intent);

        console.log(`[StreamingAssistant] Retrieved: ${practicalMatches.length} practicals, ${commentMatches.length} comments, ${transcriptMatches.length} transcripts`);

        const practicalContext = buildContextWithLimit(
            practicalMatches,
            CONFIG.MAX_CONTEXT_TOKENS * 0.2,
            (m) => `Practical: ${m.metadata.practical_name} | Rating: ${m.metadata.avg_rating || 'N/A'} | Tasks: ${m.metadata.tasks || 'N/A'}`
        );

        const commentContext = buildContextWithLimit(
            commentMatches,
            CONFIG.MAX_CONTEXT_TOKENS * 0.3,
            (m) => `Feedback: ${m.metadata.text || m.metadata.feedback_text || JSON.stringify(m.metadata)}`
        );

        // Give transcripts the largest share - they have the most actionable detail
        const transcriptContext = buildContextWithLimit(
            transcriptMatches,
            CONFIG.MAX_CONTEXT_TOKENS * 0.5,
            (m) => `[${formatTimestamp(m.metadata.start_time)}] (${m.metadata.practical_name}): "${m.metadata.text}"`
        );

        if (practicalContext.context) {
            contextBlock += `\n\nRelevant Practicals:\n${practicalContext.context}`;
        }
        if (commentContext.context) {
            contextBlock += `\n\nFeedback & Comments:\n${commentContext.context}`;
        }
        if (transcriptContext.context) {
            contextBlock += `\n\nVideo Transcript Excerpts:\n${transcriptContext.context}`;
        }
    }

    if (!contextBlock) {
        contextBlock = '\n\nNo specific context found for this query.';
    }

    // 4. Build system prompt
    const systemPrompt = buildSystemPrompt(role, intent) + contextBlock;

    // 5. Compact messages
    const compactedMessages = compactConversation(messages);

    // 6. Stream from OpenAI directly using fetch for better control
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                ...compactedMessages.map(m => ({ role: m.role, content: m.content }))
            ],
            temperature: 0.2,
            max_tokens: 600,
            stream: true,
        }),
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        continue;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            fullContent += content;
                            onChunk(content);
                        }
                    } catch (e) {
                        // Ignore parse errors for incomplete chunks
                    }
                }
            }
        }
    } finally {
        reader.releaseLock();
    }

    onDone(fullContent);
    return fullContent;
}

export { classifyQueryIntent, compactConversation, CONFIG };
