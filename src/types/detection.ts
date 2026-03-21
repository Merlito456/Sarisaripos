import { Product, ProductUnit, MasterProduct } from '../database/db';

// Detection modes
export type DetectionMode = 'barcode' | 'photo' | 'auto';

// Detection results
export interface DetectionResult {
  type: 'barcode' | 'photo' | 'manual';
  productId?: string;
  product?: Product;
  barcode?: string;
  confidence: number;
  multipleMatches?: Product[];
  availableUnits?: ProductUnit[];
  masterProduct?: MasterProduct;
  imageData?: string; // Base64 of captured image for training
}

// Visual detection data (for AI)
export interface VisualFeatures {
  embeddings?: number[]; // Feature vector for similarity matching (stored as array for IndexedDB)
  sampleImages?: string[]; // Base64 of product images for training
  dominantColors?: string[]; // For color-based matching
  shape?: 'bottle' | 'can' | 'sachet' | 'box' | 'pack';
}

// Philippine product category (Filipino categories)
export interface ProductCategory {
  id: string;
  name: string;
  nameTagalog: string;
  icon: string;
  isActive: boolean;
}
