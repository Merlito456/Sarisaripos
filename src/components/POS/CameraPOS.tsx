import React, { useEffect, useState } from 'react';
import { Search, ShoppingCart, X, Plus, Minus, Trash2, Camera, Barcode, Zap, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePOSStore } from '../../store/usePOSStore';
import { type Product } from '../../database/db';
import { dataService } from '../../services/DataService';
import { detectionManager } from '../../detection/DetectionManager';
import { masterProductService } from '../../services/MasterProductService';
import { FullScreenCamera } from './FullScreenCamera';
import { CustomerSelector } from './CustomerSelector';
import { ReceiptModal } from './ReceiptModal';
import { useAuth } from '../../contexts/AuthContext';
import { UserPointsBadge } from '../UserPointsBadge';
import toast from 'react-hot-toast';

export default function CameraPOS() {
  const { user } = useAuth();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraMode, setCameraMode] = useState<'barcode' | 'photo' | 'text' | 'auto'>('auto');
  const [autoOpenManual, setAutoOpenManual] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userId, setUserId] = useState<string>(user?.id || 'anonymous');
  
  const { 
    cart, 
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    checkout, 
    isProcessing, 
    selectedCustomer,
    currentReceipt,
    showReceipt,
    clearReceipt
  } = usePOSStore();

  useEffect(() => {
    if (user) {
      setUserId(user.id);
      detectionManager.setUserId(user.id);
    }

    dataService.getProducts().then(setProducts).catch(err => {
      console.error('Failed to load products:', err);
      toast.error('Failed to load products');
    });
  }, [user]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const openCamera = (mode: 'barcode' | 'photo' | 'text' | 'auto') => {
    setCameraMode(mode);
    setIsCameraActive(true);
  };

  return (
    <div className="flex flex-col h-full bg-stone-100 lg:flex-row overflow-hidden relative">
      {/* Left Side: Camera & Search */}
      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
        {/* Header with Points */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-stone-900 uppercase tracking-tighter">Point of Sale</h1>
            <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">Sari-Sari Store POS</p>
          </div>
          <UserPointsBadge />
        </div>

        {/* Quick Scan Options */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => openCamera('barcode')}
            className="bg-indigo-600 rounded-2xl p-4 text-white text-left hover:scale-105 transition-transform shadow-lg shadow-indigo-100"
          >
            <Barcode size={24} className="mb-2" />
            <p className="font-black text-xs uppercase tracking-wider">Barcode</p>
            <p className="text-[10px] opacity-70">Scan items</p>
          </button>
          
          <button
            onClick={() => openCamera('text')}
            className="bg-emerald-600 rounded-2xl p-4 text-white text-left hover:scale-105 transition-transform shadow-lg shadow-emerald-100"
          >
            <Type size={24} className="mb-2" />
            <p className="font-black text-xs uppercase tracking-wider">Text Detection</p>
            <p className="text-[10px] opacity-70">Read Labels</p>
          </button>
          
          <button
            onClick={() => openCamera('auto')}
            className="bg-purple-600 rounded-2xl p-4 text-white text-left hover:scale-105 transition-transform shadow-lg shadow-purple-100"
          >
            <Zap size={24} className="mb-2" />
            <p className="font-black text-xs uppercase tracking-wider">Auto</p>
            <p className="text-[10px] opacity-70">Smart Scan</p>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => {
              setCameraMode('barcode');
              setAutoOpenManual(true);
              setIsCameraActive(true);
            }}
            className="bg-stone-800 rounded-2xl p-4 text-white flex items-center justify-center space-x-3 hover:bg-stone-900 transition-colors shadow-lg"
          >
            <Barcode size={20} />
            <span className="font-black text-sm uppercase tracking-widest">Manual Barcode Entry</span>
          </button>
        </div>

        <div className="relative aspect-[4/3] lg:aspect-video bg-black rounded-2xl overflow-hidden shadow-xl border-4 border-white">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-4 p-6 text-center">
            <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center mb-2">
              <Type size={40} className="text-indigo-400" />
            </div>
            <h3 className="text-2xl font-black tracking-tight">Text Detection Scanner</h3>
            <p className="text-stone-400 text-sm max-w-xs">Scan barcodes or use OCR to recognize products instantly. Works completely offline.</p>
            <button 
              onClick={() => openCamera('auto')}
              className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black text-lg transition-all transform hover:scale-105 shadow-xl shadow-indigo-200"
            >
              Open Scanner
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
            <input 
              type="text"
              placeholder="Search products manually..."
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm border-none focus:ring-2 focus:ring-indigo-500 text-base font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-3 pb-4 scrollbar-hide">
            {products
              .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(product => (
                <motion.button
                  key={product.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addToCart(product)}
                  className="p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all text-left border border-stone-200 group flex flex-col h-full"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    {product.category === 'Drinks' ? '🥤' : product.category === 'Noodles' ? '🍜' : product.category === 'Snacks' ? '🍪' : '📦'}
                  </div>
                  <div className="font-bold text-stone-800 text-sm line-clamp-2 flex-1 leading-tight">{product.name}</div>
                  <div className="text-indigo-600 font-black mt-2 text-lg">₱{product.price.toFixed(2)}</div>
                </motion.button>
              ))}
            
            {searchQuery && products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                  <Search size={32} />
                </div>
                <div>
                  <p className="font-black text-stone-900 uppercase tracking-tight">No local products found</p>
                  <p className="text-stone-400 text-xs font-medium uppercase tracking-widest mt-1">Try searching our master database</p>
                </div>
                <button
                  onClick={async () => {
                    const masterResults = await masterProductService.searchProducts(searchQuery);
                    if (masterResults.length > 0) {
                      // We could show a modal with master results
                      // For now, let's just toast that they should use the scanner or add manually
                      toast.success(`Found ${masterResults.length} products in master database. Use the scanner to add them instantly!`);
                    } else {
                      toast.error('No products found in master database either.');
                    }
                  }}
                  className="px-6 py-3 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-amber-100 hover:bg-amber-600 transition-all"
                >
                  Search Master Database
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Drawer Toggle (Mobile Only) */}
      <div className="lg:hidden fixed bottom-24 right-4 z-30">
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative p-5 bg-indigo-600 text-white rounded-3xl shadow-2xl shadow-indigo-300 transform active:scale-90 transition-transform"
        >
          <ShoppingCart size={28} />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-7 h-7 flex items-center justify-center rounded-full border-4 border-white">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Cart Drawer Overlay */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Right Side: Cart (Drawer on Mobile, Sidebar on Desktop) */}
      <div className={`fixed lg:relative bottom-0 right-0 z-50 w-full lg:w-96 h-[85vh] lg:h-full bg-white border-l border-stone-200 flex flex-col shadow-2xl transition-transform duration-300 transform ${
        isCartOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'
      }`}>
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-indigo-50 lg:rounded-none rounded-t-3xl">
          <div className="flex items-center space-x-2 text-indigo-900">
            <ShoppingCart size={24} />
            <h2 className="text-xl font-black uppercase tracking-tight">Current Order</h2>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} items
            </span>
            <button 
              onClick={() => setIsCartOpen(false)}
              className="lg:hidden p-2 hover:bg-indigo-100 rounded-full text-indigo-400"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="mb-4">
            <CustomerSelector />
          </div>
          <AnimatePresence initial={false}>
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4 opacity-50">
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center">
                  <ShoppingCart size={40} />
                </div>
                <p className="font-bold uppercase tracking-widest text-xs">Your cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center space-x-3 p-4 bg-stone-50 rounded-2xl border border-stone-100"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-stone-800 text-sm truncate">{item.name}</div>
                    <div className="text-indigo-600 font-black text-xs mt-1">₱{item.price.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => updateQuantity(item.id!, item.quantity - 1)}
                      className="p-1.5 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors active:scale-90"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-black w-6 text-center text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id!, item.quantity + 1)}
                      className="p-1.5 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors active:scale-90"
                    >
                      <Plus size={14} />
                    </button>
                    <button 
                      onClick={() => removeFromCart(item.id!)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors active:scale-90"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 bg-white border-t border-stone-200 space-y-4">
          <div className="flex justify-between items-center text-stone-500 text-sm font-bold uppercase tracking-wider">
            <span>Subtotal</span>
            <span className="text-stone-900">₱{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-3xl font-black text-stone-900 border-t border-stone-100 pt-4">
            <span className="tracking-tighter">TOTAL</span>
            <span className="text-indigo-600">₱{total.toFixed(2)}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={cart.length === 0 || isProcessing}
              onClick={() => checkout('cash', total)}
              className={`col-span-2 py-5 rounded-2xl font-black text-xl shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                cart.length === 0 || isProcessing
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200'
              }`}
            >
              {isProcessing ? 'Processing...' : 'PAY CASH'}
            </button>
            <button 
              onClick={() => checkout('gcash', total)}
              disabled={cart.length === 0 || isProcessing}
              className="py-4 bg-blue-500 text-white rounded-2xl font-black text-sm shadow-lg hover:bg-blue-600 transition-all disabled:opacity-50 active:scale-95"
            >
              GCASH
            </button>
            <button 
              onClick={() => checkout('credit', total)}
              disabled={cart.length === 0 || isProcessing}
              className="py-4 bg-red-500 text-white rounded-2xl font-black text-sm shadow-lg hover:bg-red-600 transition-all disabled:opacity-50 active:scale-95"
            >
              UTANG
            </button>
          </div>
        </div>
      </div>
      
      {/* Full Screen Camera Modal */}
      <FullScreenCamera
        isOpen={isCameraActive}
        mode={cameraMode}
        userId={userId}
        autoOpenManual={autoOpenManual}
        onClose={() => {
          setIsCameraActive(false);
          setAutoOpenManual(false);
        }}
        onProductDetected={(product) => addToCart(product)}
        onModeChange={setCameraMode}
      />

      {currentReceipt && (
        <ReceiptModal
          isOpen={showReceipt}
          receiptData={currentReceipt}
          onClose={clearReceipt}
        />
      )}
    </div>
  );
}
