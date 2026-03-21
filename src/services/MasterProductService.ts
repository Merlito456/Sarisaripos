// src/services/MasterProductService.ts

import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { db, Product } from '../database/db';
import { premiumService } from './PremiumService';

export interface MasterProduct {
  id: string;
  gtin: string;
  brand: string;
  product_name: string;
  variant: string | null;
  size: string | null;
  category: string;
  suggested_retail_price: number;
  suggested_cost_price: number;
  manufacturer: string;
  image_url: string | null;
}

export interface ScanResult {
  found: boolean;
  fromMaster?: boolean;
  masterProduct?: MasterProduct;
  existingProduct?: Product;
  message: string;
}

class MasterProductService {
  
  // Lookup product by barcode from master database
  async lookupByBarcode(barcode: string): Promise<MasterProduct | null> {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured - master lookup unavailable');
      return null;
    }
    
    try {
      const supabase = getSupabase();
      
      // First lookup via barcode index
      const { data: barcodeData, error: barcodeError } = await supabase
        .from('barcode_index')
        .select('product_id')
        .eq('barcode', barcode)
        .single();
      
      if (barcodeError || !barcodeData) return null;
      
      // Then get product details
      const { data: product, error: productError } = await supabase
        .from('master_products')
        .select(`
          id,
          gtin,
          brand,
          product_name,
          variant,
          size,
          suggested_retail_price,
          suggested_cost_price,
          manufacturer,
          image_url,
          product_categories (name)
        `)
        .eq('id', barcodeData.product_id)
        .single();
      
      if (productError) return null;
      
      return {
        id: product.id,
        gtin: product.gtin,
        brand: product.brand,
        product_name: product.product_name,
        variant: product.variant,
        size: product.size,
        category: (product.product_categories as any)?.name || 'General',
        suggested_retail_price: product.suggested_retail_price,
        suggested_cost_price: product.suggested_cost_price,
        manufacturer: product.manufacturer,
        image_url: product.image_url
      };
      
    } catch (error) {
      console.error('Master lookup failed:', error);
      return null;
    }
  }
  
  // Search master products (for manual addition)
  async searchProducts(query: string, limit: number = 20): Promise<MasterProduct[]> {
    if (!isSupabaseConfigured()) return [];
    
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('master_products')
        .select(`
          id,
          gtin,
          brand,
          product_name,
          variant,
          size,
          suggested_retail_price,
          product_categories (name)
        `)
        .or(`product_name.ilike.%${query}%,brand.ilike.%${query}%,gtin.ilike.%${query}%`)
        .limit(limit);
      
      if (error) return [];
      
      return data.map(item => ({
        id: item.id,
        gtin: item.gtin,
        brand: item.brand,
        product_name: item.product_name,
        variant: item.variant,
        size: item.size,
        category: (item.product_categories as any)?.name || 'General',
        suggested_retail_price: item.suggested_retail_price,
        suggested_cost_price: 0,
        manufacturer: '',
        image_url: null
      }));
      
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }
  
  // Add product to user's local inventory from master
  async addToInventory(
    masterProductId: string,
    userId?: string,
    customPrice?: number,
    customCost?: number
  ): Promise<Product | null> {
    let effectiveUserId = userId;
    
    if (!effectiveUserId && isSupabaseConfigured()) {
      const { data: { user } } = await getSupabase().auth.getUser();
      effectiveUserId = user?.id;
    }
    
    if (!effectiveUserId) {
      throw new Error('User not authenticated');
    }
    
    const status = await premiumService.getPremiumStatus(effectiveUserId);
    
    // Free users can't use master list
    if (!status.isPremium) {
      throw new Error('Premium feature: Upgrade to use barcode scanning');
    }
    
    try {
      const supabase = getSupabase();
      
      // Get master product details
      const { data: master, error: masterError } = await supabase
        .from('master_products')
        .select('*, product_categories(name)')
        .eq('id', masterProductId)
        .single();
      
      if (masterError) throw masterError;
      
      // Check if already in user's inventory in Supabase
      const { data: existing } = await supabase
        .from('user_products')
        .select('*')
        .eq('user_id', effectiveUserId)
        .eq('master_product_id', masterProductId)
        .single();
      
      if (existing) {
        // Update existing product with increased stock
        await supabase
          .from('user_products')
          .update({
            stock_quantity: existing.stock_quantity + 1,
            last_synced: new Date()
          })
          .eq('id', existing.id);
      } else {
        // Add new product to user inventory in Supabase
        await supabase
          .from('user_products')
          .insert({
            user_id: effectiveUserId,
            master_product_id: masterProductId,
            custom_retail_price: customPrice || master.suggested_retail_price,
            custom_cost_price: customCost || master.suggested_cost_price,
            stock_quantity: 1,
            last_synced: new Date()
          });
      }
      
      // Sync to local IndexedDB
      return await this.syncToLocal(master, effectiveUserId, customPrice, customCost);
      
    } catch (error) {
      console.error('Failed to add to inventory:', error);
      throw error;
    }
  }
  
  // Sync master product to local IndexedDB
  private async syncToLocal(
    master: any,
    userId: string,
    customPrice?: number,
    customCost?: number
  ): Promise<Product> {
    const localProduct: Product = {
      name: `${master.brand} ${master.product_name}${master.variant ? ` ${master.variant}` : ''}`,
      category: master.product_categories?.name || 'General',
      barcode: master.gtin,
      barcodes: [master.gtin],
      price: customPrice || master.suggested_retail_price,
      cost: customCost || master.suggested_cost_price,
      stock: 1,
      minStock: 10,
      image: master.image_url,
      timesDetected: 0,
      synced: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Check if product already exists locally by barcode
    const existingLocal = await db.products.where('barcode').equals(master.gtin).first();
    
    if (existingLocal && existingLocal.id) {
      await db.products.update(existingLocal.id, {
        stock: existingLocal.stock + 1,
        updatedAt: new Date(),
        synced: true
      });
      return { ...existingLocal, stock: existingLocal.stock + 1 };
    } else {
      const id = await db.products.add(localProduct);
      return { ...localProduct, id: id.toString() };
    }
  }
  
  // Sync all user products from Supabase to local
  async syncAllUserProducts(userId?: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    try {
      const supabase = getSupabase();
      let effectiveUserId = userId;

      if (!effectiveUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        effectiveUserId = user?.id;
      }

      if (!effectiveUserId) return;
      
      const { data, error } = await supabase
        .from('user_products')
        .select(`
          *,
          master_products (*, product_categories(name))
        `)
        .eq('user_id', effectiveUserId)
        .eq('is_active', true);
      
      if (error) throw error;
      
      for (const item of data) {
        const master = item.master_products;
        await this.syncToLocal(
          master,
          userId,
          item.custom_retail_price,
          item.custom_cost_price
        );
      }
      
      console.log(`Synced ${data.length} products to local`);
      
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}

export const masterProductService = new MasterProductService();
