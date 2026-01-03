'use client';

import { motion } from 'framer-motion';
import { Item } from '@/data/schema';
import { Star, Zap } from 'lucide-react';
import ImageCard from './ImageCard';

interface ExtendedItem extends Item {
  score?: number;
}

interface Props {
  results: ExtendedItem[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemAnim = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function ResultsGrid({ results }: Props) {
  if (results.length === 0) return null;

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full"
    >
      {results.map((item) => (
        <motion.div
          key={item.id}
          variants={itemAnim}
          className="group relative bg-secondary/30 border border-white/5 rounded-2xl overflow-hidden hover:bg-secondary/50 transition-all flex flex-col h-[400px]"
        >
          {/* Image Section */}
          <div className="h-48 w-full relative overflow-hidden bg-black/50">
             <ImageCard item={item} />
             
             {/* Score Badge Overlay */}
             {item.score && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 text-xs font-mono font-bold bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-primary border border-white/10">
                  <span className="text-primary">{(item.score * 100).toFixed(0)}%</span>
                </div>
             )}
          </div>

          {/* Content Section */}
          <div className="flex flex-col flex-1 p-5 gap-3 relative z-10">
            <h3 className="font-display font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {item.title}
            </h3>
            
            <p className="text-sm text-white/60 line-clamp-3 leading-relaxed">
              {item.text}
            </p>
            
            <div className="flex flex-wrap gap-1 mt-auto pt-2">
              {item.genres.slice(0, 3).map((genre) => (
                <span key={genre} className="text-[10px] uppercase tracking-wider text-secondary-foreground/70 bg-white/5 px-2 py-0.5 rounded-full border border-white/5 mx-0.5">
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
