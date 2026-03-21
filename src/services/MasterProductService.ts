// src/services/MasterProductService.ts

import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { db, MasterProduct } from '../database/db';
import { toast } from 'react-hot-toast';

export class MasterProductService {
  private isDownloading: boolean = false;

  // Search for a product by barcode (GTIN)
  async findByBarcode(barcode: string): Promise<MasterProduct | null> {
    // 1. Check local master database first
    const localProduct = await db.masterProducts.where('gtin').equals(barcode).first();
    if (localProduct) return localProduct;

    // 2. If not found locally and online, check Supabase
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('master_products')
          .select('*')
          .eq('gtin', barcode)
          .eq('is_active', true)
          .single();

        if (error) {
          if (error.code !== 'PGRST116') { // PGRST116 is "no rows found"
            console.error('Supabase master product search error:', error);
          }
          return null;
        }

        if (data) {
          // Cache it locally for future use
          await db.masterProducts.put(data);
          return data;
        }
      } catch (error) {
        console.error('Failed to search master product online:', error);
      }
    }

    return null;
  }

  // Alias for findByBarcode to match BarcodeScanner expectation
  async lookupByBarcode(barcode: string): Promise<MasterProduct | null> {
    return this.findByBarcode(barcode);
  }

  // Add a master product to the user's local inventory
  async addToInventory(masterProductId: string, userId: string, price?: number): Promise<any> {
    const masterProduct = await db.masterProducts.get(masterProductId);
    if (!masterProduct) {
      throw new Error('Master product not found locally');
    }

    const newProduct = {
      name: masterProduct.product_name + (masterProduct.variant ? ` - ${masterProduct.variant}` : '') + (masterProduct.size ? ` (${masterProduct.size})` : ''),
      barcode: masterProduct.gtin,
      barcodes: [masterProduct.gtin],
      category: masterProduct.subcategory || 'General',
      price: price || masterProduct.suggested_retail_price || 0,
      cost: masterProduct.suggested_cost_price || 0,
      stock: 0,
      minStock: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
      synced: false
    };

    const id = await db.products.add(newProduct);
    return { ...newProduct, id };
  }

  // Download the entire master database for offline use
  async downloadMasterDatabase(): Promise<{ success: boolean; count: number; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, count: 0, error: 'Supabase not configured' };
    }

    if (this.isDownloading) {
      return { success: false, count: 0, error: 'Download already in progress' };
    }

    this.isDownloading = true;
    let totalDownloaded = 0;

    try {
      const supabase = getSupabase();
      
      // We'll download in batches to avoid memory issues
      const batchSize = 1000;
      let lastId = '';
      let hasMore = true;

      toast.loading('Downloading master product database...', { id: 'master-download' });

      while (hasMore) {
        let query = supabase
          .from('master_products')
          .select('*')
          .eq('is_active', true)
          .order('id')
          .limit(batchSize);

        if (lastId) {
          query = query.gt('id', lastId);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (!data || data.length === 0) {
          hasMore = false;
        } else {
          await db.masterProducts.bulkPut(data);
          totalDownloaded += data.length;
          lastId = data[data.length - 1].id;
          
          if (data.length < batchSize) {
            hasMore = false;
          }
        }
      }

      toast.success(`Downloaded ${totalDownloaded} products for offline use`, { id: 'master-download' });
      return { success: true, count: totalDownloaded };
    } catch (error: any) {
      console.error('Failed to download master database:', error);
      toast.error('Failed to download master database: ' + error.message, { id: 'master-download' });
      return { success: false, count: totalDownloaded, error: error.message };
    } finally {
      this.isDownloading = false;
    }
  }

  // Get total count of local master products
  async getLocalCount(): Promise<number> {
    return await db.masterProducts.count();
  }

  // Clear local master database
  async clearLocalDatabase(): Promise<void> {
    await db.masterProducts.clear();
  }
}

export const masterProductService = new MasterProductService();
