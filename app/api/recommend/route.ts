import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { pipeline } from '@xenova/transformers';

// Force dynamic to allow file reading
export const dynamic = 'force-dynamic';

interface ItemMeta {
  id: string;
  type: string;
  title: string;
  genres: string[];
  popularity: number;
}

type CategoryCache = {
  embeddings: Float32Array | null;
  metadata: ItemMeta[] | null;
  dimension: number;
};

const cache: Record<string, CategoryCache> = {
  anime: { embeddings: null, metadata: null, dimension: 384 },
  movie: { embeddings: null, metadata: null, dimension: 384 },
  book: { embeddings: null, metadata: null, dimension: 384 },
  music: { embeddings: null, metadata: null, dimension: 384 }
};

// Global embedder to save memory
let globalEmbedder: any = null;

async function getEmbedder() {
  if (!globalEmbedder) {
    console.log("Loading feature-extraction model...");
    globalEmbedder = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
  }
  return globalEmbedder;
}

// Map category to folder name
const folderMap: Record<string, string> = {
  anime: 'anime',
  movie: 'movies',
  book: 'books',
  music: 'music'
};

async function loadCategory(category: string) {
  if (!['anime', 'movie', 'book', 'music'].includes(category)) {
    throw new Error("Invalid category");
  }

  const folder = folderMap[category];
  const catCache = cache[category];

  if (!catCache.embeddings) {
    console.log(`Loading embeddings for ${category} from ${folder}...`);
    const embPath = path.join(process.cwd(), 'data', folder, 'embeddings.npy');
    
    if (fs.existsSync(embPath)) {
      // Read .npy file (numpy format)
      const buffer = fs.readFileSync(embPath);
      // Parse numpy header and get data
      const npyData = parseNpy(buffer);
      catCache.embeddings = npyData.data;
      catCache.dimension = npyData.shape[1];
      console.log(`Loaded ${npyData.shape[0]} embeddings with dimension ${npyData.shape[1]}`);
    } else {
      console.warn(`Embeddings not found for ${category} at ${embPath}`);
    }
  }

  if (!catCache.metadata) {
    console.log(`Loading metadata for ${category}...`);
    const metaPath = path.join(process.cwd(), 'data', folder, 'metadata.json');
    if (fs.existsSync(metaPath)) {
      catCache.metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    } else {
      console.warn(`Metadata not found for ${category}`);
      catCache.metadata = [];
    }
  }

  return catCache;
}

// Parse numpy .npy file format
function parseNpy(buffer: Buffer): { data: Float32Array; shape: number[] } {
  // Numpy header starts with magic string \x93NUMPY
  const headerLen = buffer.readUInt16LE(8);
  const headerStr = buffer.toString('ascii', 10, 10 + headerLen);
  
  // Parse shape from header (e.g., "'shape': (10000, 384)")
  const shapeMatch = headerStr.match(/'shape':\s*\((\d+),\s*(\d+)\)/);
  const shape = shapeMatch ? [parseInt(shapeMatch[1]), parseInt(shapeMatch[2])] : [0, 384];
  
  // Data starts after header
  const dataStart = 10 + headerLen;
  const dataBuffer = buffer.slice(dataStart);
  
  // Convert to Float32Array
  const data = new Float32Array(dataBuffer.buffer, dataBuffer.byteOffset, dataBuffer.length / 4);
  
  return { data, shape };
}

// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: Float32Array, offset: number, dim: number): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < dim; i++) {
    const ai = a[i];
    const bi = b[offset + i];
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
}

async function search(category: string, query: string, k: number = 20) {
  console.log(`Searching category: ${category} with query: "${query}"`);
  const catCache = await loadCategory(category);
  const embedder = await getEmbedder();
  
  if (!catCache.embeddings || !catCache.metadata || catCache.metadata.length === 0) {
    console.warn(`Empty category data for ${category}`);
    return [];
  }

  // 1. Embed query
  console.log("Embedding query...");
  const output = await embedder(query, { pooling: 'mean', normalize: true });
  const queryVector = Array.from(output.data) as number[];
  console.log(`Query vector dim: ${queryVector.length}, Sample: ${queryVector.slice(0,5)}`);
  
  const dim = catCache.dimension;
  const numItems = catCache.metadata.length;
  console.log(`Searching against ${numItems} items with dimension ${dim}`);
  
  // 2. Calculate similarities
  const similarities: { idx: number; similarity: number }[] = [];
  for (let i = 0; i < numItems; i++) {
    const sim = cosineSimilarity(queryVector, catCache.embeddings, i * dim, dim);
    if (i < 3) console.log(`Item ${i} sim: ${sim}`); // Debug first few
    similarities.push({ idx: i, similarity: sim });
  }
  
  // 3. Sort by similarity
  similarities.sort((a, b) => b.similarity - a.similarity);
  console.log(`Top similarity: ${similarities[0]?.similarity}`);
  
  // 4. Take top k*2 for reranking
  const topResults = similarities.slice(0, k * 2);
  
  // 5. Rerank with popularity
  const results = topResults.map(({ idx, similarity }) => {
    const item = catCache.metadata![idx];
    const score = (0.8 * similarity) + (0.2 * (item.popularity || 0));
    return { ...item, score, similarity };
  });
  
  // 6. Sort by final score and return top k
  return results.sort((a, b) => b.score - a.score).slice(0, k);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, query, k = 20 } = body;
    
    if (!category || !query) {
      return NextResponse.json({ error: 'Missing category or query' }, { status: 400 });
    }
    
    const results = await search(category, query, parseInt(k));
    
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
