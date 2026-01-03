export interface Item {
  id: string;
  external_id?: string;
  type: "anime" | "movie" | "book" | "music";
  title: string;
  text: string; // Content used for embeddings
  genres: string[];
  popularity: number; // Normalized 0-1
}
