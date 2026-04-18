'use client';

import { motion } from 'framer-motion';
import { Film, Book, Music, Clapperboard } from 'lucide-react';
import { clsx } from 'clsx';

const categories = [
  { id: 'anime', label: 'Anime', icon: Clapperboard },
  { id: 'movie', label: 'Movies', icon: Film },
  { id: 'book', label: 'Books', icon: Book },
  { id: 'music', label: 'Music', icon: Music },
];

interface Props {
  selected: string;
  onChange: (id: string) => void;
}

export default function CategorySelector({ selected, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 w-full">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={clsx(
            "relative px-4 py-4 border transition-all duration-300 flex items-center gap-3 overflow-hidden group",
            selected === cat.id 
              ? "border-primary bg-primary/10 text-primary" 
              : "border-white/10 text-white/40 hover:border-white/30 hover:text-white"
          )}
        >
          {selected === cat.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary"
              initial={false}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <cat.icon className={clsx(
            "w-5 h-5 transition-transform duration-500",
            selected === cat.id ? "scale-110" : "group-hover:scale-110"
          )} />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">{cat.label}</span>
          
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-primary/0 group-hover:border-primary/40 transition-all" />
        </button>
      ))}
    </div>
  );
}
