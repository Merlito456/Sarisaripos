import React, { useState, useEffect } from 'react';
import { X, Save, Package, Tag, DollarSign, Layers, AlertCircle, Crown, Search, Plus, Cloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Product } from '../../database/db';
import { dataService } from '../../services/DataService';
import { masterProductService } from '../../services/MasterProductService';
import toast from 'react-hot-toast';
import { premiumService } from '../../services/PremiumService';
import { useNavigate } from 'react-router-dom';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  product?: Product | null;
  initialSearchQuery?: string;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  initialSearchQuery = ''
}) => {
  const navigate = useNavigate();
  const [masterQuery, setMasterQuery] = useState('');
  const [masterResults, setMasterResults] = useState<any[]>([]);
  const [isSearchingMaster, setIsSearchingMaster] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    brand: '',
    variant: '',
    size: '',
    category: 'General',
    price: 0,
    cost: 0,
    stock: 0,
    minStock: 5,
    barcodes: []
  });

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        name: '',
        brand: '',
        variant: '',
        size: '',
        category: 'General',
        price: 0,
        cost: 0,
        stock: 0,
        minStock: 5,
        barcodes: []
      });
    }
    setMasterQuery(initialSearchQuery);
    if (initialSearchQuery) {
      handleMasterSearch(initialSearchQuery);
    } else {
      setMasterResults([]);
    }
  }, [product, isOpen, initialSearchQuery]);

  const handleMasterSearch = async (query: string) => {
    setMasterQuery(query);
    if (query.length < 3) {
      setMasterResults([]);
      return;
    }

    setIsSearchingMaster(true);
    try {
      const results = await dataService.searchMasterProducts(query);
      setMasterResults(results);
    } finally {
      setIsSearchingMaster(false);
    }
  };

  const selectMasterProduct = (p: any) => {
    setFormData({
      ...formData,
      name: p.name || p.product_name,
      brand: p.brand || '',
      variant: p.variant || '',
      size: p.size || '',
      barcode: p.barcode || p.gtin,
      barcodes: [p.barcode || p.gtin],
      category: p.category || p.subcategory || 'General',
      price: p.suggested_price || p.suggested_retail_price || 0,
      cost: p.suggested_cost_price || 0
    });
    setMasterResults([]);
    setMasterQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Product name is required');
      return;
    }

    try {
      if (!product?.id) {
        const canAdd = await premiumService.canAddProduct();
        if (!canAdd) {
          toast.error('Product limit reached for your plan. Please upgrade to add more.');
          navigate('/premium');
          onClose();
          return;
        }
      }

      const now = new Date();
      const productData = {
        ...formData,
        updatedAt: now,
        createdAt: product?.createdAt || now,
      } as Product;

      if (product?.id) {
        await dataService.updateProduct(product.id, productData);
        toast.success('Product updated successfully');
      } else {
        await dataService.addProduct(productData);
        toast.success('Product added successfully');
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save product:', error);
      toast.error('Failed to save product');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
          <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-xl transition-colors">
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        <div className="px-6 pt-4">
          {!product && (
            <div className="relative">
              <div className="flex items-center space-x-2 mb-2">
                <Crown size={14} className="text-amber-500" />
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Master List Search</span>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-3 bg-amber-50 rounded-2xl border-2 border-amber-100 focus:border-amber-500 focus:ring-0 font-bold text-sm"
                  placeholder="Search common items (e.g. Coke, Lucky Me)..."
                  value={masterQuery}
                  onChange={e => handleMasterSearch(e.target.value)}
                />
                {isSearchingMaster && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              
              <AnimatePresence>
                {masterResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden max-h-60 overflow-y-auto"
                  >
                    {masterResults.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectMasterProduct(p)}
                        className="w-full p-4 text-left hover:bg-amber-50 border-b border-stone-50 last:border-none flex items-center justify-between group"
                      >
                        <div>
                          <div className="font-bold text-stone-800 group-hover:text-amber-700">{p.name}</div>
                          <div className="text-xs text-stone-400">{p.barcode} • {p.category}</div>
                        </div>
                        <Plus size={18} className="text-amber-500 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1">Product Name</label>
            <div className="relative">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                type="text"
                required
                className="w-full pl-12 pr-4 py-3 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold"
                placeholder="e.g. Pancit Canton"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1">Brand</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold"
                placeholder="e.g. Lucky Me"
                value={formData.brand || ''}
                onChange={e => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1">Variant</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold"
                placeholder="e.g. Chilimansi"
                value={formData.variant || ''}
                onChange={e => setFormData({ ...formData, variant: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1">Size/Weight</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold"
                placeholder="e.g. 80g"
                value={formData.size || ''}
                onChange={e => setFormData({ ...formData, size: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1">Category</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <select
                  className="w-full pl-12 pr-4 py-3 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold appearance-none"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="General">General</option>
                  <option value="Drinks">Drinks</option>
                  <option value="Noodles">Noodles</option>
                  <option value="Canned Goods">Canned Goods</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Personal Care">Personal Care</option>
                  <option value="Condiments">Condiments</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1">Barcode (Optional)</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold"
              placeholder="Scan or type..."
              value={formData.barcode || ''}
              onChange={e => setFormData({ ...formData, barcode: e.target.value, barcodes: [e.target.value] })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1">Selling Price</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">₱</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1">Cost Price</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">₱</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  value={formData.cost}
                  onChange={e => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1">Current Stock</label>
              <div className="relative">
                <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="number"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-stone-400 uppercase tracking-widest ml-1">Min Stock Alert</label>
              <div className="relative">
                <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="number"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  value={formData.minStock}
                  onChange={e => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col space-y-3">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-stone-100 text-stone-600 rounded-2xl font-black uppercase tracking-widest hover:bg-stone-200 active:bg-stone-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center space-x-2"
              >
                <Save size={20} />
                <span>{product ? 'Update' : 'Save Product'}</span>
              </button>
            </div>
            
            {product && !product.masterProductId && (
              <button
                type="button"
                onClick={async () => {
                  const loadingToast = toast.loading(`Syncing ${product.name} to master database...`);
                  try {
                    const result = await masterProductService.syncToMaster(product);
                    if (result.success) {
                      toast.success(`${product.name} synced to master database!`, { id: loadingToast });
                      onSave();
                      onClose();
                    } else {
                      toast.error(`Sync failed: ${result.error}`, { id: loadingToast });
                    }
                  } catch (error) {
                    toast.error('Sync failed', { id: loadingToast });
                  }
                }}
                className="w-full py-4 bg-amber-50 text-amber-600 border-2 border-amber-100 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-100 active:bg-amber-100 transition-all flex items-center justify-center space-x-2"
              >
                <Cloud size={18} />
                <span>Sync to Master Database</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
