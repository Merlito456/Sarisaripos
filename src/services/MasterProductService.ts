// src/services/MasterProductService.ts

import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { db, MasterProduct, ProductUnit, Product } from '../database/db';
import { toast } from 'react-hot-toast';
import masterSeedData from '../database/master_products_seed.json';

export class MasterProductService {
  private isDownloading: boolean = false;

  // Seed the local master database from the embedded JSON file
  async seedFromLocalJson(): Promise<{ success: boolean; count: number }> {
    try {
      const productsToInsert: MasterProduct[] = [];
      const unitsToInsert: ProductUnit[] = [];

      for (const item of masterSeedData) {
        const { units, ...product } = item;
        productsToInsert.push({
          ...product,
          created_at: new Date(),
          updated_at: new Date()
        } as MasterProduct);

        if (units && units.length > 0) {
          units.forEach((u: any) => {
            unitsToInsert.push({
              ...u,
              masterProductId: product.id,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            } as ProductUnit);
          });
        }
      }

      await db.masterProducts.bulkPut(productsToInsert);
      await db.productUnits.bulkPut(unitsToInsert);

      return { success: true, count: productsToInsert.length };
    } catch (error) {
      console.error('Failed to seed master database from JSON:', error);
      return { success: false, count: 0 };
    }
  }

  // Search for a product by barcode (GTIN or unit barcode)
  async findByBarcode(barcode: string): Promise<{ product: MasterProduct; unit?: ProductUnit; units?: ProductUnit[] } | null> {
    // 1. Check local units first (unit-specific barcode)
    const localUnit = await db.productUnits.where('barcode').equals(barcode).first();
    if (localUnit) {
      const product = await db.masterProducts.get(localUnit.masterProductId);
      if (product) {
        const units = await db.productUnits.where('masterProductId').equals(product.id).toArray();
        return { product, unit: localUnit, units };
      }
    }

    // 2. Check local master products (GTIN)
    const localProduct = await db.masterProducts.where('gtin').equals(barcode).first();
    if (localProduct) {
      const units = await db.productUnits.where('masterProductId').equals(localProduct.id).toArray();
      const defaultUnit = units.find(u => u.isDefault) || units[0];
      return { product: localProduct, unit: defaultUnit, units };
    }

    // 3. If not found locally, check Supabase
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase();
        
        // First search in product_units for barcode
        const { data: unitData, error: unitError } = await supabase
          .from('product_units')
          .select('*, master_products(*)')
          .eq('barcode', barcode)
          .eq('is_active', true)
          .single();

        if (unitData && !unitError) {
          const product = unitData.master_products;
          const { master_products, ...unit } = unitData;
          
          // Map to camelCase
          const mappedUnit: ProductUnit = {
            id: unit.id,
            masterProductId: unit.master_product_id,
            unitName: unit.unit_name,
            unitType: unit.unit_type,
            quantity: unit.quantity,
            barcode: unit.barcode,
            sellingPrice: unit.selling_price,
            costPrice: unit.cost_price,
            stockQuantity: unit.stock_quantity || 0,
            isDefault: unit.is_default,
            isActive: unit.is_active,
            createdAt: new Date(unit.created_at),
            updatedAt: new Date(unit.updated_at)
          };

          // Cache locally
          await db.masterProducts.put(product);
          await db.productUnits.put(mappedUnit);
          
          const units = await this.getProductUnits(product.id);
          return { product, unit: mappedUnit, units };
        }

        // If not found in units, search in master_products by GTIN
        const { data: productData, error: productError } = await supabase
          .from('master_products')
          .select('*, product_units(*)')
          .eq('gtin', barcode)
          .eq('is_active', true)
          .single();

        if (productData && !productError) {
          const { product_units, ...product } = productData;
          
          let mappedUnits: ProductUnit[] = [];
          if (product_units && product_units.length > 0) {
            mappedUnits = product_units.map((u: any) => ({
              id: u.id,
              masterProductId: u.master_product_id,
              unitName: u.unit_name,
              unitType: u.unit_type,
              quantity: u.quantity,
              barcode: u.barcode,
              sellingPrice: u.selling_price,
              costPrice: u.cost_price,
              stockQuantity: u.stock_quantity || 0,
              isDefault: u.is_default,
              isActive: u.is_active,
              createdAt: new Date(u.created_at),
              updatedAt: new Date(u.updated_at)
            }));
            await db.productUnits.bulkPut(mappedUnits);
          }
          
          const defaultUnitData = product_units?.find((u: any) => u.is_default) || product_units?.[0];
          let defaultUnit: ProductUnit | undefined;
          if (defaultUnitData) {
            defaultUnit = mappedUnits.find(u => u.id === defaultUnitData.id);
          }
          return { product, unit: defaultUnit, units: mappedUnits };
        }
      } catch (error) {
        console.error('Failed to search master product online:', error);
      }
    }

    return null;
  }

  // Get all units for a master product
  async getProductUnits(masterProductId: string): Promise<ProductUnit[]> {
    // 1. Check local first
    const localUnits = await db.productUnits.where('masterProductId').equals(masterProductId).toArray();
    if (localUnits.length > 0) return localUnits;

    // 2. Check online
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('product_units')
          .select('*')
          .eq('master_product_id', masterProductId)
          .eq('is_active', true);

        if (data && !error) {
          // Map to camelCase
          const units: ProductUnit[] = data.map((u: any) => ({
            id: u.id,
            masterProductId: u.master_product_id,
            unitName: u.unit_name,
            unitType: u.unit_type,
            quantity: u.quantity,
            barcode: u.barcode,
            sellingPrice: u.selling_price,
            costPrice: u.cost_price,
            stockQuantity: u.stock_quantity || 0,
            isDefault: u.is_default,
            isActive: u.is_active,
            createdAt: new Date(u.created_at),
            updatedAt: new Date(u.updated_at)
          }));
          
          await db.productUnits.bulkPut(units);
          return units;
        }
      } catch (error) {
        console.error('Failed to fetch product units online:', error);
      }
    }

    return [];
  }

  // Lookup by barcode and return structured result for detection
  async lookupByBarcode(barcode: string): Promise<{ 
    product?: Product; 
    masterProduct?: MasterProduct; 
    matchedUnit?: ProductUnit;
    units?: ProductUnit[] 
  }> {
    // 1. Check user's local inventory first
    const localProduct = await db.products
      .filter(p => p.barcodes ? p.barcodes.includes(barcode) : false)
      .first() || await db.products.where('barcode').equals(barcode).first();

    if (localProduct) {
      return { product: localProduct };
    }

    // 2. Check master database
    const masterResult = await this.findByBarcode(barcode);
    if (masterResult) {
      return { 
        masterProduct: masterResult.product, 
        matchedUnit: masterResult.unit, 
        units: masterResult.units 
      };
    }

    return {};
  }

  // Search for products by name/brand/variant
  async searchProducts(query: string, limit: number = 20): Promise<MasterProduct[]> {
    if (!query) return [];

    // 1. Search local master database
    const localResults = await db.masterProducts
      .filter(p => 
        p.product_name.toLowerCase().includes(query.toLowerCase()) ||
        (p.brand?.toLowerCase().includes(query.toLowerCase()) || false) ||
        (p.variant?.toLowerCase().includes(query.toLowerCase()) || false)
      )
      .limit(limit)
      .toArray();

    if (localResults.length > 0) return localResults;

    // 2. If not found locally, search online
    return await this.searchOnline(query, limit);
  }

  // Search online using the new PostgreSQL full-text search vector
  async searchOnline(query: string, limit: number = 20): Promise<MasterProduct[]> {
    if (!isSupabaseConfigured()) return [];

    try {
      const supabase = getSupabase();
      
      // Use the search_vector if available, or just ilike on name/brand
      const { data, error } = await supabase
        .from('master_products')
        .select('*')
        .or(`product_name.ilike.%${query}%,brand.ilike.%${query}%,variant.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(limit);

      if (error) {
        console.error('Supabase master product search error:', error);
        return [];
      }

        if (data && data.length > 0) {
          // Cache them locally
          await db.masterProducts.bulkPut(data);
          
          // Also fetch units for these products
          const productIds = data.map(p => p.id);
          const { data: unitsData } = await supabase
            .from('product_units')
            .select('*')
            .in('master_product_id', productIds)
            .eq('is_active', true);

          if (unitsData) {
            const units: ProductUnit[] = unitsData.map((u: any) => ({
              id: u.id,
              masterProductId: u.master_product_id,
              unitName: u.unit_name,
              unitType: u.unit_type,
              quantity: u.quantity,
              barcode: u.barcode,
              sellingPrice: u.selling_price,
              costPrice: u.cost_price,
              stockQuantity: u.stock_quantity || 0,
              isDefault: u.is_default,
              isActive: u.is_active,
              createdAt: new Date(u.created_at),
              updatedAt: new Date(u.updated_at)
            }));
            await db.productUnits.bulkPut(units);
          }

          return data;
        }
    } catch (error) {
      console.error('Failed to search master products online:', error);
    }

    return [];
  }

  // Add a master product to the user's local inventory
  async addToInventory(masterProductId: string, userId: string, unitId?: string, price?: number): Promise<any> {
    const masterProduct = await db.masterProducts.get(masterProductId);
    if (!masterProduct) {
      throw new Error('Master product not found locally');
    }

    let unit: ProductUnit | undefined;
    if (unitId) {
      unit = await db.productUnits.get(unitId);
    } else {
      // Get default unit
      unit = await db.productUnits
        .where('masterProductId')
        .equals(masterProductId)
        .and(u => u.isDefault)
        .first();
    }

    const unitSuffix = unit ? ` (${unit.unitName})` : '';
    const newProduct = {
      name: masterProduct.product_name + (masterProduct.variant ? ` - ${masterProduct.variant}` : '') + (masterProduct.size ? ` (${masterProduct.size})` : '') + unitSuffix,
      barcode: unit?.barcode || masterProduct.gtin,
      barcodes: [unit?.barcode || masterProduct.gtin],
      category: masterProduct.subcategory || 'General',
      price: price || unit?.sellingPrice || masterProduct.suggested_retail_price || 0,
      cost: unit?.costPrice || masterProduct.suggested_cost_price || 0,
      minPrice: masterProduct.min_price,
      maxPrice: masterProduct.max_price,
      stock: 0,
      minStock: 5,
      unitId: unit?.id,
      masterProductId: masterProduct.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      synced: false
    };

    const id = await db.products.add(newProduct);
    return { ...newProduct, id };
  }

  // Download the entire master database for offline use
  async downloadMasterDatabase(): Promise<{ success: boolean; count: number; error?: string }> {
    if (this.isDownloading) {
      return { success: false, count: 0, error: 'Download already in progress' };
    }

    this.isDownloading = true;
    let totalDownloaded = 0;

    try {
      if (!isSupabaseConfigured()) {
        console.log('Supabase not configured, falling back to local seed data');
        const seedResult = await this.seedFromLocalJson();
        return { success: seedResult.success, count: seedResult.count };
      }

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
          
          // Download units for these products
          const productIds = data.map(p => p.id);
          const { data: unitsData } = await supabase
            .from('product_units')
            .select('*')
            .in('master_product_id', productIds)
            .eq('is_active', true);

          if (unitsData) {
            const units: ProductUnit[] = unitsData.map((u: any) => ({
              id: u.id,
              masterProductId: u.master_product_id,
              unitName: u.unit_name,
              unitType: u.unit_type,
              quantity: u.quantity,
              barcode: u.barcode,
              sellingPrice: u.selling_price,
              costPrice: u.cost_price,
              stockQuantity: u.stock_quantity || 0,
              isDefault: u.is_default,
              isActive: u.is_active,
              createdAt: new Date(u.created_at),
              updatedAt: new Date(u.updated_at)
            }));
            await db.productUnits.bulkPut(units);
          }

          totalDownloaded += data.length;
          lastId = data[data.length - 1].id;
          
          if (data.length < batchSize) {
            hasMore = false;
          }
        }
      }

      if (totalDownloaded === 0) {
        console.log('No products found in Supabase, falling back to local seed data');
        const seedResult = await this.seedFromLocalJson();
        toast.success(`Seeded ${seedResult.count} products from local database`, { id: 'master-download' });
        return { success: seedResult.success, count: seedResult.count };
      }

      toast.success(`Downloaded ${totalDownloaded} products for offline use`, { id: 'master-download' });
      return { success: true, count: totalDownloaded };
    } catch (error: any) {
      console.error('Failed to download master database, trying local seed:', error);
      const seedResult = await this.seedFromLocalJson();
      if (seedResult.success) {
        toast.success(`Fell back to local database (${seedResult.count} products)`, { id: 'master-download' });
        return { success: true, count: seedResult.count };
      }
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
