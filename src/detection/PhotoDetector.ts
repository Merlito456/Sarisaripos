import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Product, db } from '../database/db';

export interface DetectionBox {
  productId: string;
  productName: string;
  confidence: number;
  bbox?: [number, number, number, number]; // [x, y, width, height]
}

export class PhotoDetector {
  private classificationModel: mobilenet.MobileNet | null = null;
  private detectionModel: cocoSsd.ObjectDetection | null = null;
  private modelPromise: Promise<void> | null = null;
  private productEmbeddings: Map<string, number[]> = new Map();
  private similarityThreshold: number = 0.65; // Adjustable
  
  constructor() {
    this.loadModels().catch(err => console.error('Initial model load failed:', err));
    this.loadProductEmbeddings();
  }
  
  // Load TensorFlow.js models (offline)
  async loadModels(): Promise<void> {
    if (this.classificationModel && this.detectionModel) return;
    if (this.modelPromise) return this.modelPromise;
    
    this.modelPromise = (async () => {
      try {
        // Load MobileNet model for classification/embeddings
        const mobilenetPromise = mobilenet.load({
          version: 2,
          alpha: 1.0
        });

        // Load COCO-SSD for object detection (finding items in frame)
        const cocoSsdPromise = cocoSsd.load();

        const [mModel, dModel] = await Promise.all([mobilenetPromise, cocoSsdPromise]);
        
        this.classificationModel = mModel;
        this.detectionModel = dModel;
        
        console.log('AI Models (Classification & Detection) loaded successfully');
      } catch (error) {
        console.error('Failed to load AI models:', error);
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
    if (!this.classificationModel || !this.detectionModel) {
      await this.loadModels();
    }
    
    if (!this.classificationModel || !this.detectionModel) {
      throw new Error('AI Models not loaded');
    }

    // 1. Detect objects in the frame first (ML Kit style)
    const objects = await this.detectionModel.detect(imageElement);
    
    // Filter for relevant objects (bottles, cups, bowls, etc.)
    const relevantObjects = objects.filter(obj => 
      ['bottle', 'cup', 'bowl', 'food', 'cell phone', 'remote', 'book', 'box'].includes(obj.class) || 
      obj.score > 0.6
    );

    if (relevantObjects.length === 0) {
      // Fallback to whole image if no specific object detected
      return this.processImageRegion(imageElement);
    }

    // 2. Process the most confident detected object
    const bestObject = relevantObjects[0];
    const [x, y, width, height] = bestObject.bbox;

    // Create a temporary canvas to crop the image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(imageElement, x, y, width, height, 0, 0, width, height);
      const matches = await this.processImageRegion(canvas);
      
      // Add bbox info to matches
      return matches.map(m => ({ ...m, bbox: bestObject.bbox as [number, number, number, number] }));
    }

    return this.processImageRegion(imageElement);
  }

  // Internal helper to process a specific image region
  private async processImageRegion(imageSource: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | HTMLCanvasElement): Promise<DetectionBox[]> {
    if (!this.classificationModel) throw new Error('Classification model not ready');

    // Get image embeddings from model
    const imageTensor = tf.browser.fromPixels(imageSource);
    const embeddings = await this.classificationModel.infer(imageTensor, true); // True for embeddings
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
    if (!this.classificationModel) await this.loadModels();
    if (!this.classificationModel) throw new Error('Model not loaded');
    
    // Convert image to tensor
    const imageTensor = tf.browser.fromPixels(imageData);
    
    // Get embeddings
    const embeddings = await this.classificationModel.infer(imageTensor, true);
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
    return this.classificationModel !== null && this.detectionModel !== null;
  }
}
