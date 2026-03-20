import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { Product, db } from '../database/db';

export interface DetectionBox {
  productId: string;
  productName: string;
  confidence: number;
}

export class PhotoDetector {
  private model: mobilenet.MobileNet | null = null;
  private modelPromise: Promise<void> | null = null;
  private productEmbeddings: Map<string, number[]> = new Map();
  private similarityThreshold: number = 0.65; // Adjustable
  
  constructor() {
    this.loadModel().catch(err => console.error('Initial model load failed:', err));
    this.loadProductEmbeddings();
  }
  
  // Load TensorFlow.js model (offline)
  async loadModel(): Promise<void> {
    if (this.model) return;
    if (this.modelPromise) return this.modelPromise;
    
    this.modelPromise = (async () => {
      try {
        // Load MobileNet model
        this.model = await mobilenet.load({
          version: 2,
          alpha: 1.0
        });
        console.log('AI Model loaded successfully');
      } catch (error) {
        console.error('Failed to load AI model:', error);
        this.modelPromise = null; // Allow retry
        throw error;
      }
    })();
    
    return this.modelPromise;
  }
  
  // Load all product embeddings for similarity matching
  async loadProductEmbeddings(): Promise<void> {
    const products = await db.products.toArray();
    
    for (const product of products) {
      if (product.visualFeatures?.embeddings) {
        this.productEmbeddings.set(product.id!, product.visualFeatures.embeddings);
      }
    }
  }
  
  // Detect products from image
  async detectProducts(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<DetectionBox[]> {
    if (!this.model) {
      await this.loadModel();
    }
    
    if (!this.model) {
      throw new Error('AI Model not loaded');
    }
    
    // Get image embeddings from model
    const imageTensor = tf.browser.fromPixels(imageElement);
    const embeddings = await this.model.infer(imageTensor, true); // True for embeddings
    const queryEmbedding = await embeddings.data();
    
    // Find similar products
    const matches = await this.findSimilarProducts(new Float32Array(queryEmbedding));
    
    // Clean up
    imageTensor.dispose();
    embeddings.dispose();
    
    return matches;
  }
  
  // Find products similar to the detected image
  private async findSimilarProducts(queryEmbedding: Float32Array): Promise<DetectionBox[]> {
    const matches: DetectionBox[] = [];
    
    for (const [productId, productEmbedding] of this.productEmbeddings) {
      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(queryEmbedding, new Float32Array(productEmbedding));
      
      if (similarity >= this.similarityThreshold) {
        const product = await db.products.get(productId);
        if (product) {
          matches.push({
            productId: product.id!,
            productName: product.name,
            confidence: similarity
          });
        }
      }
    }
    
    // Sort by confidence (highest first)
    matches.sort((a, b) => b.confidence - a.confidence);
    
    // Return top 5 matches
    return matches.slice(0, 5);
  }
  
  // Calculate cosine similarity between two vectors
  private cosineSimilarity(vecA: Float32Array, vecB: Float32Array): number {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }
    
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    return dotProduct / (magnitudeA * magnitudeB);
  }
  
  // Train/add new product image to improve detection
  async addProductTrainingData(productId: string, imageData: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): Promise<void> {
    if (!this.model) await this.loadModel();
    if (!this.model) throw new Error('Model not loaded');
    
    // Convert image to tensor
    const imageTensor = tf.browser.fromPixels(imageData);
    
    // Get embeddings
    const embeddings = await this.model.infer(imageTensor, true);
    const embeddingData = await embeddings.data();
    
    // Store embeddings for the product
    const embeddingArray = Array.from(embeddingData);
    this.productEmbeddings.set(productId, embeddingArray);
    
    // Update product in database
    const product = await db.products.get(productId);
    if (product) {
      await db.products.update(productId, {
        visualFeatures: {
          ...product.visualFeatures,
          embeddings: embeddingArray,
        },
        timesDetected: (product.timesDetected || 0) + 1,
        lastDetectedAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Clean up
    imageTensor.dispose();
    embeddings.dispose();
  }
  
  // Set similarity threshold
  setSimilarityThreshold(threshold: number): void {
    this.similarityThreshold = Math.min(1, Math.max(0, threshold));
  }
  
  // Get model status
  isModelReady(): boolean {
    return this.model !== null;
  }
}
