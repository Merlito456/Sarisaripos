import { createWorker } from 'tesseract.js';
import { Product, db } from '../database/db';

export class TextDetector {
  private worker: Tesseract.Worker | null = null;
  private isInitializing: boolean = false;

  constructor() {}

  async initialize(): Promise<void> {
    if (this.worker) return;
    if (this.isInitializing) return;

    this.isInitializing = true;
    try {
      this.worker = await createWorker('eng');
      console.log('Text Recognition (OCR) ready');
    } catch (error) {
      console.error('Failed to initialize OCR:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  async recognizeText(imageSource: string | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): Promise<string> {
    if (!this.worker) {
      await this.initialize();
    }

    if (!this.worker) {
      throw new Error('OCR Worker not initialized');
    }

    const { data: { text } } = await this.worker.recognize(imageSource);
    return text.trim();
  }

  // Search for products based on recognized text
  async findProductsFromText(text: string): Promise<Product[]> {
    if (!text) return [];

    // Clean text: remove special characters, split into keywords
    const keywords = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(k => k.length > 2); // Only keywords with 3+ chars

    if (keywords.length === 0) return [];

    // Simple search in local database
    const allProducts = await db.products.toArray();
    
    // Score products based on keyword matches
    const scoredProducts = allProducts.map(product => {
      let score = 0;
      const productName = product.name.toLowerCase();
      const productBrand = (product.brand || '').toLowerCase();

      keywords.forEach(keyword => {
        if (productName.includes(keyword)) score += 2;
        if (productBrand.includes(keyword)) score += 1;
      });

      return { product, score };
    });

    // Filter and sort
    return scoredProducts
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(p => p.product)
      .slice(0, 5);
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
