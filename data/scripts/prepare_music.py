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
    print("Processing Music...")
    input_file = 'data/raw/music/music_artists.csv'
    output_file = 'data/music/items.json'

    if not os.path.exists(os.path.dirname(output_file)):
        os.makedirs(os.path.dirname(output_file))

    try:
        # Columns: mbid, artist_mb, artist_lastfm, country_mb, country_lastfm, tags_mb, tags_lastfm, listeners_lastfm, scrobbles_lastfm, ambiguous_artist
        df = pd.read_csv(input_file, on_bad_lines='skip')
    except Exception as e:
        print(f"Error reading {input_file}: {e}")
        return

    mapping = {
        'title': ['artist_lastfm', 'artist_mb', 'name', 'title'],
        'genres': ['tags_lastfm', 'tags_mb', 'genres'],
        'popularity': ['listeners_lastfm', 'popularity'],
        'country': ['country_lastfm', 'country_mb', 'country']
    }
    
    df = normalize_cols(df, mapping)
    df['type'] = 'music'
    
    # Clean numeric
    if 'popularity' in df.columns:
        df['popularity_raw'] = pd.to_numeric(df['popularity'], errors='coerce').fillna(0)
    else:
        df['popularity_raw'] = 0
    
    # Filter
    df = df.dropna(subset=['title', 'genres'])
    df['country'] = df.get('country', '').fillna('Unknown')
    
    # Sort by listeners
    df = df.sort_values('popularity_raw', ascending=False).head(10000)
    
    # Normalize
    scaler = MinMaxScaler()
    df['normalized_pop'] = scaler.fit_transform(df[['popularity_raw']])
    
    items = []
    for idx, row in df.iterrows():
        genres = str(row['genres']).replace(';', ',')
        country = str(row['country'])
        
        # Enriched semantic text
        # "Artist: Adele. Tags: soul, pop. Country: United Kingdom. Top Artist..."
        text = f"Artist: {row['title']}. Tags: {genres}. Country: {country}. Popularity: {int(row['popularity_raw'])} listeners."
        
        items.append({
            'id': f"music_{idx}",
            'external_id': str(row.get('mbid', '')),
            'type': 'music',
            'title': str(row['title']),
            'text': text,
            'genres': genres.split(','),
            'popularity': float(row['normalized_pop'])
        })
        
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({'items': items}, f, indent=2)
        
    print(f"Saved {len(items)} music items to {output_file}")

if __name__ == '__main__':
    main()
