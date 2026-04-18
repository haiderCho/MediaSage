'use client';

import { useState } from 'react';
import CategorySelector from './components/CategorySelector';
import SearchInput from './components/SearchInput';
import ResultsGrid from './components/ResultsGrid';
import { Item } from '@/data/schema';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [category, setCategory] = useState('anime');
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);


  const handleSearch = async (query: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, query, k: 10 })
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background relative selection:bg-primary selection:text-black">
      {/* Structural Decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[50vw] h-[100vh] border-l border-white/5" />
        <div className="absolute top-[20vh] left-0 w-full h-[1px] bg-white/5" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row min-h-screen">
        {/* Sidebar / Top Section */}
        <div className="w-full md:w-[450px] p-8 md:p-12 md:sticky md:top-0 md:h-screen flex flex-col gap-12 bg-black/40 backdrop-blur-sm border-r border-white/10">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="space-y-2"
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-[ -0.05em] leading-[0.8] uppercase italic">
              Media<br />
              <span className="text-primary">Sage.</span>
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">
              Semantic Discovery Engine v2.0
            </p>
          </motion.div>

          <div className="space-y-8">
            <div className="space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary/60">01. Select Category</span>
              <CategorySelector selected={category} onChange={setCategory} />
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary/60">02. Describe Vibe</span>
              <SearchInput 
                onSearch={handleSearch} 
                loading={loading} 
                placeholder={
                  category === 'anime' ? "Cyberpunk runners in a dystopia..." :
                  category === 'movie' ? "Interstellar journey through time..." :
                  category === 'book' ? "Ancient mystery in modern Tokyo..." :
                  "Ambient lo-fi for late night coding..."
                }
              />
            </div>
          </div>

          <div className="mt-auto pt-12 border-t border-white/5">
            <div className="flex items-center gap-4 text-white/20 text-[10px] font-mono uppercase tracking-widest">
              <span>Status: Online</span>
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="flex-1 p-8 md:p-20 overflow-y-auto">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full gap-4 pt-20"
              >
                <div className="w-12 h-12 border-2 border-primary border-t-transparent animate-spin" />
                <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-primary">Parsing Semantics</span>
              </motion.div>
            ) : searched && results.length > 0 ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-primary pb-4 gap-4">
                  <div className="space-y-1">
                    <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
                      Top 10 <span className="text-primary">Matches</span>
                    </h2>
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
                      Discovery_Engine_Output_v2.0
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-[10px] text-primary font-bold uppercase tracking-widest">{results.length} Nodes Found</span>
                    <span className="font-mono text-[8px] text-white/20 uppercase">Latency: ~240ms</span>
                  </div>
                </div>
                <ResultsGrid results={results} />
              </motion.div>
            ) : searched ? (
              <motion.div 
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-white/20 font-mono text-[12px] uppercase tracking-widest pt-40"
              >
                No semantic matches found. Try broadening your description.
              </motion.div>
            ) : (
              <motion.div 
                key="hero"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto pt-40"
              >
                <div className="text-[120px] font-bold text-white/[0.02] absolute select-none pointer-events-none">
                  SAGE
                </div>
                <p className="text-lg text-white/40 font-light leading-relaxed">
                  Enter a narrative description in the sidebar to begin. Our AI will rank matches based on semantic context, keyword relevance, and popularity.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

