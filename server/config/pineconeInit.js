import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
dotenv.config();


// Initialize Pinecone using your API key
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

// Get your index. The second parameter is your index’s unique host URL.
// For example, if your index host is "your-index.svc.us-west1-gcp.pinecone.io", use that.
export const index = pc.index(process.env.PINECONE_INDEX);
