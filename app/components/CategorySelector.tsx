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
    <div className="flex flex-wrap justify-center gap-2 p-1 bg-secondary/30 rounded-full border border-white/5 backdrop-blur-sm">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={clsx(
            "relative px-6 py-3 rounded-full flex items-center gap-2 text-sm font-medium transition-colors z-10",
            selected === cat.id ? "text-white" : "text-secondary-foreground hover:text-white"
          )}
        >
          {selected === cat.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-primary/20 bg-noise rounded-full border border-primary/30"
              initial={false}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <cat.icon className="w-4 h-4 relative z-20" />
          <span className="relative z-20 font-display">{cat.label}</span>
        </button>
      ))}
    </div>
  );
}
