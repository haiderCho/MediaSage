from sentence_transformers import SentenceTransformer
import numpy as np
import json
import os

def main():
    print("Loading model...")
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    
    categories = ['anime', 'movies', 'books', 'music']
    
    for category in categories:
        path = f'data/{category}/items.json'
        if not os.path.exists(path):
            print(f"Skipping {category} (file not found)")
            continue
            
        print(f"Processing {category}...")
        with open(path, 'r') as f:
            data = json.load(f)
            items = data['items']
            
        texts = [item['text'] for item in items]
        
        # Batch encode
        print(f"Encoding {len(texts)} items...")
        embeddings = model.encode(texts, batch_size=64, show_progress_bar=True, normalize_embeddings=True)
        
        out_path = f'data/{category}/embeddings.npy'
        np.save(out_path, embeddings.astype('float32'))
        print(f"Saved to {out_path}")

if __name__ == '__main__':
    main()
