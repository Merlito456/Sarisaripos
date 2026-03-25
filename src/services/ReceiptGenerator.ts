// src/services/ReceiptGenerator.ts

import { ReceiptData } from '../types/receipt';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export class ReceiptGenerator {
  private storeSettings = {
    name: 'Sari-Sari Store',
    address: 'Barangay, City, Philippines',
    phone: '09123456789',
    tin: '123-456-789-000'
  };
  
  // Generate HTML receipt for printing or display
  generateHTMLReceipt(data: ReceiptData): string {
    const dateStr = format(data.transaction.date, 'MM/dd/yyyy h:mm a');
    const paperWidth = data.paperWidth || 58;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Receipt - ${data.id}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Courier New', 'Monaco', monospace;
            font-size: 12px;
            line-height: 1.4;
            background: #fff;
            padding: 20px;
          }
          
          .receipt {
            max-width: ${paperWidth === 58 ? '58mm' : '80mm'};
            margin: 0 auto;
            background: white;
          }
          
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
            .receipt {
              margin: 0;
            }
            .no-print {
              display: none;
            }
          }
          
          .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          
          .store-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          
          .store-address {
            font-size: 10px;
            color: #666;
          }
          
          .transaction-details {
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px dashed #000;
          }
          
          .transaction-row {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            margin-bottom: 2px;
          }
          
          .items {
            width: 100%;
            margin-bottom: 8px;
            border-bottom: 1px dashed #000;
          }
          
          .item-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            border-bottom: 1px dotted #000;
            padding-bottom: 4px;
            margin-bottom: 4px;
          }
          
          .item-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            font-size: 11px;
          }
          
          .item-name {
            flex: 2;
            word-break: break-word;
          }
          
          .item-qty {
            width: 40px;
            text-align: center;
          }
          
          .item-price {
            width: 60px;
            text-align: right;
          }
          
          .item-total {
            width: 70px;
            text-align: right;
          }
          
          .totals {
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px dashed #000;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            font-weight: bold;
          }
          
          .grand-total {
            font-size: 14px;
            margin-top: 4px;
            padding-top: 4px;
            border-top: 2px solid #000;
          }
          
          .payment-details {
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px dashed #000;
          }
          
          .footer {
            text-align: center;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px dashed #000;
            font-size: 10px;
          }
          
          .thankyou {
            font-size: 12px;
            font-weight: bold;
            margin: 8px 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <!-- Store Header -->
          <div class="header">
            <div class="store-name">${this.storeSettings.name}</div>
            <div class="store-address">${this.storeSettings.address}</div>
            <div class="store-address">Tel: ${this.storeSettings.phone}</div>
            ${this.storeSettings.tin ? `<div class="store-address">TIN: ${this.storeSettings.tin}</div>` : ''}
          </div>
          
          <!-- Transaction Details -->
          <div class="transaction-details">
            <div class="transaction-row">
              <span>Receipt #:</span>
              <span>${data.id}</span>
            </div>
            <div class="transaction-row">
              <span>Date:</span>
              <span>${dateStr}</span>
            </div>
            ${data.transaction.customerName ? `
            <div class="transaction-row">
              <span>Customer:</span>
              <span>${data.transaction.customerName}</span>
            </div>
            ` : ''}
            ${data.transaction.cashierName ? `
            <div class="transaction-row">
              <span>Cashier:</span>
              <span>${data.transaction.cashierName}</span>
            </div>
            ` : ''}
          </div>
          
          <!-- Items -->
          <div class="items">
            <div class="item-header">
              <span class="item-name">Item</span>
              <span class="item-qty">Qty</span>
              <span class="item-price">Price</span>
              <span class="item-total">Total</span>
            </div>
            ${data.items.map(item => `
            <div class="item-row">
              <span class="item-name">${this.escapeHtml(item.name)}</span>
              <span class="item-qty">${item.quantity}</span>
              <span class="item-price">${this.formatPrice(item.price)}</span>
              <span class="item-total">${this.formatPrice(item.total)}</span>
            </div>
            `).join('')}
          </div>
          
          <!-- Totals -->
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${this.formatPrice(data.subtotal)}</span>
            </div>
            ${data.discount > 0 ? `
            <div class="total-row">
              <span>Discount:</span>
              <span>-${this.formatPrice(data.discount)}</span>
            </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>TOTAL:</span>
              <span>${this.formatPrice(data.total)}</span>
            </div>
          </div>
          
          <!-- Payment Details -->
          <div class="payment-details">
            <div class="total-row">
              <span>Payment Method:</span>
              <span>${this.getPaymentMethodName(data.paymentMethod)}</span>
            </div>
            <div class="total-row">
              <span>Amount Paid:</span>
              <span>${this.formatPrice(data.amountPaid)}</span>
            </div>
            ${data.change > 0 ? `
            <div class="total-row">
              <span>Change:</span>
              <span>${this.formatPrice(data.change)}</span>
            </div>
            ` : ''}
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <div class="thankyou">✨ MARAMING SALAMAT PO! ✨</div>
            <div>PAULI-ULI PO KAYO!</div>
            <div style="font-size: 9px; margin-top: 4px;">
              For inquiries: ${this.storeSettings.phone}
            </div>
            ${data.message ? `<div style="margin-top: 4px;">${data.message}</div>` : ''}
          </div>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; margin: 5px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
            🖨️ Print Receipt
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; margin: 5px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Close
          </button>
        </div>
      </body>
      </html>
    `;
  }
  
  // Generate PDF Receipt
  async generatePDFReceipt(data: ReceiptData): Promise<Blob> {
    const html = this.generateHTMLReceipt(data);
    const pdf = new jsPDF({
      format: 'a4',
      unit: 'mm',
      orientation: 'portrait'
    });
    
    // Create a temporary iframe to render HTML
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();
      
      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use html2canvas to capture the receipt
      const receiptElement = iframeDoc.querySelector('.receipt');
      if (receiptElement) {
        const canvas = await html2canvas(receiptElement as HTMLElement, {
          scale: 2,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190; // mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      }
    }
    
    document.body.removeChild(iframe);
    return pdf.output('blob');
  }
  
  // Print receipt to thermal printer (via ESC/POS commands)
  async printThermalReceipt(data: ReceiptData): Promise<void> {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const html = this.generateHTMLReceipt({
      ...data,
      paperWidth: 58 // Thermal paper size
    });
    
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  }
  
  // Format price
  private formatPrice(price: number): string {
    return `₱${price.toFixed(2)}`;
  }
  
  // Get payment method name
  private getPaymentMethodName(method: string): string {
    const methods: Record<string, string> = {
      cash: 'CASH',
      gcash: 'GCash',
      maya: 'Maya',
      credit: 'UTANG',
      bank_transfer: 'BANK TRANSFER'
    };
    return methods[method] || method.toUpperCase();
  }
  
  // Escape HTML special characters
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export const receiptGenerator = new ReceiptGenerator();
