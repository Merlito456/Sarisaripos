import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const colors = {
    danger: 'bg-red-600 hover:bg-red-700 shadow-red-100',
    warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-100',
    info: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
  };

  const iconColors = {
    danger: 'text-red-500 bg-red-50',
    warning: 'text-amber-500 bg-amber-50',
    info: 'text-indigo-500 bg-indigo-50'
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in duration-200">
        <div className="p-6 text-center">
          <div className={`w-16 h-16 ${iconColors[type]} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight mb-2">{title}</h3>
          <p className="text-stone-500 font-medium text-sm leading-relaxed mb-8">
            {message}
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-stone-200 transition-all active:bg-stone-200"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-3 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg active:opacity-90 ${colors[type]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
