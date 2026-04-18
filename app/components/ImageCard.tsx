'use client';

import { useState, useEffect, useRef } from 'react';
import { Item } from '@/data/schema';
import { Image as ImageIcon, Search, ShieldAlert } from 'lucide-react';

interface Props {
  item: Item;
}

// Session cache to avoid repeated hits to external APIs
const imageCache: Record<string, string | null> = {};

export default function ImageCard({ item }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(imageCache[item.id] || null);
  const [loading, setLoading] = useState(!imageCache[item.id] && imageCache[item.id] !== null);
  const [error, setError] = useState(imageCache[item.id] === null);
  const fetchAttempted = useRef(false);

  useEffect(() => {
    let mounted = true;
    
    if (imageCache[item.id] !== undefined) {
      if (imageCache[item.id] === null) {
        setError(true);
        setLoading(false);
      } else {
        setImageUrl(imageCache[item.id]);
        setLoading(false);
        setError(false);
      }
      return;
    }

    if (fetchAttempted.current) return;

    const getNumericId = (str: string) => {
      const match = str.match(/\d+/);
      return match ? match[0] : null;
    };

    const extId = item.external_id || getNumericId(item.id);

    const fetchImage = async () => {
      fetchAttempted.current = true;
      try {
        let url = '';
        
        if (item.type === 'anime' && extId) {
          const res = await fetch(`https://api.jikan.moe/v4/anime/${extId}/full`);
          if (res.ok) {
            const data = await res.json();
            url = data.data?.images?.webp?.large_image_url || data.data?.images?.jpg?.large_image_url;
          }
        } 
        else if (item.type === 'movie' && extId) {
          const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || '8264d603a11417079633e66f3f01c360';
          const res = await fetch(`https://api.themoviedb.org/3/movie/${extId}?api_key=${apiKey}`);
          if (res.ok) {
            const data = await res.json();
            if (data.poster_path) url = `https://image.tmdb.org/t/p/w780${data.poster_path}`;
          }
        }
        else if (item.type === 'book') {
          // Google Books API search by title
          const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(item.title)}&maxResults=1`);
          if (res.ok) {
            const data = await res.json();
            if (data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail) {
              // Get higher res version by removing zoom/curl params if they exist or just replacing zoom
              url = data.items[0].volumeInfo.imageLinks.thumbnail.replace('&edge=curl', '').replace('zoom=1', 'zoom=3');
            }
          }
        }
        else if (item.type === 'music' && extId) {
          // AudioDB API using MusicBrainz ID
          // The public API key is '2'
          const res = await fetch(`https://www.theaudiodb.com/api/v1/json/2/artist.php?i=${extId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.artists?.[0]?.strArtistThumb) url = data.artists[0].strArtistThumb;
          }
        }
        
        if (mounted) {
          if (url) {
            imageCache[item.id] = url;
            setImageUrl(url);
            setLoading(false);
            setError(false);
          } else {
            imageCache[item.id] = null;
            setError(true);
            setLoading(false);
          }
        }
      } catch (err) {
        if (mounted) {
          imageCache[item.id] = null;
          setError(true);
          setLoading(false);
        }
      }
    };

    const delay = Math.random() * 2000; // Staggered delay to avoid rate limits
    const timeout = setTimeout(fetchImage, delay);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [item.id, item.type, item.external_id, item.title]);

  if (loading) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center relative overflow-hidden group">
        <div className="absolute inset-0 border-2 border-primary/20 animate-pulse" />
        <div className="absolute inset-0 overflow-hidden opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)] animate-pulse" />
            <div className="w-full h-[2px] bg-primary absolute top-0 left-0 animate-[scan_2s_linear_infinite]" />
        </div>
        <Search className="w-8 h-8 text-primary/40 animate-bounce mb-4" />
        <div className="font-mono text-[8px] tracking-[0.4em] uppercase text-primary animate-pulse">
          Analyzing_Asset_{item.type}...
        </div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="w-full h-full bg-[#050505] flex flex-col items-center justify-center p-6 text-center border-2 border-white/5 group relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <ShieldAlert className="w-10 h-10 mb-4 text-red-500/40 group-hover:text-red-500 transition-colors" />
        <div className="space-y-1 z-10">
            <span className="block text-[8px] font-mono text-red-500/60 uppercase tracking-widest">Signal_Lost</span>
            <span className="block text-[10px] uppercase font-bold text-white/40 group-hover:text-white transition-colors line-clamp-2">
            {item.title}
            </span>
        </div>
        
        <button 
            onClick={() => {
                fetchAttempted.current = false;
                delete imageCache[item.id];
                setLoading(true);
                setError(false);
            }}
            className="mt-6 text-[9px] font-mono uppercase border border-white/10 px-4 py-2 hover:border-primary hover:text-primary transition-all z-10"
        >
            Retry_Sync
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group overflow-hidden bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={imageUrl} 
        alt={item.title} 
        className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 filter grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100"
        loading="lazy"
      />
      
      {/* Brutalist Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 group-hover:opacity-40 transition-opacity duration-700" />
      <div className="absolute inset-0 border-[10px] border-transparent group-hover:border-primary/5 transition-all duration-500 pointer-events-none" />
      
      {/* Cyber-Scan lines */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/40 animate-[scan_4s_linear_infinite]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_2px,3px_100%]" />
      </div>
    </div>
  );
}
