import pandas as pd
import numpy as np
import json
import os
from sklearn.preprocessing import MinMaxScaler

def normalize_cols(df, mapping):
    # Mapping: { target_name: [possible_source_names] }
    # e.g. 'title': ['Name', 'Title', 'name']
    
    print(f"Columns before: {df.columns.tolist()}")
    
    renames = {}
    for target, sources in mapping.items():
        for source in sources:
            if source in df.columns:
                renames[source] = target
                break
                
    if renames:
        print(f"Renaming: {renames}")
        df = df.rename(columns=renames)
        
    # Check if targets exist
    for target in mapping.keys():
        if target not in df.columns and target != 'type': # type is added manually
             print(f"WARNING: Target column '{target}' missing for current dataset.")
             
    print(f"Columns after: {df.columns.tolist()}")
    return df

def process_anime():
    print("Processing Anime...")
    try:
        df = pd.read_csv('data/raw/anime/anime_dataset.csv', on_bad_lines='skip')
    except Exception as e:
        print(f"CSV Read Error: {e}")
        return []

    mapping = {
        'title': ['Name', 'name', 'English name', 'Title'],
        'popularity': ['Members', 'Score', 'Rating', 'Popularity'],
        'genres': ['Genres', 'genres', 'Genre'],
        'description': ['Synopsis', 'synopsis', 'Description', 'description']
    }
    
    df = normalize_cols(df, mapping)
    df['type'] = 'anime'
    
    if 'popularity' in df.columns and df['popularity'].dtype == 'object':
        df['popularity'] = df['popularity'].astype(str).str.replace(',', '')
        
    df['popularity'] = pd.to_numeric(df.get('popularity', 0), errors='coerce').fillna(0)
    
    cols_to_check = [c for c in ['title', 'description', 'genres'] if c in df.columns]
    df = df.dropna(subset=cols_to_check)
    
    if 'title' not in df.columns: return []

    scaler = MinMaxScaler()
    df['normalized_pop'] = scaler.fit_transform(df[['popularity']])
    df = df.sort_values('normalized_pop', ascending=False).head(10000)
    
    items = []
    for _, row in df.iterrows():
        genres = str(row.get('genres', ''))
        desc = str(row.get('description', ''))
        text = f"{row['title']}. Genres: {genres}. {desc[:300]}"
        
        items.append({
            'id': f"anime_{_}",
            'type': 'anime',
            'title': str(row['title']),
            'text': text,
            'genres': genres.split(', '),
            'popularity': float(row['normalized_pop'])
        })
    return items

def process_movies():
    print("Processing Movies...")
    try:
         # Use engine='python' for more robust parsing of bad lines
         df = pd.read_csv('data/raw/movies/movies_10k.csv', on_bad_lines='skip', engine='python')
    except Exception as e: 
        print(f"Movies CSV Error: {e}")
        return []
    
    mapping = {
        'title': ['original_title', 'title'],
        'genres': ['genre', 'genres'],
        'description': ['overview', 'description', 'tagline'],
        'popularity': ['popularity', 'vote_average']
    }
    df = normalize_cols(df, mapping)
    df['type'] = 'movie'
    
    df['popularity'] = pd.to_numeric(df.get('popularity', 0), errors='coerce').fillna(0)
    cols_to_check = [c for c in ['title', 'description', 'genres'] if c in df.columns]
    df = df.dropna(subset=cols_to_check)
    
    if 'title' not in df.columns: 
        print("Movies: Missing title column after normalization")
        return []

    scaler = MinMaxScaler()
    df['normalized_pop'] = scaler.fit_transform(df[['popularity']])
    df = df.sort_values('normalized_pop', ascending=False).head(10000)
    
    items = []
    for idx, row in df.iterrows():
        text = f"{row['title']}. Genres: {row.get('genres','')}. {str(row.get('description',''))[:300]}"
        items.append({
            'id': f"movie_{idx}",
            'type': 'movie',
            'title': str(row['title']),
            'text': text,
            'genres': str(row.get('genres','')).split(', '),
            'popularity': float(row['normalized_pop'])
        })
    print(f"Movies: Processed {len(items)} items")
    return items

def process_books():
    print("Processing Books...")
    try:
        df = pd.read_csv('data/raw/books/goodreads_data.csv', on_bad_lines='skip')
    except: return []

    mapping = {
        'title': ['Book', 'Title', 'title'],
        'description': ['Description', 'description'],
        'genres': ['Genres', 'genres'],
        'popularity': ['Average Rating', 'rating', 'popularity']
    }
    df = normalize_cols(df, mapping)
    df['type'] = 'book'
    
    df['popularity'] = pd.to_numeric(df.get('popularity', 0), errors='coerce').fillna(0)
    cols_to_check = [c for c in ['title', 'description', 'genres'] if c in df.columns]
    df = df.dropna(subset=cols_to_check)

    if 'title' not in df.columns: 
        print("Books: Missing title column")
        return []
    
    scaler = MinMaxScaler()
    df['normalized_pop'] = scaler.fit_transform(df[['popularity']])
    df = df.sort_values('normalized_pop', ascending=False).head(10000)
    
    items = []
    for idx, row in df.iterrows():
        author = row.get('Author', 'Unknown')
        text = f"{row['title']} by {author}. Genres: {row.get('genres','')}. {str(row.get('description',''))[:300]}"
        items.append({
            'id': f"book_{idx}",
            'type': 'book',
            'title': str(row['title']),
            'text': text,
            'genres': str(row.get('genres','')).split(','),
            'popularity': float(row['normalized_pop'])
        })
    print(f"Books: Processed {len(items)} items")
    return items

def process_music():
    print("Processing Music...")
    try:
        df = pd.read_csv('data/raw/music/music_artists.csv', on_bad_lines='skip')
    except: return []

    mapping = {
        'title': ['artist_lastfm', 'artist_mb', 'name'],
        'genres': ['tags_lastfm', 'tags_mb', 'genres'],
        'popularity': ['listeners_lastfm', 'popularity']
    }
    df = normalize_cols(df, mapping)
    df['type'] = 'music'
    
    df['popularity'] = pd.to_numeric(df.get('popularity', 0), errors='coerce').fillna(0)
    
    cols_to_check = [c for c in ['title', 'genres'] if c in df.columns]
    df = df.dropna(subset=cols_to_check)
    
    if 'title' not in df.columns: 
        print("Music: Missing title column")
        return []

    scaler = MinMaxScaler()
    df['normalized_pop'] = scaler.fit_transform(df[['popularity']])
    df = df.sort_values('normalized_pop', ascending=False).head(10000)
    
    items = []
    for idx, row in df.iterrows():
        genres = str(row.get('genres','')).replace(';', ',')
        text = f"{row['title']}. Genres: {genres}. Top Artist."
        items.append({
            'id': f"music_{idx}",
            'type': 'music',
            'title': str(row['title']),
            'text': text,
            'genres': genres.split(','),
            'popularity': float(row['normalized_pop'])
        })
    print(f"Music: Processed {len(items)} items")
    return items

def main():
    os.makedirs('data/anime', exist_ok=True)
    os.makedirs('data/movies', exist_ok=True)
    os.makedirs('data/books', exist_ok=True)
    os.makedirs('data/music', exist_ok=True)
    
    # Process and save
    try:
        anime = process_anime()
        with open('data/anime/items.json', 'w') as f:
            json.dump({'items': anime}, f)
    except Exception as e:
        print(f"Error processing anime: {e}")

    try:
        movies = process_movies()
        with open('data/movies/items.json', 'w') as f:
            json.dump({'items': movies}, f)
    except Exception as e:
        print(f"Error processing movies: {e}")

    try:
        books = process_books()
        with open('data/books/items.json', 'w') as f:
            json.dump({'items': books}, f)
    except Exception as e:
        print(f"Error processing books: {e}")
        
    try:
        music = process_music()
        with open('data/music/items.json', 'w') as f:
            json.dump({'items': music}, f)
    except Exception as e:
        print(f"Error processing music: {e}")

if __name__ == '__main__':
    main()
