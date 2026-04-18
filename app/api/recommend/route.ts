import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { pipeline } from '@xenova/transformers';

// Force dynamic to allow file reading
export const dynamic = 'force-dynamic';

interface ItemMeta {
  id: string;
  external_id?: string;
  type: string;
  title: string;
  genres: string[];
  popularity: number;
  text: string;
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
      const buffer = fs.readFileSync(embPath);
      const npyData = parseNpy(buffer);
      catCache.embeddings = npyData.data;
      catCache.dimension = npyData.shape[1];
      console.log(`Loaded ${npyData.shape[0]} embeddings with dimension ${npyData.shape[1]}`);
    } else {
      console.warn(`Embeddings not found for ${category} at ${embPath}`);
    }
  }

  if (!catCache.metadata) {
    console.log(`Loading metadata for ${category} from items.json...`);
    const itemsPath = path.join(process.cwd(), 'data', folder, 'items.json');
    if (fs.existsSync(itemsPath)) {
      const data = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));
      const rawItems = data.items || [];
      
      catCache.metadata = rawItems.map((item: any) => ({
        ...item,
        // Ensure genres are clean
        genres: (item.genres || []).map((g: string) => g.trim()),
        // Ensure external_id is present
        external_id: item.external_id || item.id.split('_')[1]
      }));
    } else {
      console.warn(`Items file not found for ${category}`);
      catCache.metadata = [];
    }
  }

  return catCache;
}

function parseNpy(buffer: Buffer): { data: Float32Array; shape: number[] } {
  const headerLen = buffer.readUInt16LE(8);
  const headerStr = buffer.toString('ascii', 10, 10 + headerLen);
  const shapeMatch = headerStr.match(/'shape':\s*\((\d+),\s*(\d+)\)/);
  const shape = shapeMatch ? [parseInt(shapeMatch[1]), parseInt(shapeMatch[2])] : [0, 384];
  const dataStart = 10 + headerLen;
  const dataBuffer = buffer.slice(dataStart);
  const data = new Float32Array(dataBuffer.buffer, dataBuffer.byteOffset, dataBuffer.length / 4);
  return { data, shape };
}

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

async function search(category: string, query: string, k: number = 10) {
  const catCache = await loadCategory(category);
  const embedder = await getEmbedder();
  
  if (!catCache.embeddings || !catCache.metadata || catCache.metadata.length === 0) {
    return [];
  }

  const output = await embedder(query, { pooling: 'mean', normalize: true });
  const queryVector = Array.from(output.data) as number[];
  
  const dim = catCache.dimension;
  const numItems = catCache.metadata.length;
  const lowerQuery = query.toLowerCase();
  
  // Extract potential genres from query for boosting
  const allGenres = Array.from(new Set(catCache.metadata.flatMap(m => m.genres.map(g => g.toLowerCase()))));
  const queryGenres = allGenres.filter(g => lowerQuery.includes(g));

  const results = [];
  for (let i = 0; i < numItems; i++) {
    const item = catCache.metadata[i];
    const semanticSim = cosineSimilarity(queryVector, catCache.embeddings, i * dim, dim);
    
    // Keyword match boost
    const title = item.title.toLowerCase();
    let keywordBoost = 0;
    if (title.includes(lowerQuery)) {
      keywordBoost = 1.0;
    } else {
      const queryTerms = lowerQuery.split(/\s+/).filter(t => t.length > 2);
      const matches = queryTerms.filter(term => title.includes(term)).length;
      if (queryTerms.length > 0) keywordBoost = matches / queryTerms.length;
    }

    // Genre boost
    let genreBoost = 0;
    if (queryGenres.length > 0) {
      const itemGenres = item.genres.map(g => g.toLowerCase());
      const genreMatches = queryGenres.filter(g => itemGenres.includes(g)).length;
      genreBoost = genreMatches / queryGenres.length;
    }

    // Popularity is already normalized 0-1 in our data prep
    const popularity = item.popularity || 0;

    // Weighting: 40% Semantic, 25% Keyword, 15% Genre, 20% Popularity
    const finalScore = (0.4 * semanticSim) + (0.25 * keywordBoost) + (0.15 * genreBoost) + (0.2 * popularity);

    results.push({
      ...item,
      score: finalScore,
      similarity: semanticSim,
      keywordBoost,
      genreBoost,
      reason: genreBoost > 0 ? `Matches genre intent: ${queryGenres.join(', ')}` : undefined
    });
  }
  
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, query, k = 10 } = body;
    
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
