import React, { useState, useEffect } from 'react';
import { db, type Product } from '../database/db';
import { Search, Plus, Package, Filter, MoreVertical, Edit2, Trash2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const allProducts = await db.products.toArray();
    setProducts(allProducts);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'low') return matchesSearch && p.stock <= p.minStock;
    return matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 bg-stone-50 min-h-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-stone-900 uppercase tracking-tight">Inventory Management</h1>
          <p className="text-stone-500 font-medium">Track and manage your store products.</p>
        </div>
        <button className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all transform active:scale-95">
          <Plus size={20} />
          <span>Add New Product</span>
        </button>
      </header>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
          <input 
            type="text"
            placeholder="Search by product name or barcode..."
            className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl shadow-sm border-none focus:ring-2 focus:ring-indigo-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setFilter('all')}
            className={`flex-1 py-3 rounded-2xl font-bold transition-all ${filter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-stone-600 hover:bg-stone-100'}`}
          >
            All Items
          </button>
          <button 
            onClick={() => setFilter('low')}
            className={`flex-1 py-3 rounded-2xl font-bold transition-all flex items-center justify-center space-x-2 ${filter === 'low' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-stone-600 hover:bg-stone-100'}`}
          >
            <AlertCircle size={18} />
            <span>Low Stock</span>
          </button>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">Product</th>
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">Price</th>
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">Stock</th>
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-stone-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-xl">
                        {product.category === 'Drinks' ? '🥤' : product.category === 'Noodles' ? '🍜' : '📦'}
                      </div>
                      <div>
                        <div className="font-bold text-stone-800">{product.name}</div>
                        <div className="text-xs text-stone-400 font-medium">ID: {product.id?.toString().slice(-6)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-bold">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-stone-800">₱{product.price.toFixed(2)}</div>
                    <div className="text-[10px] text-stone-400 font-bold uppercase">Cost: ₱{product.cost.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-black text-stone-800">{product.stock}</div>
                    <div className="text-[10px] text-stone-400 font-bold uppercase">Min: {product.minStock}</div>
                  </td>
                  <td className="px-6 py-4">
                    {product.stock <= product.minStock ? (
                      <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-stone-100">
          {filteredProducts.map(product => (
            <div key={product.id} className="p-4 flex flex-col space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                    {product.category === 'Drinks' ? '🥤' : product.category === 'Noodles' ? '🍜' : '📦'}
                  </div>
                  <div>
                    <div className="font-black text-stone-900 leading-tight">{product.name}</div>
                    <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">{product.category}</div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button className="p-2 bg-stone-50 text-stone-400 rounded-xl"><Edit2 size={16} /></button>
                  <button className="p-2 bg-stone-50 text-red-400 rounded-xl"><Trash2 size={16} /></button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-stone-50 p-2 rounded-xl text-center">
                  <div className="text-[10px] font-black text-stone-400 uppercase tracking-tighter">Price</div>
                  <div className="font-black text-indigo-600">₱{product.price.toFixed(0)}</div>
                </div>
                <div className="bg-stone-50 p-2 rounded-xl text-center">
                  <div className="text-[10px] font-black text-stone-400 uppercase tracking-tighter">Stock</div>
                  <div className={`font-black ${product.stock <= product.minStock ? 'text-ph-red' : 'text-stone-900'}`}>
                    {product.stock}
                  </div>
                </div>
                <div className="bg-stone-50 p-2 rounded-xl text-center">
                  <div className="text-[10px] font-black text-stone-400 uppercase tracking-tighter">Status</div>
                  <div className={`text-[10px] font-black uppercase ${product.stock <= product.minStock ? 'text-ph-red' : 'text-jeepney-green'}`}>
                    {product.stock <= product.minStock ? 'Low' : 'OK'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <div className="p-12 text-center text-stone-400">
            <Package size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">No products found in inventory.</p>
          </div>
        )}
      </div>
    </div>
  );
}
