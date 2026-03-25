// src/components/AddProductModal.tsx
import React, { useState } from 'react';
import { MasterProductSearch } from './MasterProductSearch';
import { db } from '../database/db';
import { toast } from 'react-hot-toast';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { X, Save, Package, Tag, DollarSign, Layers, AlertCircle, Loader2 } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
  initialBarcode?: string;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onProductAdded,
  initialBarcode = ''
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'General',
    barcode: initialBarcode,
    price: 0,
    cost: 0,
    stock: 0,
    minStock: 5
  });
  const [loading, setLoading] = useState(false);

  const handleMasterSelect = (master: any) => {
    setFormData({
      name: `${master.brand} ${master.product_name}${master.variant ? ` ${master.variant}` : ''}`,
      category: master.category || 'General',
      barcode: master.gtin || '',
      price: master.suggested_retail_price || 0,
      cost: master.suggested_cost_price || 0,
      stock: 0,
      minStock: 5
    });
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Product name is required');
      return;
    }

    setLoading(true);
    try {
      let userId: string | undefined;
      if (isSupabaseConfigured()) {
        try {
          const supabase = getSupabase();
          const { data: { user } } = await supabase.auth.getUser();
          userId = user?.id;
        } catch (e) {
          console.warn('Supabase auth check failed:', e);
        }
      }

      const newProduct = {
        userId,
        name: formData.name,
        category: formData.category,
        barcode: formData.barcode || undefined,
        barcodes: formData.barcode ? [formData.barcode] : [],
        price: formData.price,
        cost: formData.cost,
        stock: formData.stock,
        minStock: formData.minStock,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.products.add(newProduct as any);
      toast.success('Product added successfully!');
      onProductAdded();
      onClose();
    } catch (error) {
      console.error('Failed to add product:', error);
      toast.error('Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add New Product</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Master List Search */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
              <Package size={14} /> Master List Search
            </label>
            <MasterProductSearch onSelect={handleMasterSelect} />
          </div>

          <div className="space-y-4">
            {/* Product Name */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Product Name *</label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                  placeholder="e.g. Lucky Me Pancit Canton"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Category</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              {/* Barcode */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Barcode (Optional)</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                  placeholder="Scan or type..."
                />
              </div>
            </div>

            {/* Price & Cost */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Selling Price (₱)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">₱</span>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full pl-8 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                    step="0.25"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Cost Price (₱)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">₱</span>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                    className="w-full pl-8 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                    step="0.25"
                  />
                </div>
              </div>
            </div>

            {/* Stock & Alert */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Current Stock</label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                    className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Min Stock Alert</label>
                <div className="relative">
                  <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
                    className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex space-x-4">
          <button 
            onClick={onClose} 
            className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-4 font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Save size={20} />
                SAVE PRODUCT
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
