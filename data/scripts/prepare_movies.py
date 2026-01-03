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
    print("Processing Movies...")
    input_file = 'data/raw/movies/movies_10k.csv'
    output_file = 'data/movies/items.json'

    if not os.path.exists(os.path.dirname(output_file)):
        os.makedirs(os.path.dirname(output_file))
        
    try:
        # Use engine='python' for robust parsing
        df = pd.read_csv(input_file, on_bad_lines='skip', engine='python')
    except Exception as e:
        print(f"Error reading {input_file}: {e}")
        return

    # Columns: Unnamed: 0, id, original_language, original_title, popularity, release_date, vote_average, vote_count, genre, overview, revenue, runtime, tagline
    
    mapping = {
        'title': ['original_title', 'title'],
        'genres': ['genre', 'genres', 'genre_names'],
        'description': ['overview', 'description'],
        'vote_count': ['vote_count'],
        'vote_average': ['vote_average'],
        'tagline': ['tagline']
    }
    
    df = normalize_cols(df, mapping)
    df['type'] = 'movie'
    
    # Calculate Weighted Rating (WR)
    if 'vote_average' not in df.columns or 'vote_count' not in df.columns:
         print("Movies: Missing vote columns for ranking")
         return 

    C = df['vote_average'].mean()
    m = df['vote_count'].quantile(0.1) 
    
    def weighted_rating(x, m=m, C=C):
        v = x['vote_count']
        R = x['vote_average']
        return (v/(v+m) * R) + (m/(m+v) * C)
    
    # Ensure numeric
    df['vote_count'] = pd.to_numeric(df['vote_count'], errors='coerce').fillna(0)
    df['vote_average'] = pd.to_numeric(df['vote_average'], errors='coerce').fillna(0)
    
    df['score'] = df.apply(weighted_rating, axis=1)
    
    # Filter
    df = df.dropna(subset=['title', 'genres', 'description'])
    df['tagline'] = df.get('tagline', '').fillna('')
    
    # Sort by score
    df = df.sort_values('score', ascending=False).head(10000)
    
    # Normalize for API
    scaler = MinMaxScaler()
    df['normalized_pop'] = scaler.fit_transform(df[['score']])
    
    items = []
    for idx, row in df.iterrows():
        genres = str(row.get('genres', '')).replace('[', '').replace(']', '').replace("'", "")
        tagline = str(row['tagline'])
        desc = str(row['description'])
        
        # Enriched semantic text
        text = f"{row['title']}. {tagline}. Genres: {genres}. {desc[:300]}"
        
        items.append({
            'id': f"movie_{idx}",
            'external_id': str(int(row.get('id', 0))),
            'type': 'movie',
            'title': str(row['title']),
            'text': text,
            'genres': genres.split(', '),
            'popularity': float(row['normalized_pop'])
        })
        
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({'items': items}, f, indent=2)
        
    print(f"Saved {len(items)} movie items to {output_file}")

if __name__ == '__main__':
    main()
