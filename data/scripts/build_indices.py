import faiss
import numpy as np
import os
import json

def main():
    categories = ['anime', 'movies', 'books', 'music']
    
    for category in categories:
        try:
            emb_path = f'data/{category}/embeddings.npy'
            if not os.path.exists(emb_path):
                print(f"Skipping {category}: embeddings.npy not found")
                continue
                
            print(f"Building index for {category}...")
            embeddings = np.load(emb_path)
            
            if len(embeddings.shape) != 2:
                print(f"Skipping {category}: invalid embedding shape {embeddings.shape}")
                continue
                
            d = embeddings.shape[1]
            
            # IP = Inner Product (Cosine similarity if normalized)
            index = faiss.IndexFlatIP(d)
            index.add(embeddings)
            
            out_path = f'data/{category}/index.faiss'
            faiss.write_index(index, out_path)
            print(f"Saved index to {out_path}")
            
            # Validating
            print(f"Index size: {index.ntotal}")

            # Also create lightweight metadata (no text)
            items_path = f'data/{category}/items.json'
            if not os.path.exists(items_path):
                print(f"Warning: {items_path} not found, skipping metadata")
                continue
                
            with open(items_path, 'r', encoding='utf-8') as f:
                full_items = json.load(f)['items']
                
            metadata = []
            for item in full_items:
                metadata.append({
                    'id': item['id'],
                    'type': item['type'],
                    'title': item['title'],
                    'genres': item['genres'],
                    'popularity': item['popularity']
                })
                
            meta_path = f'data/{category}/metadata.json'
            with open(meta_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f)
            print(f"Saved metadata to {meta_path}")
        except Exception as e:
            print(f"Error processing {category}: {e}")

if __name__ == '__main__':
    main()
