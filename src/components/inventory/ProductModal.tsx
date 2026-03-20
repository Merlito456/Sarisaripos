import React, { useState, useEffect } from 'react';
import { X, Save, Package, Tag, DollarSign, Layers, AlertCircle } from 'lucide-react';
import { db, type Product } from '../../database/db';
import toast from 'react-hot-toast';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  product?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
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
        category: 'General',
        price: 0,
        cost: 0,
        stock: 0,
        minStock: 5,
        barcodes: []
      });
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Product name is required');
      return;
    }

    try {
      const now = new Date();
      const productData = {
        ...formData,
        updatedAt: now,
        createdAt: product?.createdAt || now,
      } as Product;

      if (product?.id) {
        await db.products.put(productData);
        toast.success('Product updated successfully');
      } else {
        await db.products.add(productData);
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
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
          <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-xl transition-colors">
            <X size={20} className="text-stone-500" />
          </button>
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
                placeholder="e.g. Lucky Me Pancit Canton"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          <div className="pt-4 flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-stone-100 text-stone-600 rounded-2xl font-black uppercase tracking-widest hover:bg-stone-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center space-x-2"
            >
              <Save size={20} />
              <span>{product ? 'Update' : 'Save Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
