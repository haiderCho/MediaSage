'use client';

import { useState, useEffect } from 'react';
import { Item } from '@/data/schema';
import { Image as ImageIcon } from 'lucide-react';

interface Props {
  item: Item;
}

export default function ImageCard({ item }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    // Only attempt fetch if we have an external ID and haven't failed already
    if (!item.external_id || error) return;

    const fetchImage = async () => {
      try {
        let url = '';
        
        if (item.type === 'anime') {
          // Jikan API (Free)
          // external_id is '12345' from MAL_ID
          const res = await fetch(`https://api.jikan.moe/v4/anime/${item.external_id}`);
          if (res.status === 429) return; // Rate limit
          const data = await res.json();
          url = data.data?.images?.jpg?.large_image_url;
        } 
        else if (item.type === 'movie') {
          // TMDB API (Requires Key)
          // We assume NEXT_PUBLIC_TMDB_KEY is set or we skip
          const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
          if (apiKey) {
            const res = await fetch(`https://api.themoviedb.org/3/movie/${item.external_id}?api_key=${apiKey}`);
            const data = await res.json();
            if (data.poster_path) {
               url = `https://image.tmdb.org/t/p/w500${data.poster_path}`;
            }
          }
        }
        
        if (mounted && url) {
          setImageUrl(url);
        }
      } catch (err) {
        // console.error(err);
        setError(true);
      }
    };

    // Stagger calls slightly to avoid rate limits if many cards load at once
    const timeout = setTimeout(fetchImage, Math.random() * 1000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [item.type, item.external_id, error]);

  if (error || !imageUrl) {
    return (
      <div className="w-full h-full bg-secondary/50 flex items-center justify-center text-white/10">
        <ImageIcon className="w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={imageUrl} 
        alt={item.title} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
    </div>
  );
}
