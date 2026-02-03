// agenticAssistant.js - AI Assistant with tool-based retrieval (Agentic RAG)

import { index } from '../config/pineconeInit.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_KEY = process.env.OPEN_AI_API_KEY;

/**
 * Tool definitions for OpenAI function calling
 */
const TOOLS = [
    {
        type: 'function',
        function: {
            name: 'search_transcripts',
            description: 'Search video transcripts for specific moments, quotes, or topics. Returns timestamped excerpts from practical session recordings. Use this to find what was said during practicals.',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'What to search for in the transcripts (e.g., "medication administration", "patient communication", "what I said about vitals")'
                    },
                    practical_name: {
                        type: 'string',
                        description: 'Optional: Filter to a specific practical session by name'
                    }
                },
                required: ['query']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_practical_summary',
            description: 'Get summary information about practicals including ratings, tasks performed, and overall performance. Use this to understand how a student performed in their sessions.',
            parameters: {
                type: 'object',
                properties: {
                    practical_name: {
                        type: 'string',
                        description: 'Optional: Filter to a specific practical by name. If not provided, returns recent practicals.'
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximum number of practicals to return (default: 5)'
                    }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'search_feedback',
            description: 'Search instructor feedback and comments. Use this to find specific feedback about skills, behaviors, or areas for improvement.',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'What to search for in feedback (e.g., "communication skills", "areas to improve", "positive feedback")'
                    },
                    practical_name: {
                        type: 'string',
                        description: 'Optional: Filter to feedback from a specific practical'
                    }
                },
                required: ['query']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'list_practicals',
            description: 'List all available practicals for the user with their names and dates. Use this to see what sessions are available before searching.',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    }
];

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
 * Format timestamp as MM:SS
 */
function formatTimestamp(seconds) {
    if (!seconds && seconds !== 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Build base filter based on user role
 */
function buildBaseFilter(userId, role) {
    if (role === 'student') {
        return { user_participant: { '$eq': userId } };
    } else if (role === 'instructor') {
        return { user_instructor_id: { '$eq': userId } };
    }
    return {};
}

/**
 * Tool: Search transcripts
 */
async function executeSearchTranscripts({ query, practical_name }, userId, role) {
    // Handle missing query - use a default search term
    if (!query || query.trim() === '') {
        query = 'practical session conversation';
    }

    const transcriptsNamespace = index.namespace('transcripts');
    const queryEmbedding = await computeEmbedding(query);

    let filter = buildBaseFilter(userId, role);
    if (practical_name) {
        filter.practical_name = { '$eq': practical_name };
    }

    console.log(`[AgenticAssistant] search_transcripts - userId: ${userId}, role: ${role}, filter:`, JSON.stringify(filter));

    const response = await transcriptsNamespace.query({
        vector: queryEmbedding,
        topK: 15,
        includeMetadata: true,
        filter
    });

    console.log(`[AgenticAssistant] search_transcripts - raw matches: ${response.matches?.length || 0}`);

    // Debug: If no matches with filter, try without filter to see if data exists
    if (!response.matches || response.matches.length === 0) {
        const noFilterResponse = await transcriptsNamespace.query({
            vector: queryEmbedding,
            topK: 5,
            includeMetadata: true
        });
        console.log(`[AgenticAssistant] search_transcripts - matches WITHOUT filter: ${noFilterResponse.matches?.length || 0}`);
        if (noFilterResponse.matches?.length > 0) {
            console.log(`[AgenticAssistant] Sample metadata from unfiltered:`, JSON.stringify(noFilterResponse.matches[0].metadata));
        }
    }

    if (!response.matches || response.matches.length === 0) {
        return { results: [], message: 'No transcript matches found for this query.' };
    }

    const results = response.matches
        .filter(m => m.score >= 0.6)
        .map(m => ({
            // Format timestamp as markdown link for navigation: [MM:SS](/practical/id?t=seconds)
            timestamp: `[${formatTimestamp(m.metadata.start_time)}](/practical/${m.metadata.practical_id}?t=${Math.floor(m.metadata.start_time)})`,
            timestamp_display: formatTimestamp(m.metadata.start_time),
            seconds: m.metadata.start_time,
            practical_name: m.metadata.practical_name,
            practical_id: m.metadata.practical_id,
            text: m.metadata.text,
            relevance: Math.round(m.score * 100)
        }));

    return {
        results,
        message: results.length > 0
            ? `Found ${results.length} relevant transcript excerpts.`
            : 'No relevant transcript excerpts found.'
    };
}

/**
 * Tool: Get practical summary
 */
async function executeGetPracticalSummary({ practical_name, limit = 5 }, userId, role) {
    const practicalsNamespace = index.namespace('practicals');

    // Use a general query to get practicals
    const queryText = practical_name || 'practical session performance rating';
    const queryEmbedding = await computeEmbedding(queryText);

    let filter = buildBaseFilter(userId, role);
    if (practical_name) {
        filter.practical_name = { '$eq': practical_name };
    }

    const response = await practicalsNamespace.query({
        vector: queryEmbedding,
        topK: limit,
        includeMetadata: true,
        filter
    });

    if (!response.matches || response.matches.length === 0) {
        return { results: [], message: 'No practicals found.' };
    }

    // Debug: Log first match's creation_date to verify it exists
    if (response.matches.length > 0) {
        console.log(`[AgenticAssistant] get_practical_summary - sample creation_date:`, response.matches[0].metadata.creation_date);
    }

    const results = response.matches.map(m => {
        // Format creation_date if available (this is the Firebase creation date)
        let dateStr = 'N/A';
        if (m.metadata.creation_date) {
            try {
                const date = new Date(m.metadata.creation_date);
                dateStr = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            } catch (e) {
                dateStr = m.metadata.creation_date;
            }
        }

        return {
            name: m.metadata.practical_name,
            rating: m.metadata.avg_rating || 'N/A',
            tasks: m.metadata.tasks || 'N/A',
            date: dateStr,
            practical_id: m.metadata.practical_id
        };
    });

    return {
        results,
        message: `Found ${results.length} practical(s).`
    };
}

/**
 * Tool: Search feedback
 */
async function executeSearchFeedback({ query, practical_name }, userId, role) {
    // Handle missing query - use a default search term
    if (!query || query.trim() === '') {
        query = 'feedback performance comments';
    }

    const commentsNamespace = index.namespace('comments');
    const queryEmbedding = await computeEmbedding(query);

    // Note: Comments namespace doesn't have user_participant/user_instructor_id fields
    // It only has: comment_id, task, timestamp, rating, feedback, and optionally student_tag
    // So we do a semantic search without user filtering for now
    const response = await commentsNamespace.query({
        vector: queryEmbedding,
        topK: 15,
        includeMetadata: true
        // No filter - comments don't have the standard user fields
    });

    if (!response.matches || response.matches.length === 0) {
        return { results: [], message: 'No feedback found for this query.' };
    }

    // Lower threshold to 0.5 to catch more results
    const results = response.matches
        .filter(m => m.score >= 0.5)
        .map(m => ({
            task: m.metadata.task || 'General',
            feedback: m.metadata.feedback || m.metadata.text || 'No feedback text',
            rating: m.metadata.rating,
            relevance: Math.round(m.score * 100)
        }));

    return {
        results,
        message: results.length > 0
            ? `Found ${results.length} relevant feedback comments.`
            : 'No relevant feedback found.'
    };
}

/**
 * Tool: List practicals
 */
async function executeListPracticals(_, userId, role) {
    const practicalsNamespace = index.namespace('practicals');

    // Use a general query to list all practicals
    const queryEmbedding = await computeEmbedding('practical session');
    const filter = buildBaseFilter(userId, role);

    console.log(`[AgenticAssistant] list_practicals - userId: ${userId}, role: ${role}, filter:`, JSON.stringify(filter));

    // Debug: First query WITHOUT filter to see what user_participant values exist
    const debugResponse = await practicalsNamespace.query({
        vector: queryEmbedding,
        topK: 5,
        includeMetadata: true
    });
    console.log(`[AgenticAssistant] DEBUG - practicals WITHOUT filter: ${debugResponse.matches?.length || 0}`);
    if (debugResponse.matches?.length > 0) {
        console.log(`[AgenticAssistant] DEBUG - sample user_participant values:`,
            debugResponse.matches.map(m => m.metadata.user_participant).join(', '));
        console.log(`[AgenticAssistant] DEBUG - sample user_instructor_id values:`,
            debugResponse.matches.map(m => m.metadata.user_instructor_id).join(', '));
    }

    const response = await practicalsNamespace.query({
        vector: queryEmbedding,
        topK: 20,
        includeMetadata: true,
        filter
    });

    console.log(`[AgenticAssistant] list_practicals - raw matches: ${response.matches?.length || 0}`);

    if (!response.matches || response.matches.length === 0) {
        return { results: [], message: 'No practicals found.' };
    }

    // Deduplicate by practical name
    const seen = new Set();
    const results = [];
    for (const m of response.matches) {
        const name = m.metadata.practical_name;
        if (!seen.has(name)) {
            seen.add(name);
            results.push({
                name,
                rating: m.metadata.avg_rating || 'N/A',
                practical_id: m.metadata.practical_id
            });
        }
    }

    return {
        results,
        message: `Found ${results.length} practical(s).`
    };
}

/**
 * Execute a tool call
 */
async function executeTool(toolName, args, userId, role) {
    console.log(`[AgenticAssistant] Executing tool: ${toolName}`, args);

    let result;
    switch (toolName) {
        case 'search_transcripts':
            result = await executeSearchTranscripts(args, userId, role);
            break;
        case 'get_practical_summary':
            result = await executeGetPracticalSummary(args, userId, role);
            break;
        case 'search_feedback':
            result = await executeSearchFeedback(args, userId, role);
            break;
        case 'list_practicals':
            result = await executeListPracticals(args, userId, role);
            break;
        default:
            result = { error: `Unknown tool: ${toolName}` };
    }

    // Log the result summary
    const resultCount = result.results?.length ?? 0;
    console.log(`[AgenticAssistant] Tool ${toolName} returned: ${resultCount} results - ${result.message || ''}`);

    return result;
}

/**
 * Strip JSON artifacts from the beginning of content
 * Returns clean content or empty string if still accumulating
 */
function stripJSONArtifacts(content) {
    if (!content) return '';

    const trimmed = content.trim();

    // If content doesn't start with JSON indicators, it's likely clean
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        return content;
    }

    // Content starts with JSON - need to find where the real response begins
    // Look for markdown headers or common response starters
    const markers = [
        '## Strengths',
        '## Areas',
        '## Key',
        '## Summary',
        '## Improvement',
        '## Based',
        'Based on your',
        'Based on the',
        'Here are',
        'Here is',
        'Looking at',
        'After reviewing',
        'From your',
        'Your recent',
        'I found',
        'The feedback',
        '\n\n##',  // Double newline before header
    ];

    for (const marker of markers) {
        const idx = content.indexOf(marker);
        if (idx !== -1) {
            const cleanContent = content.substring(idx);
            console.log(`[AgenticAssistant] Stripped ${idx} chars of JSON artifacts, found marker: "${marker}"`);
            return cleanContent;
        }
    }

    // If no markers found yet, keep accumulating (return empty to signal we need more content)
    // But if we have accumulated a lot and still no markers, something is wrong
    if (content.length > 5000) {
        console.log('[AgenticAssistant] Warning: Large buffer with no content markers found, attempting fallback');
        // Try to find any double newline followed by text
        const doubleNewline = content.indexOf('\n\n');
        if (doubleNewline !== -1 && doubleNewline < content.length - 10) {
            const afterNewlines = content.substring(doubleNewline + 2);
            // Make sure what follows isn't more JSON
            if (!afterNewlines.trim().startsWith('{') && !afterNewlines.trim().startsWith('[')) {
                return afterNewlines;
            }
        }
        // Last resort: return everything (better than nothing)
        return content;
    }

    return ''; // Keep accumulating
}

/**
 * Build the system prompt
 */
function buildSystemPrompt(role) {
    let prompt = `You are Pulse Assistant, an AI teaching assistant for medical education practicals.`;

    if (role === 'student') {
        prompt += ` You're helping a student review their practical sessions, understand feedback, and improve their skills.`;
    } else if (role === 'instructor') {
        prompt += ` You're helping an instructor review student performances, provide insights, and track progress.`;
    }

    prompt += `

You have access to tools to search the student's data. Use them to find specific information before answering.

Guidelines:
- ALWAYS use tools to search for relevant data before answering questions about practicals, performance, or feedback
- Use search_transcripts to find specific moments in videos
- Use get_practical_summary to get ratings and task information
- Use search_feedback to find instructor comments
- Use list_practicals to see what sessions are available

Timestamp Format (CRITICAL):
- When referencing specific moments from transcripts, ALWAYS include the timestamp EXACTLY as shown in the tool results
- The timestamps from search_transcripts are already formatted as clickable links like [2:34](/practical/abc123?t=154) - use them EXACTLY as provided
- Example: "At [2:34](/practical/abc123?t=154) you demonstrated good communication when asking about allergies"
- NEVER modify the timestamp format - the link structure makes them clickable and navigates to the video
- Only use timestamps that appear in the search results - never make them up
- Include the practical name when referencing timestamps from different sessions

Response Format (when providing feedback summaries):
- Use "## Strengths" for positive aspects
- Use "## Areas to Improve" for constructive feedback
- Use "## Key Moments" when referencing specific video timestamps
- Use bullet points for multiple items

CRITICAL: NEVER include raw JSON, tool call information, or technical data structures in your response. Only provide clean, human-readable text.`;

    return prompt;
}

/**
 * Build a clean synthesis prompt for GPT-5.2
 */
function buildSynthesisSystemPrompt(role) {
    let prompt = `You are Pulse Assistant, an AI teaching assistant for medical education practicals.`;

    if (role === 'student') {
        prompt += ` You're helping a student understand their performance and improve their skills.`;
    } else if (role === 'instructor') {
        prompt += ` You're helping an instructor understand student performance.`;
    }

    prompt += `

IMPORTANT RULES:
1. NEVER output JSON, raw data, tool calls, or technical information
2. NEVER start your response with { or [
3. NEVER include "tool_uses", "recipient_name", "functions.", or similar technical terms
4. Only output clean, human-readable Markdown text
5. Start your response with a natural sentence or a Markdown header like "## "

Response Format:
- Use "## Strengths" for positive aspects
- Use "## Areas to Improve" for constructive feedback
- Use "## Key Moments" when referencing specific video timestamps
- Use bullet points for multiple items
- Include timestamps as clickable links when available (format: [MM:SS](/practical/id?t=seconds))`;

    return prompt;
}

/**
 * Agentic streaming assistant - handles tool calls in a loop
 */
export async function agenticStreamingAssistant({ userId, role, messages, filter, onChunk, onToolCall, onDone }) {
    if (!userId || !role) {
        throw new Error("Missing userId or role");
    }

    const systemPrompt = buildSystemPrompt(role);

    // Build initial messages
    let conversationMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    let maxIterations = 3; // Reduced for speed (was 5)
    let iteration = 0;
    let fullResponse = '';

    while (iteration < maxIterations) {
        iteration++;
        const iterStart = Date.now();
        console.log(`[AgenticAssistant] Iteration ${iteration}`);

        // Call OpenAI with tools - use gpt-4o-mini for faster tool selection
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',  // Faster model for tool selection
                messages: conversationMessages,
                tools: TOOLS,
                tool_choice: 'auto',
                temperature: 0.2,
                max_tokens: 1000,  // gpt-4o-mini uses max_tokens, not max_completion_tokens
            }),
        });
        console.log(`[AgenticAssistant] API call took ${Date.now() - iterStart}ms`);

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[AgenticAssistant] OpenAI API error ${response.status}:`, errorBody);
            throw new Error(`OpenAI API error: ${response.status} - ${errorBody}`);
        }

        const data = await response.json();
        const choice = data.choices[0];
        const assistantMessage = choice.message;

        // Check if the model wants to use tools
        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
            // Add the assistant's message with tool calls
            // Clear any content that might contain raw JSON about tool calls
            const cleanedAssistantMessage = {
                role: 'assistant',
                tool_calls: assistantMessage.tool_calls,
                content: null  // Don't include any content when there are tool calls
            };
            conversationMessages.push(cleanedAssistantMessage);

            // Execute each tool call
            for (const toolCall of assistantMessage.tool_calls) {
                const toolName = toolCall.function.name;
                const toolArgs = JSON.parse(toolCall.function.arguments);

                // Notify about tool call (for UI feedback)
                if (onToolCall) {
                    onToolCall({ name: toolName, args: toolArgs });
                }

                // Execute the tool
                const toolResult = await executeTool(toolName, toolArgs, userId, role);

                // Add tool result to conversation
                conversationMessages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(toolResult)
                });
            }

            // Continue the loop to get the next response
            continue;
        }

        // No tool calls - this is the final response, stream it
        // Check if the content looks like raw JSON (tool call artifacts)
        const rawContent = assistantMessage.content || '';
        const looksLikeJSON = rawContent.trim().startsWith('{') || rawContent.trim().startsWith('[');
        console.log(`[AgenticAssistant] No tool calls. Content: "${rawContent.substring(0, 100) || 'EMPTY'}"${looksLikeJSON ? ' (looks like JSON, will be ignored)' : ''}`);

        // Even if content is empty, we need to make a streaming call to get the actual response
        {
            // Build clean messages for GPT-5.2 synthesis
            // Extract tool results into a structured context, then create a clean prompt
            const toolResults = [];
            let userQuestion = '';

            for (const msg of conversationMessages) {
                if (msg.role === 'user') {
                    userQuestion = msg.content;
                } else if (msg.role === 'tool') {
                    try {
                        const result = JSON.parse(msg.content);
                        if (result.results && result.results.length > 0) {
                            toolResults.push(result);
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            }

            // Build a context summary from tool results
            let contextSummary = '';
            for (const result of toolResults) {
                if (result.results) {
                    for (const item of result.results.slice(0, 10)) { // Limit to 10 items
                        if (item.feedback) {
                            contextSummary += `- Feedback on ${item.task || 'task'}: "${item.feedback}" (Rating: ${item.rating || 'N/A'})\n`;
                        } else if (item.text) {
                            contextSummary += `- At ${item.timestamp_display || 'N/A'} in ${item.practical_name || 'practical'}: "${item.text}"\n`;
                        } else if (item.name) {
                            contextSummary += `- Practical: ${item.name} (Rating: ${item.rating || 'N/A'})\n`;
                        }
                    }
                }
            }

            // Create clean messages for GPT-5.2
            const synthesisPrompt = buildSynthesisSystemPrompt(role);
            const cleanedMessages = [
                { role: 'system', content: synthesisPrompt },
                { role: 'user', content: userQuestion },
            ];

            // Add context as an assistant "thinking" step
            if (contextSummary) {
                cleanedMessages.push({
                    role: 'assistant',
                    content: `I found the following relevant information:\n\n${contextSummary}`
                });
                cleanedMessages.push({
                    role: 'user',
                    content: 'Please provide a comprehensive response based on this information. Format it nicely with markdown headers and bullet points.'
                });
            }

            console.log(`[AgenticAssistant] Prepared ${cleanedMessages.length} clean messages for synthesis (${toolResults.length} tool results summarized)`);

            // For streaming, use gpt-4o-mini for fast synthesis (user can continue in full chat for more depth)
            const streamStart = Date.now();
            const streamResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',  // Fast model for quick insights
                    messages: cleanedMessages,
                    temperature: 0.3,
                    max_tokens: 2000,  // gpt-4o-mini uses max_tokens
                    stream: true,
                }),
            });
            console.log(`[AgenticAssistant] Streaming call (gpt-4o-mini) started after ${Date.now() - streamStart}ms`);

            if (!streamResponse.ok) {
                const errorBody = await streamResponse.text();
                console.error(`[AgenticAssistant] OpenAI streaming API error ${streamResponse.status}:`, errorBody);
                throw new Error(`OpenAI API error: ${streamResponse.status} - ${errorBody}`);
            }

            const reader = streamResponse.body.getReader();
            const decoder = new TextDecoder();

            // Buffer to accumulate content until we're sure we're past any JSON artifacts
            let buffer = '';
            let hasStartedStreaming = false;

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n').filter(line => line.trim() !== '');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') continue;

                            try {
                                const parsed = JSON.parse(data);
                                const content = parsed.choices?.[0]?.delta?.content;
                                if (content) {
                                    if (!hasStartedStreaming) {
                                        // Accumulate in buffer until we find real content
                                        buffer += content;

                                        // Check if buffer contains JSON artifacts that need to be stripped
                                        // Look for patterns like: {"tool_uses":...} [...] followed by actual content
                                        const cleanContent = stripJSONArtifacts(buffer);

                                        if (cleanContent && cleanContent.length > 0) {
                                            // We found clean content, start streaming
                                            hasStartedStreaming = true;
                                            fullResponse += cleanContent;
                                            onChunk(cleanContent);
                                            buffer = ''; // Clear buffer
                                        }
                                    } else {
                                        // Already streaming, just pass through
                                        fullResponse += content;
                                        onChunk(content);
                                    }
                                }
                            } catch (e) {
                                // Ignore parse errors
                            }
                        }
                    }
                }

                // If we never started streaming, the whole response might be clean
                if (!hasStartedStreaming && buffer.length > 0) {
                    const cleanContent = stripJSONArtifacts(buffer);
                    if (cleanContent) {
                        fullResponse += cleanContent;
                        onChunk(cleanContent);
                    }
                }
            } finally {
                reader.releaseLock();
            }
        }

        // We're done
        break;
    }

    onDone(fullResponse);
    return fullResponse;
}

export { TOOLS, executeTool };
