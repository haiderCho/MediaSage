'use client';

import { motion } from 'framer-motion';
import { Item } from '@/data/schema';
import { Zap, ChevronRight, Activity, Cpu } from 'lucide-react';
import ImageCard from './ImageCard';

interface ExtendedItem extends Item {
  score?: number;
  similarity?: number;
  keywordBoost?: number;
  genreBoost?: number;
  reason?: string;
}

interface Props {
  results: ExtendedItem[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemAnim = {
  hidden: { x: -20, opacity: 0 },
  show: { 
    x: 0, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 20
    }
  }
};

export default function ResultsGrid({ results }: Props) {
  if (results.length === 0) return null;

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 xl:grid-cols-2 gap-10 w-full pb-32"
    >
      {results.map((item, index) => (
        <motion.div
          key={item.id}
          variants={itemAnim}
          className="group flex flex-col md:flex-row bg-[#080808] border-2 border-white/5 hover:border-primary transition-all duration-700 overflow-hidden relative md:h-[280px]"
        >
          {/* Rank Index */}
          <div className="absolute top-0 left-0 bg-primary text-black px-3 py-1 font-mono text-[10px] font-black z-30 italic">
            #{String(index + 1).padStart(2, '0')}
          </div>

          {/* Image Section */}
          <div className="w-full md:w-48 h-48 md:h-full shrink-0 relative overflow-hidden bg-black border-b md:border-b-0 md:border-r border-white/5 group-hover:border-primary/20 transition-colors">
             <ImageCard item={item} />
          </div>

          {/* Content Section */}
          <div className="flex-1 p-6 flex flex-col gap-4 relative overflow-hidden">
            {/* Background noise effect on hover */}
            <div className="absolute inset-0 bg-noise opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />

            <div className="space-y-2 relative z-10">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none group-hover:text-primary transition-all duration-500">
                {item.title}
              </h3>
              
              <div className="flex flex-wrap gap-1.5">
                {item.genres.slice(0, 5).map((genre) => (
                  <span key={genre} className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/30 bg-white/5 px-2 py-0.5 border border-white/5 group-hover:border-primary/20 group-hover:text-white/60 transition-colors">
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-[13px] text-white/40 line-clamp-3 font-light leading-relaxed group-hover:text-white/70 transition-colors">
              {item.text}
            </p>

            {/* Metrics Grid */}
            <div className="mt-auto grid grid-cols-3 gap-4 pt-4 border-t border-white/5 group-hover:border-primary/20 transition-colors relative z-10">
              <div className="space-y-1">
                 <div className="flex items-center gap-1.5 text-[7px] font-mono uppercase text-white/20 tracking-widest">
                    <Activity className="w-2 h-2" /> Semantic
                 </div>
                 <div className="h-1 w-full bg-white/5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.similarity || 0) * 100}%` }}
                      className="h-full bg-white/40 group-hover:bg-primary transition-colors"
                    />
                 </div>
              </div>
              
              <div className="space-y-1">
                 <div className="flex items-center gap-1.5 text-[7px] font-mono uppercase text-white/20 tracking-widest">
                    <Cpu className="w-2 h-2" /> Keyword
                 </div>
                 <div className="h-1 w-full bg-white/5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.keywordBoost || 0) * 100}%` }}
                      className="h-full bg-white/20 group-hover:bg-primary transition-colors"
                    />
                 </div>
              </div>

              <div className="space-y-1">
                 <div className="flex items-center gap-1.5 text-[7px] font-mono uppercase text-white/20 tracking-widest">
                    <Zap className="w-2 h-2" /> Intent
                 </div>
                 <div className="h-1 w-full bg-white/5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.genreBoost || 0) * 100}%` }}
                      className="h-full bg-white/10 group-hover:bg-primary transition-colors"
                    />
                 </div>
              </div>
            </div>

            {/* Reason Tooltip (if genre matched) */}
            {item.reason && (
               <div className="absolute top-2 right-4 text-[7px] font-mono text-primary/60 uppercase animate-pulse">
                 {item.reason}
               </div>
            )}
            
            <div className="flex items-center justify-between mt-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-500">
               <div className="font-mono text-[12px] font-bold text-primary">
                 {(item.score! * 100).toFixed(0)}% <span className="text-[7px] opacity-40 uppercase tracking-widest ml-1">Match</span>
               </div>
               <button className="flex items-center gap-1 text-[8px] font-mono uppercase tracking-[0.2em] text-white hover:text-primary transition-colors">
                 Access <ChevronRight className="w-3 h-3" />
               </button>
            </div>
          </div>
          
          {/* Decorative side accent */}
          <div className="absolute top-0 right-0 w-[2px] h-0 bg-primary group-hover:h-full transition-all duration-1000" />
        </motion.div>
      ))}
    </motion.div>
  );
}
