'use client';

import { useState } from 'react';
import { X, Printer, Check, Copy, Tag, FileText, Layers, ShieldCheck, Truck } from 'lucide-react';
import { generateCode128Svg } from '@/utils/barcode';
import { formatBDT } from '@/utils/currency';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

interface OrderItemData {
  id?: number;
  product?: { name_en?: string; name_bn?: string };
  name?: string;
  variant?: { sku?: string; title?: string };
  variant_sku?: string;
  quantity: number;
  unit_price: number | string;
}

interface OrderPrintData {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  district?: string;
  thana?: string;
  total_payable: number | string;
  cod_amount?: number | string;
  payment_method?: string;
  payment_status?: string;
  courier_name?: string;
  tracking_code?: string;
  created_at?: string;
  source?: string;
  consignment?: any;
  items?: OrderItemData[];
}

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderPrintData[];
}

export function BarcodePrintModal({ isOpen, onClose, orders }: BarcodePrintModalProps) {
  const [printFormat, setPrintFormat] = useState<'4x6' | '3x2' | 'invoice'>('4x6');

  if (!isOpen || orders.length === 0) return null;

  const handlePrint = async () => {
    try {
      const orderIds = orders.map((o) => o.id);
      await api.post('/admin/orders/mark-printed', { order_ids: orderIds });
    } catch (error) {
      console.error('Failed to mark orders as printed:', error);
    }
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-card text-card-foreground border border-border rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Hidden on print */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                <span>Thermal Sticker & Barcode Print</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary dark:text-primary border border-primary/20">
                  {orders.length} {orders.length === 1 ? 'Order' : 'Orders'} Selected
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                High-density thermal printing (Xprinter, Zebra, Rongta) with Code-128 barcodes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Now</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Format Selector Bar - Hidden on print */}
        <div className="px-5 py-3 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-background print:hidden">
          <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border">
            <button
              onClick={() => setPrintFormat('4x6')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                printFormat === '4x6'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              4" × 6" Thermal Courier Sticker
            </button>
            <button
              onClick={() => setPrintFormat('3x2')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                printFormat === '3x2'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              3" × 2" Mini Box Label
            </button>
            <button
              onClick={() => setPrintFormat('invoice')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                printFormat === 'invoice'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Standard A4 Packing Slip
            </button>
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Ready for thermal direct printing</span>
          </div>
        </div>

        {/* Preview & Print Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 flex flex-col items-center gap-6 print:bg-white print:p-0 print:m-0 print:overflow-visible print:block">
          {orders.map((order, idx) => {
            const barcodeData = generateCode128Svg(order.order_number, 45, 1.8);
            const trackingBarcode = order.tracking_code ? generateCode128Svg(order.tracking_code, 35, 1.5) : null;
            const codPayable = (parseFloat(order.cod_amount?.toString() || '') || parseFloat(order.total_payable?.toString() || '0'));
            const isPaid = order.payment_status === 'paid' || order.payment_method === 'bkash' || order.payment_method === 'nagad';

            return (
              <div 
                key={order.id} 
                className="print-page-wrapper w-full flex justify-center print:block"
              >
                {/* 1. FORMAT: 4" x 6" Thermal Courier Sticker */}
                {printFormat === '4x6' && (
                  <div className="thermal-4x6 bg-white text-black p-4 rounded-xl shadow-lg border border-slate-300 w-[384px] min-h-[576px] font-sans flex flex-col justify-between print:shadow-none print:border-0 print:rounded-none print:w-[4in] print:h-[6in] print:p-3 print:m-0 print:page-break-after-always">
                    {/* Header */}
                    <div>
                      <div className="flex items-center justify-between border-b-2 border-black pb-2">
                        <div>
                          <h1 className="text-xl font-black tracking-tight uppercase leading-tight">
                            BD SHOPPING
                          </h1>
                          <p className="text-[10px] text-gray-700 font-bold mt-1">
                            {order.order_number} - {(order.source || 'Web').toUpperCase()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block border-2 border-black px-2 py-0.5 text-xs font-black uppercase tracking-wider rounded">
                            {order.consignment?.courier_name || order.courier_name || 'STEADFAST'}
                          </span>
                          <div className="text-[10px] font-black mt-1 uppercase">
                            ID: {order.consignment?.consignment_id || order.tracking_code || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Barcode Section */}
                      <div className="py-4 flex flex-col items-center justify-center border-b border-black">
                        <div 
                          className="w-full flex justify-center mb-2 px-4" 
                          dangerouslySetInnerHTML={{ __html: trackingBarcode ? trackingBarcode.svg : barcodeData.svg }}
                        />
                        <div className="font-mono text-sm font-black tracking-widest mt-1">
                          {order.tracking_code || order.order_number}
                        </div>
                      </div>

                      {/* Recipient Details */}
                      <div className="py-2.5 border-b border-black text-xs leading-relaxed">
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-[10px] uppercase font-bold text-gray-600">DELIVER TO:</span>
                          <span className="font-black text-sm font-mono tracking-tight">{order.customer_phone}</span>
                        </div>
                        <div className="font-black text-sm text-black uppercase">{order.customer_name}</div>
                        <div className="font-semibold text-gray-800 text-[11px] mt-0.5 line-clamp-2">
                          {order.shipping_address}
                        </div>
                        {(order.thana || order.district) && (
                          <div className="text-[10px] font-bold text-gray-700 mt-0.5">
                            Area: {order.thana ? `${order.thana}, ` : ''}{order.district || 'Dhaka'}
                          </div>
                        )}
                      </div>


                    </div>

                    {/* Bottom COD Box & Safety Instructions */}
                    <div className="pt-2">
                      <div className={`border-2 p-2 rounded text-center mb-2 ${
                        isPaid 
                          ? 'border-primary bg-primary/10 text-primary/80' 
                          : 'border-black bg-gray-50 text-black'
                      }`}>
                        <div className="text-[10px] font-black uppercase tracking-wider">
                          {isPaid ? 'PAYMENT COMPLETE' : 'CASH ON DELIVERY (COD)'}
                        </div>
                        <div className="text-xl font-black tracking-tight">
                          {isPaid ? 'PAID (৳0.00)' : `৳${formatBDT(codPayable)}`}
                        </div>
                      </div>

                      <div className="text-center text-[9px] text-gray-600 font-semibold">
                        ডেলিভারি ম্যানের সামনে পণ্য চেক করে রিসিভ করুন। রিটার্ন হলে হটলাইনে যোগাযোগ করুন।
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. FORMAT: 3" x 2" Mini Box Sticker */}
                {printFormat === '3x2' && (
                  <div className="thermal-3x2 bg-white text-black p-2.5 rounded-xl shadow-lg border border-slate-300 w-[288px] min-h-[192px] font-sans flex flex-col justify-between print:shadow-none print:border-0 print:rounded-none print:w-[3in] print:h-[2in] print:p-2 print:m-0 print:page-break-after-always">
                    <div className="flex items-center justify-between border-b border-black pb-1">
                      <span className="font-black text-xs uppercase">BD SHOPPING</span>
                      <span className="font-mono text-[9px] font-bold">{order.order_number}</span>
                    </div>

                    <div className="py-1 flex flex-col items-center justify-center">
                      <div 
                        className="w-full flex justify-center" 
                        dangerouslySetInnerHTML={{ __html: order.tracking_code ? generateCode128Svg(order.tracking_code, 32, 1.3).svg : generateCode128Svg(order.order_number, 32, 1.3).svg }}
                      />
                    </div>

                    <div className="border-t border-black pt-1 flex justify-between items-end text-[10px]">
                      <div>
                        <div className="font-bold truncate max-w-[170px]">{order.customer_name}</div>
                        <div className="font-mono font-bold">{order.customer_phone}</div>
                      </div>
                      <div className="text-right font-black text-xs">
                        {isPaid ? 'PAID' : `৳${formatBDT(codPayable)}`}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. FORMAT: Standard A4 / A5 Invoice */}
                {printFormat === 'invoice' && (
                  <div className="standard-invoice bg-white text-black p-8 rounded-xl shadow-lg border border-slate-300 w-[680px] font-sans print:shadow-none print:border-0 print:rounded-none print:w-full print:p-4 print:page-break-after-always">
                    <div className="flex justify-between items-start border-b pb-4">
                      <div>
                        <h1 className="text-2xl font-black tracking-tight uppercase">BD E-COMMERCE</h1>
                        <p className="text-xs text-gray-600">Enterprise Order Fulfillment Invoice</p>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-bold">Invoice #{order.order_number}</div>
                        <div className="text-xs text-gray-600">Date: {order.created_at ? new Date(order.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-b text-xs">
                      <div>
                        <span className="font-bold uppercase text-gray-500">Customer Details:</span>
                        <div className="font-black text-sm">{order.customer_name}</div>
                        <div className="font-mono font-bold text-gray-700">{order.customer_phone}</div>
                        <div className="text-gray-600 mt-1">{order.shipping_address}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold uppercase text-gray-500">Shipping & Logistics:</span>
                        <div className="font-bold">{order.courier_name || 'Standard Courier'}</div>
                        {order.tracking_code && <div className="font-mono text-gray-600">Tracking: {order.tracking_code}</div>}
                        <div className="mt-1 font-bold">Status: {isPaid ? 'Paid' : 'Cash on Delivery (COD)'}</div>
                      </div>
                    </div>

                    <table className="w-full text-xs text-left my-4">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="py-2 px-1">Item</th>
                          <th className="py-2 px-1 text-right">Price</th>
                          <th className="py-2 px-1 text-center">Qty</th>
                          <th className="py-2 px-1 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items && order.items.map((it, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="py-2 px-1 font-semibold">
                              {it.product?.name_en || it.name || 'Product'}
                              {it.variant?.sku ? ` (${it.variant.sku})` : ''}
                            </td>
                            <td className="py-2 px-1 text-right font-mono">৳{formatBDT(it.unit_price)}</td>
                            <td className="py-2 px-1 text-center font-bold">{it.quantity}</td>
                            <td className="py-2 px-1 text-right font-mono font-bold">
                              ৳{formatBDT(parseFloat(it.unit_price.toString()) * it.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="flex justify-end pt-2">
                      <div className="w-64 space-y-1.5 text-xs">
                        <div className="flex justify-between border-t-2 pt-1 font-black text-sm">
                          <span>Total Payable:</span>
                          <span className="font-mono">৳{formatBDT(order.total_payable)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Global Print Styles */}
        <style jsx global>{`
          @media print {
            .print\:block { display: block !important; }
            .print-page-wrapper { page-break-after: always !important; break-after: page !important; }
            body {
              background: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            .thermal-4x6 {
              width: 4in !important;
              height: 6in !important;
              page-break-after: always !important;
              break-after: page !important;
              margin: 0 auto !important;
              box-shadow: none !important;
              border: none !important;
            }
            .thermal-3x2 {
              width: 3in !important;
              height: 2in !important;
              page-break-after: always !important;
              break-after: page !important;
              margin: 0 auto !important;
              box-shadow: none !important;
              border: none !important;
            }
            .standard-invoice {
              width: 100% !important;
              page-break-after: always !important;
              break-after: page !important;
              box-shadow: none !important;
              border: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
