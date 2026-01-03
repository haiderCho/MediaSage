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
    print("Processing Books...")
    input_file = 'data/raw/books/goodreads_data.csv'
    output_file = 'data/books/items.json'

    if not os.path.exists(os.path.dirname(output_file)):
        os.makedirs(os.path.dirname(output_file))

    try:
        # Columns: Unnamed: 0, Book, Author, Description, Genres, Avg_Rating, Num_Ratings, URL
        df = pd.read_csv(input_file, on_bad_lines='skip')
    except Exception as e:
        print(f"Error reading {input_file}: {e}")
        return

    mapping = {
        'title': ['Book', 'Title', 'title'],
        'description': ['Description', 'description'],
        'genres': ['Genres', 'genres'],
        'rating': ['Avg_Rating', 'Average Rating', 'rating', 'Score'],
        'votes': ['Num_Ratings', 'votes']
    }
    
    df = normalize_cols(df, mapping)
    df['type'] = 'book'
    
    # Clean numeric
    # Num_Ratings might have commas
    if 'votes' in df.columns:
        if df['votes'].dtype == 'object':
            df['votes'] = df['votes'].astype(str).str.replace(',', '')
        df['votes'] = pd.to_numeric(df['votes'], errors='coerce').fillna(0)
    else: 
        df['votes'] = 0

    if 'rating' in df.columns:
        df['rating'] = pd.to_numeric(df['rating'], errors='coerce').fillna(0)
    else:
        df['rating'] = 0
    
    # Weighted rating strategy similar to movies
    C = df['rating'].mean()
    m = df['votes'].quantile(0.1)
    
    def weighted_rating(x, m=m, C=C):
        v = x['votes']
        R = x['rating']
        return (v/(v+m) * R) + (m/(m+v) * C)

    df['score'] = df.apply(weighted_rating, axis=1)
    
    # Filter
    df = df.dropna(subset=['title', 'genres'])
    # Description is optional but good
    df['description'] = df['description'].fillna('')
    
    # Sort
    df = df.sort_values('score', ascending=False).head(10000)
    
    # Normalize
    scaler = MinMaxScaler()
    df['normalized_pop'] = scaler.fit_transform(df[['score']])
    
    items = []
    for idx, row in df.iterrows():
        author = str(row.get('Author', 'Unknown'))
        genres = str(row['genres'])
        text = f"{row['title']} by {author}. Genres: {genres}. {str(row['description'])[:300]}"
        
        items.append({
            'id': f"book_{idx}",
            'external_id': str(row.get('URL', '')), 
            'type': 'book',
            'title': str(row['title']),
            'text': text,
            'genres': genres.split(','),
            'popularity': float(row['normalized_pop'])
        })
        
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({'items': items}, f, indent=2)
        
    print(f"Saved {len(items)} book items to {output_file}")

if __name__ == '__main__':
    main()
