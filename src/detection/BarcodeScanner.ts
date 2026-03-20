import { BrowserMultiFormatReader, Result } from '@zxing/library';
import { Product, db } from '../database/db';

export class BarcodeScanner {
  private codeReader: BrowserMultiFormatReader;
  private isScanning: boolean = false;
  private videoElement: HTMLVideoElement | null = null;
  private onDetectedCallback?: (product: Product, barcode: string) => void;
  private onErrorCallback?: (error: Error) => void;
  
  constructor() {
    this.codeReader = new BrowserMultiFormatReader();
  }
  
  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    this.videoElement = videoElement;
    
    return new Promise((resolve, reject) => {
      try {
        // Start decoding from video element
        this.codeReader.decodeFromVideoDevice(
          undefined,
          videoElement,
          (result: Result | null, error: Error | undefined) => {
            if (result && !error) {
              this.handleBarcodeDetected(result.getText());
            }
            if (error && this.onErrorCallback) {
              // NotFoundException is normal when no barcode is in frame, don't log it as an error
              if (error.name !== 'NotFoundException') {
                this.onErrorCallback(error);
              }
            }
          }
        );
        
        this.isScanning = true;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  private async handleBarcodeDetected(barcode: string): Promise<void> {
    if (!this.onDetectedCallback) return;
    
    const cleanedBarcode = barcode.trim();
    const product = await this.findProductByBarcode(cleanedBarcode);
    
    if (product) {
      this.onDetectedCallback(product, cleanedBarcode);
      this.playBeep();
    } else {
      this.onErrorCallback?.(new Error(`Product not found for barcode: ${cleanedBarcode}`));
    }
  }
  
  private async findProductByBarcode(barcode: string): Promise<Product | null> {
    // Search in barcodes array
    const product = await db.products
      .filter(p => p.barcodes ? p.barcodes.includes(barcode) : false)
      .first();
    
    if (product) return product;
    
    // Fallback to single barcode field
    return await db.products.where('barcode').equals(barcode).first() || null;
  }
  
  private playBeep(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 150);
    } catch (e) {
      // Audio context might be blocked by browser
      console.log('Beep not supported');
    }
  }
  
  stopScanning(): void {
    if (this.codeReader) {
      this.codeReader.reset();
      this.isScanning = false;
    }
  }
  
  onDetected(callback: (product: Product, barcode: string) => void): void {
    this.onDetectedCallback = callback;
  }
  
  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }
}
