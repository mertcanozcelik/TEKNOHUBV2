import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { pipeline } from '@xenova/transformers';

const app = express();
const PORT = 3000;

function sanitizeText(text: string) {
  if (!text) return '';
  return text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

// Simple BM25 Implementation
class BM25 {
  private k1 = 1.5;
  private b = 0.75;
  private docLengths: number[] = [];
  private avgDocLength = 0;
  private docFreqs: Map<string, number> = new Map();
  private termFreqs: Map<string, number>[] = [];
  private idf: Map<string, number> = new Map();
  private docsCount = 0;

  constructor(corpus: string[]) {
    this.docsCount = corpus.length;
    let totalLength = 0;

    corpus.forEach((doc) => {
      const tokens = this.tokenize(doc);
      this.docLengths.push(tokens.length);
      totalLength += tokens.length;

      const tf = new Map<string, number>();
      const uniqueTokens = new Set<string>();

      tokens.forEach(token => {
        tf.set(token, (tf.get(token) || 0) + 1);
        uniqueTokens.add(token);
      });

      this.termFreqs.push(tf);

      uniqueTokens.forEach(token => {
        this.docFreqs.set(token, (this.docFreqs.get(token) || 0) + 1);
      });
    });

    this.avgDocLength = totalLength / (this.docsCount || 1);

    this.docFreqs.forEach((df, term) => {
      const idfValue = Math.log(1 + (this.docsCount - df + 0.5) / (df + 0.5));
      this.idf.set(term, idfValue);
    });
  }

  private tokenize(text: string): string[] {
    // Better Turkish character handling for tokenizer
    const lower = text.toLowerCase()
      .replace(/İ/g, 'i')
      .replace(/I/g, 'ı');
    return lower.replace(/[^\w\sğüşıöç]/gi, '').split(/\s+/).filter(t => t.length > 0);
  }

  search(query: string): number[] {
    const tokens = this.tokenize(query);
    const scores = new Array(this.docsCount).fill(0);
    
    if (tokens.length === 0) return scores;

    tokens.forEach(token => {
      const idf = this.idf.get(token) || 0;
      if (idf === 0) return;

      for (let i = 0; i < this.docsCount; i++) {
        const tf = this.termFreqs[i].get(token) || 0;
        if (tf === 0) continue;

        const docLen = this.docLengths[i];
        const numerator = tf * (this.k1 + 1);
        const denominator = tf + this.k1 * (1 - this.b + this.b * (docLen / this.avgDocLength));
        scores[i] += idf * (numerator / denominator);
      }
    });

    return scores;
  }
}

// Initialize Hugging Face Model
let extractor: any = null;
async function loadModel() {
  if (extractor) return;
  console.log('⏳ Loading embedding model (Xenova/all-MiniLM-L6-v2)...');
  try {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('✅ Hugging Face model loaded.');
  } catch (err: any) {
    console.error('❌ Model load error:', err.message);
    console.warn('⚠️ Semantic search will be disabled. Falling back to keyword search only.');
  }
}
loadModel();

// Cache for query embeddings
const queryCache = new Map<string, number[]>();
const MAX_CACHE_SIZE = 1000;

let taxonomyData: any[] = [];
let bm25: BM25 | null = null;
let isReady = false;

async function init() {
  console.log('Initializing taxonomy data...');
  try {
    const filePath = path.join(process.cwd(), 'src/data/taxonomy_embeddings.json');
    if (!fs.existsSync(filePath)) {
      console.error('ERROR: Taxonomy file not found at', filePath);
      // Fallback to empty data to allow server to start
      taxonomyData = [];
      isReady = true;
      return;
    }
    
    const rawData = fs.readFileSync(filePath, 'utf-8');
    try {
      taxonomyData = JSON.parse(rawData);
    } catch (parseErr: any) {
      console.error('❌ JSON Parse error:', parseErr.message);
      taxonomyData = [];
      isReady = true;
      return;
    }
    
    console.log(`Loaded ${taxonomyData.length} taxonomy items. Building BM25 index...`);
    
    // Initialize BM25
    const corpus = taxonomyData.map(item => 
      `${item.category || ''} ${item.title || ''} ${item.title || ''} ${item.turkishArticle || ''} ${item.article || ''}`
    );
    bm25 = new BM25(corpus);

    isReady = true;
    console.log(`✅ Taxonomy ready: ${taxonomyData.length} items loaded.`);
  } catch (err: any) {
    console.error('❌ Init error:', err.message);
    isReady = true; // Set ready even on error to avoid blocking the UI
  }
}

// Start init
init();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  if (req.path.startsWith('/api') && req.method === 'POST') {
    console.log(`[${timestamp}] Body keys:`, Object.keys(req.body || {}));
  }
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ ready: isReady, count: taxonomyData.length });
});

app.get('/api/test', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

function cosineSimilarity(vecA: number[], vecB: number[]) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  const len = Math.min(vecA.length, vecB.length);
  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    mA += vecA[i] * vecA[i];
    mB += vecB[i] * vecB[i];
  }
  if (mA === 0 || mB === 0) return 0;
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  return dotProduct / (mA * mB);
}

app.post('/api/match', async (req, res) => {
  const { text, topK = 10 } = req.body;
  if (!isReady) return res.status(503).json({ error: 'Sistem henüz hazır değil, lütfen bekleyin.' });
  if (!taxonomyData || taxonomyData.length === 0) return res.status(500).json({ error: 'Taksonomi verisi yüklenemedi veya boş.' });
  if (!text) return res.status(400).json({ error: 'Metin gerekli.' });

  try {
    const sanitizedText = sanitizeText(text);
    console.log(`Matching query: "${sanitizedText.substring(0, 50)}..."`);
    
    // 1. Get embedding for the query using Hugging Face model
    if (!extractor) {
      await loadModel();
    }
    
    if (!extractor) {
      throw new Error('Model not loaded');
    }

    let queryEmbedding: number[];
    if (queryCache.has(sanitizedText)) {
      queryEmbedding = queryCache.get(sanitizedText)!;
      console.log('⚡ Using cached embedding for query');
    } else {
      // all-MiniLM-L6-v2 is symmetric, no prefix needed
      const output = await extractor(sanitizedText, { pooling: 'mean', normalize: true });
      queryEmbedding = Array.from(output.data) as number[];
      
      if (queryCache.size >= MAX_CACHE_SIZE) {
        const firstKey = queryCache.keys().next().value;
        if (firstKey) queryCache.delete(firstKey);
      }
      queryCache.set(sanitizedText, queryEmbedding);
    }

    // 2. Calculate BM25 Scores
    let bm25Scores: number[] = [];
    let maxBm25 = 0.0001; // Avoid division by zero
    if (bm25) {
      bm25Scores = bm25.search(sanitizedText);
      maxBm25 = Math.max(...bm25Scores, 0.0001);
    }

    // 3. Calculate similarities and combine scores (Multi-Vector + BM25)
    const finalMatches = taxonomyData.map((item, idx) => {
      let semanticScore = 0;

      if (extractor && queryEmbedding) {
        // Multi-Vector Search: Title vs Content
        const titleEmb = item.titleEmbedding;
        const contentEmb = item.contentEmbedding;

        if (titleEmb && contentEmb) {
          const titleSim = cosineSimilarity(queryEmbedding, titleEmb);
          const contentSim = cosineSimilarity(queryEmbedding, contentEmb);
          
          // Multi-Vector Weighting: 70% Title, 30% Content
          semanticScore = (titleSim * 0.7) + (contentSim * 0.3);
        } else if (item.embedding) {
          semanticScore = cosineSimilarity(queryEmbedding, item.embedding);
        }
      }
      
      // Normalize BM25 Score
      const normalizedBm25 = bm25 ? (bm25Scores[idx] / maxBm25) : 0;

      // Exact Match Check (Title or Category)
      const lowerQuery = sanitizedText.toLowerCase().trim();
      const lowerTitle = (item.title || '').toLowerCase().trim();
      const lowerCategory = (item.category || '').toLowerCase().trim();
      
      let exactMatchBonus = 0;
      if (lowerQuery === lowerTitle || lowerQuery === lowerCategory) {
        exactMatchBonus = 1.0;
      } else if (lowerTitle.includes(lowerQuery) || lowerCategory.includes(lowerQuery)) {
        exactMatchBonus = 0.5;
      }

      // Hybrid Score Logic:
      // We scale semantic score to be more sensitive. Cosine similarity of 0.4+ is usually good.
      const scaledSemantic = Math.min(1.0, Math.max(0, (semanticScore - 0.2) / 0.6));
      
      // Final Hybrid Score: 50% Semantic, 50% BM25
      // We use a power function to "boost" the perceived match rate
      let finalScore = (scaledSemantic * 0.5) + (normalizedBm25 * 0.5);
      
      // Apply non-linear boost: score = score ^ 0.5 (square root)
      // This makes 0.4 -> 0.63, 0.6 -> 0.77, 0.8 -> 0.89
      finalScore = Math.pow(finalScore, 0.5);

      // Apply exact match bonus
      if (exactMatchBonus > 0) {
        // If it's a partial match (includes), ensure at least 80%
        if (exactMatchBonus === 0.5) {
          finalScore = Math.max(finalScore, 0.8);
        }
        // If it's an exact match, 99%
        if (lowerQuery === lowerTitle || lowerQuery === lowerCategory) {
          finalScore = 0.99;
        }
      }

      return {
        category: item.category,
        title: item.title,
        article: item.article,
        turkishArticle: item.turkishArticle,
        score: Math.min(0.99, finalScore),
        semanticScore: semanticScore,
        bm25Score: normalizedBm25,
        architecture: 'Hybrid (BM25 + Multi-Vector)'
      };
    });

    // 4. Sort and take topK
    const sortedMatches = finalMatches
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    res.json({ matches: sortedMatches });
  } catch (err: any) {
    console.error('❌ Match error:', err.message);
    res.status(500).json({ error: 'Eşleştirme sırasında bir hata oluştu.' });
  }
});

// JSON 404 for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API endpoint bulunamadı: ${req.method} ${req.originalUrl}` });
});

// Vite middleware setup
import { createServer as createViteServer } from 'vite';

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Support Express 5 catch-all, but exclude /api
    app.get('*all', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

startServer();
