import React, { useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2, Package, Save, AlertCircle, Trophy } from 'lucide-react';
import { db, Product } from '../database/db';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface ProductUnit {
  id?: string;
  unit_name: string;
  unit_type: 'retail' | 'wholesale';
  quantity: number;
  selling_price: number;
  cost_price: number;
  is_default: boolean;
}

const DEFAULT_UNITS: ProductUnit[] = [
  {
    unit_name: 'piece',
    unit_type: 'retail',
    quantity: 1,
    selling_price: 0,
    cost_price: 0,
    is_default: true
  }
];

interface AddProductFromBarcodeModalProps {
  isOpen: boolean;
  barcode: string;
  onClose: () => void;
  onProductAdded: (product: Product) => void;
}

export const AddProductFromBarcodeModal: React.FC<AddProductFromBarcodeModalProps> = ({
  isOpen,
  barcode,
  onClose,
  onProductAdded
}) => {
  const { user, isPremium } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    product_name: '',
    brand: '',
    variant: '',
    size: '',
    category: 'General'
  });
  const [units, setUnits] = useState<ProductUnit[]>([...DEFAULT_UNITS]);
  const [stock, setStock] = useState(0);
  const [minStock, setMinStock] = useState(5);

  useEffect(() => {
    if (isOpen && isSupabaseConfigured()) {
      const loadCategories = async () => {
        const supabase = getSupabase();
        const { data } = await supabase.from('product_categories').select('id, name').order('name');
        if (data) setCategories(data);
      };
      loadCategories();
    }
  }, [isOpen]);

  // Helper to suggest units based on product type
  const suggestUnits = (productName: string, brand: string) => {
    const lowerName = productName.toLowerCase();
    const lowerBrand = brand.toLowerCase();

    // Cigarettes
    if (lowerName.includes('cigarette') || lowerName.includes('yosi') || 
        lowerBrand.includes('marlboro') || lowerBrand.includes('fortune') || 
        lowerBrand.includes('mighty')) {
      return [
        { unit_name: 'pack', unit_type: 'retail' as const, quantity: 20, selling_price: 0, cost_price: 0, is_default: true },
        { unit_name: 'stick', unit_type: 'retail' as const, quantity: 1, selling_price: 0, cost_price: 0, is_default: false }
      ];
    }
    
    // Candies / Chocolates
    if (lowerName.includes('candy') || lowerName.includes('chocolate') || 
        lowerBrand.includes('choc') || lowerBrand.includes('maxx')) {
      return [
        { unit_name: 'piece', unit_type: 'retail' as const, quantity: 1, selling_price: 0, cost_price: 0, is_default: true },
        { unit_name: 'box', unit_type: 'wholesale' as const, quantity: 12, selling_price: 0, cost_price: 0, is_default: false }
      ];
    }
    
    // Beverages
    if (lowerName.includes('coke') || lowerName.includes('sprite') || 
        lowerName.includes('royal') || lowerName.includes('pepsi')) {
      return [
        { unit_name: 'bottle', unit_type: 'retail' as const, quantity: 1, selling_price: 0, cost_price: 0, is_default: true },
        { unit_name: 'case', unit_type: 'wholesale' as const, quantity: 24, selling_price: 0, cost_price: 0, is_default: false }
      ];
    }
    
    // Default
    return [{ unit_name: 'piece', unit_type: 'retail' as const, quantity: 1, selling_price: 0, cost_price: 0, is_default: true }];
  };

  const handleProductNameChange = (value: string) => {
    setFormData({ ...formData, product_name: value });
    // Auto-suggest units based on name and brand
    const suggested = suggestUnits(value, formData.brand);
    setUnits(suggested);
  };

  const handleBrandChange = (value: string) => {
    setFormData({ ...formData, brand: value });
    const suggested = suggestUnits(formData.product_name, value);
    setUnits(suggested);
  };

  const addUnit = () => {
    setUnits([
      ...units,
      {
        unit_name: 'unit',
        unit_type: 'retail',
        quantity: 1,
        selling_price: 0,
        cost_price: 0,
        is_default: units.length === 0
      }
    ]);
  };

  const removeUnit = (index: number) => {
    const newUnits = units.filter((_, i) => i !== index);
    // If we removed the default, make the first one default
    if (newUnits.length > 0 && !newUnits.some(u => u.is_default)) {
      newUnits[0].is_default = true;
    }
    setUnits(newUnits);
  };

  const updateUnit = (index: number, field: keyof ProductUnit, value: any) => {
    const newUnits = [...units];
    newUnits[index] = { ...newUnits[index], [field]: value };
    setUnits(newUnits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_name) {
      toast.error('Product name is required');
      return;
    }

    // Validate at least one unit
    if (units.length === 0) {
      toast.error('At least one selling unit is required');
      return;
    }

    // Validate units have prices
    for (let i = 0; i < units.length; i++) {
      if (units[i].selling_price <= 0) {
        toast.error(`Please set selling price for ${units[i].unit_name}`);
        return;
      }
    }

    setLoading(true);
    try {
      // Prepare units JSON for the RPC call
      const unitsJson = units.map(unit => ({
        unit_name: unit.unit_name,
        unit_type: unit.unit_type,
        quantity: unit.quantity,
        selling_price: unit.selling_price,
        cost_price: unit.cost_price,
        is_default: unit.is_default
      }));

      let masterProductId = null;

      // Call Supabase RPC function to add product with units
      if (user && isSupabaseConfigured()) {
        const supabase = getSupabase();
        const { data: productId, error } = await supabase.rpc('add_product_with_units', {
          p_user_id: user.id,
          p_barcode: barcode,
          p_brand: formData.brand || null,
          p_product_name: formData.product_name,
          p_variant: formData.variant || null,
          p_size: formData.size || null,
          p_category_name: formData.category,
          p_units: unitsJson
        });

        if (error) {
          if (error.message.includes('Daily contribution limit')) {
            toast.error('Daily limit reached (5/day). Product saved locally only.');
          } else {
            console.error('Contribution error:', error);
            toast.error('Contribution failed, but product saved locally.');
          }
        } else {
          masterProductId = productId;
          toast.success(
            <div className="flex flex-col gap-1">
              <span className="font-bold">Contribution Successful!</span>
              <span className="text-xs flex items-center gap-1">
                <Trophy size={12} className="text-amber-500" />
                You earned 10 points!
              </span>
            </div>,
            { duration: 4000 }
          );
        }
      }

      // Also add to local IndexedDB with all units
      const defaultUnit = units.find(u => u.is_default) || units[0];
      
      const localProduct: Product = {
        userId: user?.id,
        name: `${formData.brand ? formData.brand + ' ' : ''}${formData.product_name}${formData.variant ? ' ' + formData.variant : ''}`,
        brand: formData.brand || undefined,
        variant: formData.variant || undefined,
        size: formData.size || undefined,
        barcode: barcode,
        barcodes: [barcode],
        category: formData.category,
        price: defaultUnit.selling_price,
        cost: defaultUnit.cost_price,
        stock: stock,
        minStock: minStock,
        masterProductId: masterProductId || undefined,
        units: units.map(u => ({
          unit_name: u.unit_name,
          unit_type: u.unit_type,
          quantity_per_unit: u.quantity,
          selling_price: u.selling_price,
          cost_price: u.cost_price,
          is_default: u.is_default
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const id = await db.products.add(localProduct);
      const savedProduct = { ...localProduct, id };

      onProductAdded(savedProduct);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-50">
          <div>
            <h2 className="text-xl font-bold text-blue-900">Unknown Barcode</h2>
            <p className="text-blue-600 text-sm font-mono">{barcode}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X size={20} className="text-blue-900" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
            <AlertCircle className="text-amber-500 shrink-0" size={20} />
            <p className="text-sm text-amber-800">
              This barcode is not in our database. Add it now to save it to your inventory.
              {isPremium && " Your contribution will also help other users!"}
            </p>
          </div>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.product_name}
                  onChange={(e) => handleProductNameChange(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Pancit Canton"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Lucky Me"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Variant</label>
                <input
                  type="text"
                  value={formData.variant}
                  onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Chilimansi"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Size/Weight</label>
                <input
                  type="text"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 80g"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="General">General</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
                <option value="Other">Other (will create new category)</option>
              </select>
            </div>

            {/* Selling Units (Tingi Support) */}
            <div className="border-t border-gray-100 pt-6">
              <div className="flex justify-between items-center mb-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Selling Units</label>
                <button
                  type="button"
                  onClick={addUnit}
                  className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:text-blue-700"
                >
                  <Plus size={14} />
                  ADD UNIT
                </button>
              </div>
              <div className="space-y-4">
                {units.map((unit, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 relative group">
                    {units.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUnit(idx)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Unit Name</label>
                        <input
                          type="text"
                          value={unit.unit_name}
                          onChange={(e) => updateUnit(idx, 'unit_name', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="e.g. pack, stick"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Type</label>
                        <select
                          value={unit.unit_type}
                          onChange={(e) => updateUnit(idx, 'unit_type', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="retail">Retail (Tingi)</option>
                          <option value="wholesale">Wholesale (Bulk)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Qty per Unit</label>
                        <input
                          type="number"
                          value={unit.quantity}
                          onChange={(e) => updateUnit(idx, 'quantity', parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Price (₱)</label>
                        <input
                          type="number"
                          step="0.25"
                          value={unit.selling_price}
                          onChange={(e) => updateUnit(idx, 'selling_price', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center mt-3">
                      <label className="flex items-center gap-2 cursor-pointer group/label">
                        <input
                          type="checkbox"
                          checked={unit.is_default}
                          onChange={(e) => {
                            const newUnits = [...units];
                            newUnits.forEach((_, i) => { newUnits[i].is_default = false; });
                            newUnits[idx].is_default = e.target.checked;
                            setUnits(newUnits);
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-500 group-hover/label:text-blue-600 transition-colors">Default unit for POS</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-3 flex items-center gap-1">
                <Package size={10} />
                Add multiple units for products sold in different quantities (e.g. pack and stick)
              </p>
            </div>

            {/* Stock */}
            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Initial Stock</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Tracked in default unit</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Min Stock Alert</label>
                <input
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-gray-100 flex flex-col gap-4 bg-gray-50">
          <div className="text-xs text-blue-600 bg-blue-100/50 p-3 rounded-xl text-center font-medium flex items-center justify-center gap-2">
            <Trophy size={14} />
            Adding this product earns you 10 points! (Max 5 per day)
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-colors"
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
    </div>
  );
};
