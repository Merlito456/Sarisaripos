import { CameraService } from '../services/CameraService';
import { BarcodeScanner } from './BarcodeScanner';
import { PhotoDetector } from './PhotoDetector';
import { TextDetector } from './TextDetector';
import { Product, db } from '../database/db';
import { DetectionMode, DetectionResult } from '../types/detection';

export class DetectionManager {
  private cameraService: CameraService;
  private barcodeScanner: BarcodeScanner;
  private photoDetector: PhotoDetector;
  private textDetector: TextDetector;
  private currentMode: DetectionMode = 'auto';
  private videoElement: HTMLVideoElement | null = null;
  private isInitialized: boolean = false;
  private onDetectedCallback?: (result: DetectionResult) => void;
  private productDetectedCallback?: (product: Product) => void;
  private onErrorCallback?: (error: Error) => void;
  
  constructor() {
    this.cameraService = new CameraService();
    this.barcodeScanner = new BarcodeScanner();
    this.photoDetector = new PhotoDetector();
    this.textDetector = new TextDetector();
    
    this.setupCallbacks();
  }
  
  private setupCallbacks(): void {
    this.barcodeScanner.onDetected((product, barcode, masterProduct, units) => {
      this.handleDetection({
        type: 'barcode',
        productId: product?.id || 'unregistered',
        product,
        barcode,
        masterProduct,
        availableUnits: units,
        confidence: 1.0
      });
    });
    
    this.barcodeScanner.onError((error) => {
      console.warn('Barcode scan error:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    });
  }
  
  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    this.videoElement = videoElement;
    
    try {
      // Initialize camera first
      await this.cameraService.initializeCamera(videoElement, {
        facingMode: 'environment',
        timeout: 15000
      });
      
      // Initialize barcode scanner with video element
      await this.barcodeScanner.initialize(videoElement);
      
      // Load AI models in background (don't wait for it)
      this.photoDetector.loadModels().catch(error => {
        console.warn('AI models load failed:', error);
      });

      // Load OCR in background
      this.textDetector.initialize().catch(error => {
        console.warn('OCR initialization failed:', error);
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
      await this.photoDetector.loadModels();
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

  async detectFromText(imageElement: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): Promise<DetectionResult> {
    const text = await this.textDetector.recognizeText(imageElement);
    const products = await this.textDetector.findProductsFromText(text);

    const result: DetectionResult = {
      type: 'text',
      text,
      confidence: products.length > 0 ? 0.8 : 0.2,
      product: products[0],
      multipleMatches: products.length > 1 ? products : undefined
    };

    this.handleDetection(result);
    return result;
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

  async toggleTorch(enabled: boolean): Promise<boolean> {
    return this.cameraService.toggleTorch(enabled);
  }

  hasTorch(): boolean {
    return this.cameraService.hasTorch();
  }

  async setZoom(zoom: number): Promise<boolean> {
    return this.cameraService.setZoom(zoom);
  }

  getZoomCapabilities(): { min: number; max: number; step: number } | null {
    return this.cameraService.getZoomCapabilities();
  }

  async enableAutoFocus(): Promise<void> {
    return this.cameraService.enableAutoFocus();
  }

  onDetected(callback: (result: DetectionResult) => void): void {
    this.onDetectedCallback = callback;
  }

  onProductDetected(callback: (product: Product) => void): void {
    this.productDetectedCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  setUserId(userId: string): void {
    this.barcodeScanner.setUserId(userId);
  }
}

export const detectionManager = new DetectionManager();
