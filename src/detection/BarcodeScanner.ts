import { BrowserMultiFormatReader, Result } from '@zxing/library';
import { Product, MasterProduct, ProductUnit, db } from '../database/db';
import { masterProductService } from '../services/MasterProductService';
import { premiumService } from '../services/PremiumService';

export class BarcodeScanner {
  private codeReader: BrowserMultiFormatReader;
  private isScanning: boolean = false;
  private videoElement: HTMLVideoElement | null = null;
  private onDetectedCallback?: (product: Product, barcode: string, masterProduct?: MasterProduct, units?: ProductUnit[]) => void;
  private onErrorCallback?: (error: Error) => void;
  private userId?: string;
  
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
    
    // Step 1: Check user's local inventory first
    const product = await this.findProductByBarcode(cleanedBarcode);
    
    if (product) {
      this.onDetectedCallback(product, cleanedBarcode);
      this.playBeep();
      return;
    }

    // Step 2: Check if user is premium
    const isPremium = await premiumService.isUserPremium(this.userId);
    
    if (!isPremium) {
      // Free user - show upgrade prompt
      this.onErrorCallback?.(new Error(
        'Premium feature: Upgrade to add products from barcode scanning'
      ));
      return;
    }
    
    // Step 3: Premium user - lookup in master database
    try {
      const result = await masterProductService.lookupByBarcode(cleanedBarcode);
      
      if (result) {
        const { masterProduct, matchedUnit, units } = result;
        
        // If it's a direct unit match, we can add it directly
        if (matchedUnit && matchedUnit.barcode === cleanedBarcode) {
          const newProduct = await masterProductService.addToInventory(
            masterProduct.id,
            this.userId || 'anonymous',
            matchedUnit.id,
            matchedUnit.sellingPrice
          );
          
          if (newProduct) {
            this.onDetectedCallback(newProduct, cleanedBarcode, masterProduct, units);
            this.playBeep();
          }
        } else {
          // It's a master product match (GTIN), let the UI handle unit selection
          // We pass a "virtual" product that isn't in inventory yet
          const virtualProduct: Product = {
            name: masterProduct.product_name,
            price: masterProduct.suggested_retail_price || 0,
            cost: masterProduct.suggested_cost_price || 0,
            stock: 0,
            minStock: 0,
            category: masterProduct.subcategory || 'General',
            barcode: cleanedBarcode,
            masterProductId: masterProduct.id,
            userId: this.userId || 'anonymous',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          this.onDetectedCallback(virtualProduct, cleanedBarcode, masterProduct, units);
          this.playBeep();
        }
      } else {
        this.onErrorCallback?.(new Error(`Product not found in master database: ${cleanedBarcode}`));
      }
    } catch (error) {
      console.error('Master lookup error:', error);
      this.onErrorCallback?.(error instanceof Error ? error : new Error('Master lookup failed'));
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
  
  onDetected(callback: (product: Product, barcode: string, masterProduct?: MasterProduct, units?: ProductUnit[]) => void): void {
    this.onDetectedCallback = callback;
  }
  
  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }
}
