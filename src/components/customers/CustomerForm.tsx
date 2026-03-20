import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useCustomer } from '../../hooks/useCustomer';

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  editCustomer?: any;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  isOpen,
  onClose,
  editCustomer
}) => {
  const { addCustomer, updateCustomer } = useCustomer();
  const [formData, setFormData] = useState({
    firstName: editCustomer?.firstName || '',
    lastName: editCustomer?.lastName || '',
    phone: editCustomer?.phone || '',
    address: editCustomer?.address || '',
    creditLimit: editCustomer?.creditLimit || 500,
    notes: editCustomer?.notes || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editCustomer) {
      await updateCustomer(editCustomer.id, formData);
    } else {
      await addCustomer(formData);
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-stone-100 p-6 flex justify-between items-center z-10">
          <h2 className="text-2xl font-black text-stone-900 tracking-tight uppercase">
            {editCustomer ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-400 hover:text-stone-900"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all font-medium"
                placeholder="Juan"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all font-medium"
                placeholder="Dela Cruz"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all font-medium"
              placeholder="09123456789"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all font-medium resize-none"
              rows={2}
              placeholder="Barangay, City"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">
              Credit Limit (₱)
            </label>
            <input
              type="number"
              value={formData.creditLimit}
              onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all font-black text-indigo-600"
              min={0}
              step={100}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all font-medium resize-none"
              rows={2}
              placeholder="Additional information..."
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 active:scale-95"
            >
              {editCustomer ? 'Update' : 'Add Customer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-600 py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
