# Media Sage: Engineering a Semantic Search Engine 🧠✨

Welcome to **Media Sage**. This project isn't just a recommendation app; it's an exploration into building a **high-performance semantic search engine** without a heavy backend database.

My goal was to solve a specific problem: **"How do I find media based on a *vibe* or *plot* rather than just a title?"**

> *Query: "A cyberpunk dystopia with psychological themes and neon aesthetics"*
> *Result: Cyberpunk: Edgerunners, Blade Runner 2049, 1984, and Industrial Techno tracks.*

---

## 🛠️ The Architecture

I built this using a **Serverless First** approach. I wanted to see how far I could push a static/serverless stack before needing a dedicated vector database like Pinecone.

- **Frontend**: Next.js 15 (App Router), TailwindCSS, Framer Motion.
- **Search Engine**: Custom-built, pure JavaScript Vector Search running on Vercel Serverless Functions.
- **The "Brain"**: Pre-computed embeddings generated via Python (`sentence-transformers/all-MiniLM-L6-v2`) and stored as optimized binary files (`.npy`).
- **Data Scale**: ~40,000 items (10k per category) to balance performance with Vercel's 50MB function limit.

---

## 🧩 The Core Challenge: Data Quality

The biggest hurdle wasn't the code—it was the **data**. Public datasets (Kaggle, MovieLens) are great for statistics but terrible for semantic understanding.

### 1. "Data Sparsity" & Resource Constraints

I limited the dataset to **10,000 items per category** (Anime, Movies, Books, Music).

- **Why?** Processing 1M+ items requires heavy-duty vector DBs ($$$). I wanted a zero-cost, portable solution.
- **The Trade-off**: I prioritize "Popularity" to ensure the top 10k items are things people actually search for, discarding obscure long-tail content to save resources.

### 2. The "Hollow Data" Problem

Many datasets had titles but no descriptions. A semantic search for *"robots"* would fail on *Neon Genesis Evangelion* if the dataset only says `{"Title": "Eva", "Year": 1995}`.

- **The Fix (Data Fusion)**: I engineered a pipeline to merge disparate CSVs. I took the *ranking/popularity* from one dataset and fused it with the *synopsis/metadata* from another (e.g., `anime_with_synopsis.csv`), creating a "Rich Text" field for the AI to read.

### 3. The "Float vs Int" Trap

Integrating external APIs (Jikan, TMDB) for images revealed a messy reality: some datasets stored IDs as floats (`1535.0`), others as strings. This caused API calls to 404.

- **The Workaround**: I implemented a strict **ID Sanitization Layer** in the ETL pipeline, forcibly casting and validating IDs before they ever reach the frontend.

---

## 💡 Clever Solutions used

### "Semantic Enrichment"

For Music, a song title isn't enough. Searching for *"sad piano"* won't find *"Moonlight Sonata"* if the text is just "Beethoven".

- **My Solution**: I synthetically generated a `text` field for every item that combines *Artist*, *Genres*, *Tags*, and *Country*. The AI sees: *"Artist: Beethoven. Tags: Classical, Piano, Melancholic. Country: Germany."* — making it historically and emotionally searchable.

### Client-Side "Hydration"

To keep the backend lightweight, I don't store images.

- **My Solution**: The backend returns lightweight metadata (IDs). The frontend then **"hydrates"** the UI by fetching images directly from public APIs (Jikan/TMDB) in real-time. This saves massive amounts of storage and bandwidth.

---

## 🚀 Future Roadmap: The path to "Gold Standard"

While Media Sage is a capable semantic engine, here is how I would scale it to enterprise-grade:

### 1. Hybrid Search (High Feasibility)

Vector search is bad at exact matches (searching "Matrix" might give "Simulation Theory" before the movie "Matrix").

- **Plan**: Implement **Reciprocal Rank Fusion (RRF)** to combine Vector scores with BM25 (Keyword) scores. This gives the best of both worlds.

### 2. Real-Time Indexing (High Complexity)

Currently, the index is static. Adding a new movie requires a rebuild.

- **Plan**: Migrate to a managed vector store (Weaviate/Pinecone) to allow live insertions.

### 3. Better Data = Better AI

The current model understands *plot*. To understand *user intent* (e.g., "movies that make me cry"), I need **User Review Data**.

- **Plan**: Scrape/ingest user reviews and perform Sentiment Analysis to tag items with emotions ("Sad", "Inspiring", "Tense").

---

## 📦 Run it yourself

### Prerequisites

- Node.js 18+
- Python 3.10+ (for the data pipeline)

### Setup

```bash
npm install
pip install pandas scikit-learn sentence-transformers torch numpy
```

### The Data Pipeline

If you want to see the ETL process in action:

```bash
# 1. Clean & Enriched Data
python data/scripts/prepare_anime.py  # ...and others

# 2. Generate Embeddings (The AI part)
python data/scripts/generate_embeddings.py

# 3. Build Vector Indices
python data/scripts/build_indices.py
```

### Start the App

```bash
npm run dev
```

For Movie posters, add a `NEXT_PUBLIC_TMDB_API_KEY` to your `.env.local`.
