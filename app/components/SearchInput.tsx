'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onSearch: (query: string) => void;
  loading: boolean;
  placeholder?: string;
}

export default function SearchInput({ onSearch, loading, placeholder }: Props) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl relative group">
      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder || "What are you looking for?"}
          className="w-full bg-secondary/50 border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-lg text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-secondary/80 transition-all font-sans"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="absolute right-3 p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Search className="w-6 h-6" />
          )}
        </button>
      </div>
    </form>
  );
}
