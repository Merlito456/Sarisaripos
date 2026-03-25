// src/components/POS/ReceiptModal.tsx

import React, { useState, useEffect } from 'react';
import { X, Printer, Download, Share2, Smartphone, CheckCircle, Copy } from 'lucide-react';
import { ReceiptData } from '../../types/receipt';
import { receiptGenerator } from '../../services/ReceiptGenerator';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface ReceiptModalProps {
  isOpen: boolean;
  receiptData: ReceiptData;
  onClose: () => void;
  onPrint?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  receiptData,
  onClose,
  onPrint
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      // Auto-print after short delay (optional)
      // setTimeout(() => handlePrint(), 500);
    }
  }, [isOpen]);
  
  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      // Create a hidden iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const html = receiptGenerator.generateHTMLReceipt(receiptData);
      
      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();

        // Wait for resources to load
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          
          // Cleanup after printing
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 500);
      }

      onPrint?.();
      toast.success('Receipt sent to printer!');
    } catch (error) {
      console.error('Print failed:', error);
      toast.error('Failed to print receipt');
    } finally {
      setIsPrinting(false);
    }
  };
  
  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const pdfBlob = await receiptGenerator.generatePDFReceipt(receiptData);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receiptData.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Receipt downloaded!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download receipt');
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handleShare = async () => {
    const html = receiptGenerator.generateHTMLReceipt(receiptData);
    const blob = new Blob([html], { type: 'text/html' });
    const file = new File([blob], `receipt-${receiptData.id}.html`, { type: 'text/html' });
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt ${receiptData.id}`,
          text: `Transaction receipt from ${receiptData.storeName}`,
          files: [file]
        });
        toast.success('Receipt shared!');
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback: copy receipt link or show modal
      navigator.clipboard.writeText(window.location.href);
      toast.success('Receipt link copied!');
    }
  };
  
  const handleCopyReceipt = () => {
    const receiptText = `
${receiptData.storeName}
${receiptData.storeAddress}
Receipt #: ${receiptData.id}
Date: ${format(receiptData.transaction.date, 'MM/dd/yyyy h:mm a')}
---
${receiptData.items.map(item => 
  `${item.name} x${item.quantity} = ₱${item.total.toFixed(2)}`
).join('\n')}
---
Subtotal: ₱${receiptData.subtotal.toFixed(2)}
${receiptData.discount > 0 ? `Discount: -₱${receiptData.discount.toFixed(2)}\n` : ''}
TOTAL: ₱${receiptData.total.toFixed(2)}
Paid: ${receiptData.paymentMethod.toUpperCase()} - ₱${receiptData.amountPaid.toFixed(2)}
Change: ₱${receiptData.change.toFixed(2)}
---
Thank you! Please come again!
    `;
    
    navigator.clipboard.writeText(receiptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Receipt copied to clipboard!');
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
          <div>
            <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">Receipt</h2>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">#{receiptData.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-200 rounded-xl transition-colors text-stone-500"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Receipt Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-100">
          <div className="bg-white rounded-2xl shadow-sm p-6 font-mono text-xs text-stone-800 border border-stone-200">
            {/* Store Header */}
            <div className="text-center border-b border-dashed border-stone-300 pb-4 mb-4">
              <div className="font-black text-base uppercase tracking-tight">{receiptData.storeName}</div>
              <div className="text-stone-500 text-[10px] mt-1">{receiptData.storeAddress}</div>
              {receiptData.storePhone && (
                <div className="text-stone-500 text-[10px]">Tel: {receiptData.storePhone}</div>
              )}
            </div>
            
            {/* Transaction Details */}
            <div className="border-b border-dashed border-stone-300 pb-3 mb-3 space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="font-bold text-stone-400 uppercase">Receipt #:</span>
                <span className="font-bold">{receiptData.id}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="font-bold text-stone-400 uppercase">Date:</span>
                <span className="font-bold">{format(receiptData.transaction.date, 'MM/dd/yyyy h:mm a')}</span>
              </div>
              {receiptData.transaction.customerName && (
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold text-stone-400 uppercase">Customer:</span>
                  <span className="font-bold">{receiptData.transaction.customerName}</span>
                </div>
              )}
            </div>
            
            {/* Items Header */}
            <div className="flex justify-between font-black text-[10px] border-b border-dotted border-stone-300 pb-2 mb-2 uppercase tracking-widest">
              <span className="flex-1">Item</span>
              <span className="w-8 text-center">Qty</span>
              <span className="w-14 text-right">Price</span>
              <span className="w-14 text-right">Total</span>
            </div>
            
            {/* Items */}
            <div className="space-y-2 mb-4">
              {receiptData.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[10px]">
                  <span className="flex-1 truncate pr-2 font-bold">{item.name}</span>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <span className="w-14 text-right">₱{item.price.toFixed(2)}</span>
                  <span className="w-14 text-right font-black">₱{item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            {/* Totals */}
            <div className="border-t border-dashed border-stone-300 pt-3 space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="font-bold text-stone-400 uppercase">Subtotal:</span>
                <span className="font-bold">₱{receiptData.subtotal.toFixed(2)}</span>
              </div>
              {receiptData.discount > 0 && (
                <div className="flex justify-between text-[10px] text-emerald-600">
                  <span className="font-bold uppercase">Discount:</span>
                  <span className="font-bold">-₱{receiptData.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-lg mt-2 pt-2 border-t border-dashed border-stone-300 text-stone-900 tracking-tighter">
                <span>TOTAL:</span>
                <span className="text-indigo-600">₱{receiptData.total.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Payment Details */}
            <div className="border-t border-dashed border-stone-300 mt-3 pt-3 space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="font-bold text-stone-400 uppercase">Payment:</span>
                <span className="font-bold uppercase">{receiptData.paymentMethod.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="font-bold text-stone-400 uppercase">Amount Paid:</span>
                <span className="font-bold">₱{receiptData.amountPaid.toFixed(2)}</span>
              </div>
              {receiptData.change > 0 && (
                <div className="flex justify-between text-[10px] text-emerald-600">
                  <span className="font-bold uppercase">Change:</span>
                  <span className="font-bold">₱{receiptData.change.toFixed(2)}</span>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="text-center border-t border-dashed border-stone-300 mt-4 pt-4">
              <div className="font-black text-xs uppercase tracking-tight">✨ MARAMING SALAMAT PO! ✨</div>
              <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">PAULI-ULI PO KAYO!</div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="p-6 border-t border-stone-100 space-y-3 bg-stone-50">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center justify-center space-x-2 px-4 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              <Printer size={18} />
              <span>{isPrinting ? 'Printing...' : 'Print'}</span>
            </button>
            
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex items-center justify-center space-x-2 px-4 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
            >
              <Download size={18} />
              <span>{isDownloading ? 'Downloading...' : 'PDF'}</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleShare}
              className="flex items-center justify-center space-x-2 px-4 py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-purple-700 active:bg-purple-800 transition-all shadow-lg shadow-purple-100"
            >
              <Share2 size={18} />
              <span>Share</span>
            </button>
            
            <button
              onClick={handleCopyReceipt}
              className="flex items-center justify-center space-x-2 px-4 py-4 bg-stone-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-stone-900 active:bg-stone-950 transition-all shadow-lg shadow-stone-200"
            >
              {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          
          {/* Thermal Printer Note */}
          <div className="text-center text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center justify-center">
            <Smartphone size={12} className="mr-1" />
            Connect to Bluetooth printer for thermal printing
          </div>
        </div>
      </div>
    </div>
  );
};
