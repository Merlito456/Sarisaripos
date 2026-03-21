import { CameraService } from '../services/CameraService';
import { BarcodeScanner } from './BarcodeScanner';
import { PhotoDetector } from './PhotoDetector';
import { Product, db } from '../database/db';
import { DetectionMode, DetectionResult } from '../types/detection';

export class DetectionManager {
  private cameraService: CameraService;
  private barcodeScanner: BarcodeScanner;
  private photoDetector: PhotoDetector;
  private currentMode: DetectionMode = 'auto';
  private videoElement: HTMLVideoElement | null = null;
  private isInitialized: boolean = false;
  private onDetectedCallback?: (result: DetectionResult) => void;
  private productDetectedCallback?: (product: Product) => void;
  
  constructor() {
    this.cameraService = new CameraService();
    this.barcodeScanner = new BarcodeScanner();
    this.photoDetector = new PhotoDetector();
    
    this.setupCallbacks();
  }
  
  private setupCallbacks(): void {
    this.barcodeScanner.onDetected((product, barcode) => {
      this.handleDetection({
        type: 'barcode',
        productId: product.id!,
        product,
        barcode,
        confidence: 1.0
      });
    });
    
    this.barcodeScanner.onError((error) => {
      console.warn('Barcode scan error:', error);
    });
  }
  
  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    this.videoElement = videoElement;
    
    try {
      // Initialize camera first
      await this.cameraService.initializeCamera(videoElement, {
        facingMode: 'environment',
        timeout: 8000
      });
      
      // Initialize barcode scanner with video element
      await this.barcodeScanner.initialize(videoElement);
      
      // Load AI model in background (don't wait for it)
      this.photoDetector.loadModel().catch(error => {
        console.warn('AI model load failed:', error);
      });
      
      this.isInitialized = true;
      console.log('Detection system ready');
      
    } catch (error) {
      console.error('Failed to initialize detection:', error);
      this.isInitialized = false;
      throw error;
    }
  }
  
  async detectFromPhoto(imageElement: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): Promise<DetectionResult[]> {
    if (!this.photoDetector.isModelReady()) {
      await this.photoDetector.loadModel();
    }
    
    const detections = await this.photoDetector.detectProducts(imageElement);
    const results: DetectionResult[] = [];

    for (const detection of detections) {
      const product = await db.products.get(detection.productId);
      if (product) {
        results.push({
          type: 'photo',
          productId: product.id!,
          product,
          confidence: detection.confidence
        });
      }
    }

    if (results.length > 0) {
      this.handleDetection(results[0]);
    }
    
    return results;
  }
  
  private async handleDetection(result: DetectionResult): Promise<void> {
    // Update product detection stats
    if (result.product && result.product.id) {
      await db.products.update(result.product.id, {
        timesDetected: (result.product.timesDetected || 0) + 1,
        lastDetectedAt: new Date()
      });
    }
    
    // Emit callback
    if (this.onDetectedCallback) {
      this.onDetectedCallback(result);
    }

    if (result.product && this.productDetectedCallback) {
      this.productDetectedCallback(result.product);
    }

    // Dispatch event for UI
    window.dispatchEvent(new CustomEvent('product-detected', {
      detail: result
    }));
  }
  
  setMode(mode: DetectionMode): void {
    this.currentMode = mode;
    console.log(`Detection mode set to: ${mode}`);
  }
  
  async switchCamera(): Promise<void> {
    if (this.videoElement) {
      await this.cameraService.switchCamera();
    }
  }
  
  stopCamera(): void {
    this.cameraService.stopCamera();
    this.barcodeScanner.stopScanning();
    this.isInitialized = false;
  }
  
  isReady(): boolean {
    return this.isInitialized;
  }

  onDetected(callback: (result: DetectionResult) => void): void {
    this.onDetectedCallback = callback;
  }

  onProductDetected(callback: (product: Product) => void): void {
    this.productDetectedCallback = callback;
  }

  setUserId(userId: string): void {
    this.barcodeScanner.setUserId(userId);
  }
}

export const detectionManager = new DetectionManager();
