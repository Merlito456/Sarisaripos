// src/components/POS/UnitSelector.tsx
import React from 'react';
import { X, Package, Layers } from 'lucide-react';
import { ProductUnit, MasterProduct } from '../../database/db';
import { motion, AnimatePresence } from 'motion/react';

interface UnitSelectorProps {
  isOpen: boolean;
  product: MasterProduct;
  units: ProductUnit[];
  onSelect: (unit: ProductUnit) => void;
  onClose: () => void;
}

export const UnitSelector: React.FC<UnitSelectorProps> = ({ isOpen, product, units, onSelect, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-tight">
                    {product.product_name}
                  </h3>
                  {product.brand && (
                    <p className="text-sm font-bold text-amber-600 uppercase tracking-widest mt-1">
                      {product.brand}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                  Select Selling Unit
                </p>
                
                {units.map((unit) => (
                  <button
                    key={unit.id}
                    onClick={() => onSelect(unit)}
                    className="w-full group relative p-5 bg-gray-50 hover:bg-amber-50 rounded-3xl border-2 border-transparent hover:border-amber-200 transition-all duration-200 text-left flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                        {unit.unitName.toLowerCase().includes('pack') || unit.unitName.toLowerCase().includes('box') ? (
                          <Package className="text-amber-500" size={24} />
                        ) : (
                          <Layers className="text-amber-500" size={24} />
                        )}
                      </div>
                      <div>
                        <span className="block text-lg font-black text-gray-900 uppercase tracking-tight">
                          {unit.unitName}
                        </span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                          {unit.quantity > 1 ? `${unit.quantity} pieces` : 'Single unit'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-xl font-black text-amber-600">
                        ₱{unit.sellingPrice.toFixed(2)}
                      </span>
                      {unit.isDefault && (
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-widest">
                          Default
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={onClose}
                className="w-full mt-8 py-4 text-sm font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
