'use client';

import { Search } from 'lucide-react';
import { useState, KeyboardEvent } from 'react';

interface Props {
  onSearch: (query: string) => void;
  loading: boolean;
  placeholder?: string;
}

export default function SearchInput({ onSearch, loading, placeholder }: Props) {
  const [query, setQuery] = useState('');

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim() && !loading) {
      onSearch(query);
    }
  };

  return (
    <div className="relative group w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={loading}
        className="w-full bg-transparent border-b-2 border-white/10 py-6 text-2xl font-light focus:outline-none focus:border-primary transition-all duration-500 placeholder:text-white/10 text-white selection:bg-primary selection:text-black"
      />
      
      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-4">
        {loading ? (
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary animate-spin" />
        ) : (
          <button
            onClick={() => query.trim() && onSearch(query)}
            className="p-3 bg-primary text-black hover:scale-110 active:scale-95 transition-all duration-300 group-focus-within:shadow-[0_0_20px_rgba(203,251,69,0.3)]"
          >
            <Search className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
