'use client';

import { useState } from 'react';
import CategorySelector from './components/CategorySelector';
import SearchInput from './components/SearchInput';
import ResultsGrid from './components/ResultsGrid';
import { Item } from '@/data/schema';
import { motion } from 'framer-motion';

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
        body: JSON.stringify({ category, query, k: 20 })
      });
      const data = await res.json();
      if (data.results) {
        setResults(data.results);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-24 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="z-10 flex flex-col items-center gap-8 w-full max-w-7xl"
      >
        <div className="text-center space-y-4">
          <h1 className="text-6xl md:text-8xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 tracking-tighter">
            Media Sage
          </h1>
          <p className="text-secondary-foreground/80 text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto">
            Your AI-powered guide across Anime, Movies, Books, and Music.
          </p>
        </div>

        <CategorySelector selected={category} onChange={setCategory} />
        
        <SearchInput 
          onSearch={handleSearch} 
          loading={loading} 
          placeholder={
            category === 'anime' ? "Describe the anime (e.g. 'Cyberpunk runners in a dystopia')..." :
            category === 'movie' ? "Describe the plot (e.g. 'Space crew saves humanity')..." :
            category === 'book' ? "Describe the story (e.g. 'Philosophy of a sane society')..." :
            "Describe the vibe (e.g. 'Upbeat electronic dance')..."
          }
        />

        <div className="w-full mt-12 min-h-[400px]">
          {loading ? (
             <div className="flex justify-center pt-20">
               <div className="animate-pulse text-white/20 font-mono">Analying semantics...</div>
             </div>
          ) : (
            <ResultsGrid results={results} />
          )}
          
          {!loading && searched && results.length === 0 && (
             <div className="text-center text-white/30 pt-20 font-mono">
               No semantic matches found. Try a different query.
             </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}
