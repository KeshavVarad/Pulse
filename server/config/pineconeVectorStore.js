// pineconeVectorStore.js
import { VectorStore } from 'langchain/vectorstores/base.js'; // base class
import { PineconeClient } from '@pinecone-database/pinecone';

export class PineconeVectorStore extends VectorStore {
    /**
     * @param {Object} options
     * @param {PineconeClient['Index']} options.index - The Pinecone index instance.
     * @param {string} options.namespace - The namespace to use in your index.
     */
    constructor({ index, namespace }) {
        super();
        this.index = index;
        this.namespace = namespace;
    }

    /**
     * Adds an array of vectors to Pinecone.
     * Each vector should be an object with id, embedding (an array of numbers), and metadata.
     * @param {Array} vectors 
     */
    async addVectors(vectors) {
        const upsertRequest = {
            vectors: vectors.map(v => ({
                id: v.id,
                values: v.embedding,
                metadata: { ...v.metadata },
            })),
            namespace: this.namespace,
        };
        await this.index.upsert({ upsertRequest });
    }

    /**
     * Perform a similarity search given a query embedding.
     * Returns the matching documents.
     * @param {number[]} queryEmbedding 
     * @param {number} topK 
     * @param {object} filter 
     * @returns {Promise<Array>}
     */
    async similaritySearch(queryEmbedding, topK = 10, filter = {}) {
        const queryRequest = {
            vector: queryEmbedding,
            topK,
            includeValues: true,
            includeMetadata: true,
            namespace: this.namespace,
            filter,
        };
        const queryResponse = await this.index.query({ queryRequest });
        // Return the matches (you may want to massage them into a Document format)
        return queryResponse.matches;
    }

    // Implement any additional methods required by LangChain's interface…
}
