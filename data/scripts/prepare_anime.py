import pandas as pd
import numpy as np
import json
import os
from sklearn.preprocessing import MinMaxScaler

def normalize_cols(df, mapping):
    # Mapping: { target_name: [possible_source_names] }
    print(f"Columns found: {df.columns.tolist()}")
    renames = {}
    for target, sources in mapping.items():
        for source in sources:
            if source in df.columns:
                renames[source] = target
                break
    if renames:
        print(f"Renaming: {renames}")
        df = df.rename(columns=renames)
    return df

def main():
    print("Processing Anime...")
    # Using the new downloaded files from Hernan4444/MyAnimeList-Database
    anime_file = 'data/raw/anime/anime.csv'
    synopsis_file = 'data/raw/anime/anime_with_synopsis.csv'
    output_file = 'data/anime/items.json'
    
    if not os.path.exists(os.path.dirname(output_file)):
        os.makedirs(os.path.dirname(output_file))

    try:
        # Load both datasets
        df_anime = pd.read_csv(anime_file, on_bad_lines='skip')
        df_synopsis = pd.read_csv(synopsis_file, on_bad_lines='skip', usecols=['MAL_ID', 'sypnopsis'])
    except Exception as e:
        print(f"Error reading input files: {e}")
        return

    # Merge on MAL_ID
    # df_synopsis has 'sypnopsis' (typo in source file)
    df = pd.merge(df_anime, df_synopsis, on='MAL_ID', how='left')
    
    mapping = {
        'title': ['Name', 'English name', 'Title'],
        'popularity': ['Members', 'Popularity'], 
        'genres': ['Genres', 'genres'],
        'description': ['sypnopsis', 'Synopsis', 'description']
    }
    
    df = normalize_cols(df, mapping)
    df['type'] = 'anime'

    # Clean popularity (Members)
    if 'popularity' in df.columns:
        if df['popularity'].dtype == 'object':
            df['popularity'] = df['popularity'].astype(str).str.replace(',', '')
        df['popularity'] = pd.to_numeric(df['popularity'], errors='coerce').fillna(0)
    else:
        df['popularity'] = 0

    # Filter
    # We require title and genres. Description is highly desired now.
    cols_to_check = [c for c in ['title', 'genres'] if c in df.columns]
    df = df.dropna(subset=cols_to_check)
    df['description'] = df['description'].fillna('')
    
    if 'title' not in df.columns:
        print("Error: Title column missing")
        return

    # Sort by popularity
    df = df.sort_values('popularity', ascending=False)
    
    # Take top 10k
    df = df.head(10000)
    
    scaler = MinMaxScaler()
    df['normalized_pop'] = scaler.fit_transform(df[['popularity']])
    
    items = []
    for idx, row in df.iterrows():
        genres = str(row.get('genres', ''))
        desc = str(row.get('description', ''))
        
        # Clean text for embedding
        text = f"{row['title']}. Genres: {genres}. {desc[:300]}"
        
        items.append({
            'id': f"anime_{idx}",
            'external_id': str(int(row.get('MAL_ID', 0))),
            'type': 'anime',
            'title': str(row['title']),
            'text': text,
            'genres': genres.split(', '),
            'popularity': float(row['normalized_pop'])
        })
        
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({'items': items}, f, indent=2)
        
    print(f"Saved {len(items)} anime items to {output_file}")

if __name__ == '__main__':
    main()
