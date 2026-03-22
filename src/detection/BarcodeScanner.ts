import { BrowserMultiFormatReader, Result, BarcodeFormat, DecodeHintType } from '@zxing/library';
import { Product, MasterProduct, ProductUnit, db } from '../database/db';
import { masterProductService } from '../services/MasterProductService';
import { premiumService } from '../services/PremiumService';

// Declare BarcodeDetector for TypeScript
declare global {
  class BarcodeDetector {
    constructor(options?: { formats: string[] });
    detect(image: ImageBitmapSource): Promise<Array<{ rawValue: string; format: string }>>;
    static getSupportedFormats(): Promise<string[]>;
  }
}

export class BarcodeScanner {
  private codeReader: BrowserMultiFormatReader;
  private isScanning: boolean = false;
  private videoElement: HTMLVideoElement | null = null;
  private onDetectedCallback?: (product: Product, barcode: string, masterProduct?: MasterProduct, units?: ProductUnit[]) => void;
  private onErrorCallback?: (error: Error) => void;
  private userId?: string;
  private nativeDetector: any = null;
  private lastScanTime: number = 0;
  private lastScannedValue: string = '';
  private scanFrameId: number | null = null;
  
  constructor() {
    const hints = new Map();
    const formats = [
      BarcodeFormat.EAN_13,
      BarcodeFormat.UPC_A,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.ITF,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.PDF_417,
      BarcodeFormat.AZTEC,
      BarcodeFormat.CODABAR,
      BarcodeFormat.MAXICODE,
      BarcodeFormat.RSS_14,
      BarcodeFormat.RSS_EXPANDED,
      BarcodeFormat.UPC_EAN_EXTENSION
    ];
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.CHARACTER_SET, 'utf-8');
    hints.set(DecodeHintType.ASSUME_GS1, true);
    
    this.codeReader = new BrowserMultiFormatReader(hints);

    // Initialize native detector if supported
    if ('BarcodeDetector' in window) {
      try {
        this.nativeDetector = new BarcodeDetector({
          formats: ['ean_13', 'upc_a', 'ean_8', 'upc_e', 'code_128', 'code_39', 'code_93', 'itf', 'qr_code']
        });
        console.log('[BarcodeScanner] Native BarcodeDetector initialized.');
      } catch (e) {
        console.warn('[BarcodeScanner] Native BarcodeDetector failed to initialize:', e);
      }
    }
  }
  
  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    this.videoElement = videoElement;
    
    // Log master database status
    const count = await masterProductService.getLocalCount();
    console.log(`[BarcodeScanner] Master database has ${count} products.`);
    
    this.isScanning = true;

    if (this.nativeDetector) {
      this.startNativeScan();
    } else {
      this.startZXingScan();
    }
  }

  private startZXingScan() {
    if (!this.videoElement) return;

    try {
      this.codeReader.decodeFromVideoDevice(
        undefined,
        this.videoElement,
        (result: Result | null, error: Error | undefined) => {
          if (!this.isScanning) return;
          if (result && !error) {
            this.handleBarcodeDetected(result.getText());
          }
          if (error && this.onErrorCallback) {
            if (error.name !== 'NotFoundException') {
              this.onErrorCallback(error);
            }
          }
        }
      );
    } catch (error) {
      console.error('[BarcodeScanner] ZXing scan failed:', error);
    }
  }

  private startNativeScan() {
    const scan = async () => {
      if (!this.isScanning || !this.videoElement || !this.nativeDetector) return;

      try {
        // Only scan if video is playing and has dimensions
        if (this.videoElement.readyState >= 2) {
          const barcodes = await this.nativeDetector.detect(this.videoElement);
          if (barcodes.length > 0) {
            const now = Date.now();
            const value = barcodes[0].rawValue;
            // Debounce: 1.5s for same barcode, or immediate for different barcode
            if (value !== this.lastScannedValue || now - this.lastScanTime > 1500) {
              this.lastScanTime = now;
              this.lastScannedValue = value;
              this.handleBarcodeDetected(value);
            }
          }
        }
      } catch (e) {
        // Fallback to ZXing if native fails during runtime
        console.error('[BarcodeScanner] Native scan error, falling back to ZXing:', e);
        this.nativeDetector = null;
        this.startZXingScan();
        return;
      }

      this.scanFrameId = requestAnimationFrame(scan);
    };

    this.scanFrameId = requestAnimationFrame(scan);
  }
  
  private async handleBarcodeDetected(barcode: string): Promise<void> {
    if (!this.onDetectedCallback) return;
    
    const cleanedBarcode = barcode.trim();
    console.log(`[BarcodeScanner] Detected: "${cleanedBarcode}"`);
    
    // Step 1: Check user's local inventory first
    const product = await this.findProductByBarcode(cleanedBarcode);
    
    if (product) {
      console.log(`[BarcodeScanner] Found in local inventory: ${product.name}`);
      this.onDetectedCallback(product, cleanedBarcode);
      this.playBeep();
      return;
    }

    // Step 2: Lookup in master database
    try {
      console.log(`[BarcodeScanner] Searching master database for: ${cleanedBarcode}`);
      const result = await masterProductService.lookupByBarcode(cleanedBarcode);
      
      if (result && (result.product || result.masterProduct)) {
        console.log(`[BarcodeScanner] Found in master database: ${result.product?.name || result.masterProduct?.product_name}`);
        const { masterProduct, matchedUnit, units } = result;
        
        if (matchedUnit && matchedUnit.barcode === cleanedBarcode && masterProduct) {
          const canAdd = await premiumService.canAddProduct();
          if (!canAdd) {
            this.onErrorCallback?.(new Error('Product limit reached. Upgrade to add more products.'));
            return;
          }

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
        } else if (masterProduct) {
          const canAdd = await premiumService.canAddProduct();
          if (!canAdd) {
            this.onErrorCallback?.(new Error('Product limit reached. Upgrade to add more products.'));
            return;
          }

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
        console.log(`[BarcodeScanner] Not found in master database: ${cleanedBarcode}`);
        this.playBeep(); 
        this.onErrorCallback?.(new Error(`Product not registered: ${cleanedBarcode}`));
      }
    } catch (error) {
      console.error('[BarcodeScanner] Master lookup error:', error);
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
    this.isScanning = false;
    if (this.codeReader) {
      this.codeReader.reset();
    }
    if (this.scanFrameId !== null) {
      cancelAnimationFrame(this.scanFrameId);
      this.scanFrameId = null;
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
