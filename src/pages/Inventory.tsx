import React, { useState, useEffect } from 'react';
import { type Product } from '../database/db';
import { dataService } from '../services/DataService';
import { Search, Plus, Package, Filter, MoreVertical, Edit2, Trash2, AlertCircle, CloudUpload, Cloud } from 'lucide-react';
import toast from 'react-hot-toast';
import { ProductModal } from '../components/inventory/ProductModal';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { premiumService } from '../services/PremiumService';
import { masterProductService } from '../services/MasterProductService';

import { useSettingsStore } from '../store/useSettingsStore';
import { RestockSuggestions } from '../components/inventory/RestockSuggestions';

export default function Inventory() {
  const { settings } = useSettingsStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isSyncingToMaster, setIsSyncingToMaster] = useState(false);

  useEffect(() => {
    loadProducts();
    checkPremium();
  }, []);

  const checkPremium = async () => {
    const status = await premiumService.getPremiumStatus();
    setIsPremium(status.isPremium);
  };

  const loadProducts = async () => {
    try {
      const allProducts = await dataService.getProducts();
      setProducts(allProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      await dataService.backupToCloud();
      toast.success('Local data backed up to cloud successfully');
      loadProducts();
    } catch (error) {
      console.error('Backup failed:', error);
      toast.error('Backup failed');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      await dataService.deleteProduct(productToDelete);
      toast.success('Product deleted successfully');
      loadProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product');
    } finally {
      setProductToDelete(null);
    }
  };

  const handleSyncToMaster = async (product: Product) => {
    const loadingToast = toast.loading(`Syncing ${product.name} to master database...`);
    try {
      const result = await masterProductService.syncToMaster(product);
      if (result.success) {
        toast.success(`${product.name} synced to master database!`, { id: loadingToast });
        loadProducts();
      } else {
        toast.error(`Sync failed: ${result.error}`, { id: loadingToast });
      }
    } catch (error) {
      toast.error('Sync failed', { id: loadingToast });
    }
  };

  const handleSyncAllToMaster = async () => {
    const unsynced = products.filter(p => !p.masterProductId);
    if (unsynced.length === 0) {
      toast.success('All products are already in master database');
      return;
    }

    setIsSyncingToMaster(true);
    const loadingToast = toast.loading(`Syncing ${unsynced.length} products to master database...`);
    
    let successCount = 0;
    for (const product of unsynced) {
      try {
        const result = await masterProductService.syncToMaster(product);
        if (result.success) successCount++;
      } catch (error) {
        console.error(`Failed to sync ${product.name}:`, error);
      }
    }

    setIsSyncingToMaster(false);
    toast.success(`Successfully synced ${successCount} products to master database`, { id: loadingToast });
    loadProducts();
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (p.barcode && p.barcode.includes(searchQuery));
    if (filter === 'low') return matchesSearch && p.stock <= p.minStock;
    return matchesSearch;
  });

  if (!settings.inventory.inventoryEnabled) {
    return (
      <div className="p-6 space-y-6 bg-stone-50 min-h-full">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-stone-900 uppercase tracking-tight">Inventory Tracking</h1>
            <p className="text-stone-500 font-medium">Stock counting is currently disabled in settings.</p>
          </div>
        </header>

        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-start shadow-sm">
          <AlertCircle className="w-6 h-6 text-amber-600 mr-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-black text-amber-900 uppercase tracking-tight">Inventory tracking is disabled</p>
            <p className="text-sm text-amber-700 mt-1 font-medium leading-relaxed">
              You are currently not tracking stock quantities. This is useful for stores that don't want to count every item.
              We'll still record your sales and provide smart restock suggestions below based on your sales velocity.
            </p>
          </div>
        </div>

        <RestockSuggestions />
        
        <div className="h-24 lg:hidden" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-stone-50 min-h-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-stone-900 uppercase tracking-tight">Inventory Management</h1>
          <p className="text-stone-500 font-medium">Track and manage your store products.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleSyncAllToMaster}
            disabled={isSyncingToMaster}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-amber-500 text-white rounded-2xl font-bold shadow-lg hover:bg-amber-600 active:bg-amber-700 transition-all transform disabled:opacity-50"
          >
            <Cloud size={20} className={isSyncingToMaster ? 'animate-pulse' : ''} />
            <span>{isSyncingToMaster ? 'Syncing...' : 'Sync All to Master'}</span>
          </button>
          <button 
            onClick={handleBackup}
            disabled={isBackingUp}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg hover:bg-emerald-700 active:bg-emerald-800 transition-all transform disabled:opacity-50"
          >
            <CloudUpload size={20} className={isBackingUp ? 'animate-bounce' : ''} />
            <span>{isBackingUp ? 'Backing up...' : 'Backup to Cloud'}</span>
          </button>
          <button 
            onClick={handleAddProduct}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 active:bg-indigo-800 transition-all transform"
          >
            <Plus size={20} />
            <span>Add New Product</span>
          </button>
        </div>
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
            className={`flex-1 py-3 rounded-2xl font-bold transition-all active:bg-stone-50 ${filter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-stone-600 hover:bg-stone-100'}`}
          >
            All Items
          </button>
          <button 
            onClick={() => setFilter('low')}
            className={`flex-1 py-3 rounded-2xl font-bold transition-all flex items-center justify-center space-x-2 active:bg-stone-50 ${filter === 'low' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-stone-600 hover:bg-stone-100'}`}
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
                      {!product.masterProductId && (
                        <button 
                          onClick={() => handleSyncToMaster(product)}
                          title="Sync to Master Database"
                          className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors active:bg-amber-100"
                        >
                          <Cloud size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleEditProduct(product)}
                        className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors active:bg-indigo-100"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id!)}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors active:bg-red-100"
                      >
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
                  {!product.masterProductId && (
                    <button 
                      onClick={() => handleSyncToMaster(product)}
                      className="p-2 bg-stone-50 text-amber-500 rounded-xl active:bg-amber-50"
                    >
                      <Cloud size={16} />
                    </button>
                  )}
                  <button 
                    onClick={() => handleEditProduct(product)}
                    className="p-2 bg-stone-50 text-stone-400 rounded-xl active:bg-stone-100"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(product.id!)}
                    className="p-2 bg-stone-50 text-red-400 rounded-xl active:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-stone-50 p-2 rounded-xl text-center">
                  <div className="text-[10px] font-black text-stone-400 uppercase tracking-tighter">Price</div>
                  <div className="font-black text-indigo-600">₱{product.price.toFixed(0)}</div>
                </div>
                <div className="bg-stone-50 p-2 rounded-xl text-center">
                  <div className="text-[10px] font-black text-stone-400 uppercase tracking-tighter">Stock</div>
                  <div className={`font-black ${product.stock <= product.minStock ? 'text-red-500' : 'text-stone-900'}`}>
                    {product.stock}
                  </div>
                </div>
                <div className="bg-stone-50 p-2 rounded-xl text-center">
                  <div className="text-[10px] font-black text-stone-400 uppercase tracking-tighter">Status</div>
                  <div className={`text-[10px] font-black uppercase ${product.stock <= product.minStock ? 'text-red-500' : 'text-emerald-600'}`}>
                    {product.stock <= product.minStock ? 'Low' : 'OK'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <div className="p-12 text-center space-y-6">
            <div className="text-stone-400">
              <Package size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium">No products found in inventory.</p>
            </div>
            
            {searchQuery.length >= 3 && (
              <button
                onClick={async () => {
                  const loadingToast = toast.loading('Searching master database...');
                  try {
                    const results = await masterProductService.searchProducts(searchQuery);
                    if (results.length > 0) {
                      toast.success(`Found ${results.length} products in master database!`, { id: loadingToast });
                      setIsModalOpen(true);
                    } else {
                      toast.error('No products found in master database either.', { id: loadingToast });
                    }
                  } catch (error) {
                    toast.error('Search failed', { id: loadingToast });
                  }
                }}
                className="px-8 py-4 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-amber-100 hover:bg-amber-600 transition-all transform active:scale-95"
              >
                Search Master Database
              </button>
            )}
          </div>
        )}
      </div>

      <ProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={loadProducts}
        product={editingProduct}
        initialSearchQuery={searchQuery}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteProduct}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
      
      {/* Bottom Spacer for Mobile Nav */}
      <div className="h-24 lg:hidden" />
    </div>
  );
}
