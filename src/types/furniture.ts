export interface FurnitureItem {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  description?: string;
  category: string;
  style?: string;
  colors: string[];
  source: 'facebook' | 'westelm' | 'cb2';
  url: string;
  location?: string;
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
  };
}

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  style?: string;
  styles?: string[];
  source?: FurnitureItem['source'][];
  roomType?: string;
  colors?: string[];
}

export interface MatchScore {
  overall?: number;
  styleScore?: number;
  colorScore?: number;
  categoryScore?: number;
  priceScore?: number;
  sizeScore?: number;
}

export interface ColorHarmony {
  type: string | null;
  score: number;
}

export interface MatchedItem extends FurnitureItem {
  matchScore?: MatchScore;
  colorMatchScore?: number;
  matchReason?: string;
  harmonies?: ColorHarmony;
  compatibilityScore?: number;
  recommendationScore?: number;
}