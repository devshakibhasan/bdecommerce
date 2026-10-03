'use client';

import React from 'react';
import { generateCode128Svg } from '@/utils/barcode';
import { formatBDT } from '@/utils/currency';
import { 
  Package, MapPin, Phone, Mail, Truck, 
  CreditCard, ShieldCheck, CheckCircle2, 
  Clock, Hash, Calendar, Building2, User,
  AlertCircle
} from 'lucide-react';

export interface PrintSlipItem {
  id?: number | string;
  product_id?: number;
  product_name: string;
  sku?: string;
  color?: string | null;
  size?: string | null;
  variant_name?: string | null;
  unit_price: number;
  quantity: number;
  total?: number;
  image?: string | null;
  variant?: any;
  product?: any;
}

export interface PrintSlipOrder {
  id?: number | string;
  order_number: string;
  created_at?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  shipping_address: string;
  district?: string | null;
  thana?: string | null;
  shipping_zone?: string | null;
  shipping_zone_label?: string | null;
  delivery_speed?: string | null;
  courier_name?: string | null;
  tracking_code?: string | null;
  payment_method: string;
  payment_status: string;
  fulfillment_status?: string;
  subtotal?: number;
  delivery_fee?: number;
  discount_amount?: number;
  advance_amount?: number;
  coupon_code?: string | null;
  total_payable?: number;
  payment_transaction_id?: string | null;
  notes?: string | null;
  admin_notes?: string | null;
  items: PrintSlipItem[];
  customer?: any;
}

interface OrderPrintSlipProps {
  order: PrintSlipOrder;
  compact?: boolean;
}

// Generate realistic Code128-style SVG barcode based on order number string
function BarcodeSVG({ value }: { value: string }) {
  const cleanVal = (value || 'BD-ORDER').toUpperCase().replace(/[^A-Z0-9-]/g, '');
  // Deterministic bar widths based on char codes
  const bars: { width: number; space: number }[] = [];
  for (let i = 0; i < cleanVal.length; i++) {
    const code = cleanVal.charCodeAt(i);
    bars.push({
      width: (code % 3) + 1.5,
      space: ((code * 2) % 3) + 1.5,
    });
  }

  return (
    <div className="flex flex-col items-center">
      <svg className="h-10 w-44" viewBox="0 0 160 40" preserveAspectRatio="none">
        {/* Guard bars */}
        <rect x="2" y="2" width="2" height="34" fill="#0f172a" />
        <rect x="6" y="2" width="2" height="34" fill="#0f172a" />
        {/* Dynamic data bars */}
        {bars.map((bar, idx) => {
          const xPos = 12 + idx * 8.5;
          return (
            <React.Fragment key={idx}>
              <rect x={xPos} y="2" width={bar.width} height="34" fill="#0f172a" />
            </React.Fragment>
          );
        })}
        {/* End guard bars */}
        <rect x="152" y="2" width="2" height="34" fill="#0f172a" />
        <rect x="156" y="2" width="2" height="34" fill="#0f172a" />
      </svg>
      <span className="font-mono text-[10px] tracking-widest font-black text-slate-800 uppercase mt-0.5">
        *{cleanVal}*
      </span>
    </div>
  );
}

export function OrderPrintSlip({ order, compact = false }: OrderPrintSlipProps) {
  const isPaid = order.payment_status === 'paid';
  const isCod = order.payment_method === 'cod' || !isPaid;

  const rawSubtotal = Number(order.subtotal) || 
    order.items.reduce((acc, it) => acc + (Number(it.unit_price) * Number(it.quantity)), 0);
  const deliveryFee = Number(order.delivery_fee) || 0;
  const discountAmount = Number(order.discount_amount) || 0;
  const advanceAmount = Number(order.advance_amount) || 0;
  const totalPayable = Number(order.total_payable) || Math.max(0, rawSubtotal + deliveryFee - discountAmount - advanceAmount);
  
  const totalUnits = order.items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  const totalItemsCount = order.items.length;

  const amountToCollect = isPaid ? 0 : Math.max(0, totalPayable - advanceAmount);

  const formattedDate = order.created_at 
    ? new Date(order.created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div 
      id="print-slip"
      className="bg-white text-slate-900 w-full max-w-4xl mx-auto p-6 sm:p-8 font-sans border border-slate-300 print:border-none print:p-0 print:m-0 print:w-full print:max-w-none print:shadow-none text-xs leading-normal"
    >
      {/* ========================================================================= */}
      {/* TOP HEADER & SLIP IDENTITY                                                */}
      {/* ========================================================================= */}
      <div className="border-b-2 border-slate-900 pb-5">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          {/* Brand Identity */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black text-xl tracking-wider shadow-sm">
                BD
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase leading-none">
                  BD SHOP BANGLADESH
                </h1>
                <p className="text-[10px] font-bold text-slate-600 tracking-wider uppercase mt-0.5">
                  Official Packing Slip & Commercial Consignment
                </p>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
              <p className="font-medium">
                <span className="font-semibold text-slate-800">Corporate HQ:</span> Navana Tower, Level 6, Gulshan-1, Dhaka-1212
              </p>
              <p className="font-medium">
                <span className="font-semibold text-slate-800">Hotline:</span> 01410737290 &bull; <span className="font-semibold text-slate-800">Support:</span> support@bdshop.com
              </p>
              <p className="font-mono text-[10px] font-bold text-slate-700">
                BIN / VAT REGISTRATION: BIN-002847193-0101
              </p>
            </div>
          </div>

          {/* Slip Metadata & Barcode */}
          <div className="flex flex-col sm:items-end items-start space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-md text-[11px] font-black tracking-wider uppercase border ${
                isPaid 
                  ? 'bg-primary/10 text-primary border-primary' 
                  : 'bg-amber-50 text-amber-900 border-amber-600'
              }`}>
                {isPaid ? 'PAID INVOICE (PREPAID)' : 'CASH ON DELIVERY (COD)'}
              </span>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300">
                {order.fulfillment_status || 'CONFIRMED'}
              </span>
            </div>

            {/* Order Barcode */}
            <BarcodeSVG value={order.order_number} />

            <div className="text-right text-[11px] text-slate-600 space-y-0.5">
              <p className="font-bold font-mono text-slate-950 text-sm">
                ORDER #{order.order_number}
              </p>
              <p>
                <span className="text-slate-500">Date:</span> <span className="font-semibold text-slate-800">{formattedDate}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: CUSTOMER & DESTINATION                                         */}
      {/* ========================================================================= */}
      <div className="py-4 border-b border-slate-300">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
            1
          </div>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
            Customer & Delivery Destination Details
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Customer Bio & Address (7 cols) */}
          <div className="md:col-span-7 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Consignee / Customer
                </span>
                <p className="text-sm font-black text-slate-950 mt-0.5">
                  {order.customer_name || order.customer?.name || 'Customer'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Contact Phone
                </span>
                <p className="text-sm font-mono font-black text-slate-950 tracking-wide mt-0.5">
                  {order.customer_phone || order.customer?.phone}
                </p>
              </div>
            </div>

            {order.customer_email && (
              <p className="text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Email:</span> {order.customer_email}
              </p>
            )}

            <div className="pt-1 border-t border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Delivery Address (বাসা / রোড / এলাকা)
              </span>
              <p className="text-xs font-semibold text-slate-900 mt-0.5 leading-relaxed">
                {order.shipping_address || 'Address not specified'}
              </p>
            </div>

            {order.notes && (
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-700 mt-0.5" />
                <span><strong>Delivery Instruction:</strong> {order.notes}</span>
              </div>
            )}
          </div>

          {/* Destination Routing & Courier Logistics (5 cols) */}
          <div className="md:col-span-5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Logistics & Courier Routing
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[9px] font-bold uppercase text-slate-500 block">District (জেলা)</span>
                <span className="font-black text-slate-950 text-xs mt-0.5 block">
                  {order.district || 'Dhaka'}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[9px] font-bold uppercase text-slate-500 block">Thana (থানা)</span>
                <span className="font-black text-slate-950 text-xs mt-0.5 block">
                  {order.thana || 'N/A'}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-[11px] pt-1 border-t border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Courier Partner:</span>
                <span className="font-bold text-slate-950">
                  {order.courier_name || 'Steadfast Courier'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Tracking / Consignment:</span>
                <span className="font-mono font-bold text-blue-700">
                  {order.tracking_code || 'Pending Assignment'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Delivery Zone:</span>
                <span className="font-semibold text-slate-900">
                  {order.shipping_zone_label || (order.district === 'Dhaka' ? 'Inside Dhaka Metro' : 'Outside Dhaka (Nationwide)')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: ORDER ITEMS MATRIX (PROPER WAY)                                */}
      {/* ========================================================================= */}
      <div className="py-4 border-b border-slate-300">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
              2
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Order Items Matrix & Packing Checklist
            </h2>
          </div>
          <div className="text-[11px] text-slate-600 font-semibold">
            <span>Total Units: <strong>{totalUnits} Pcs</strong> across <strong>{totalItemsCount} line items</strong></span>
          </div>
        </div>

        {/* Matrix Table */}
        <table className="w-full text-left border-collapse border border-slate-300 text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-black border-b border-slate-300 text-[11px]">
              <th className="py-2 px-2.5 text-center w-8 border-r border-slate-300">#</th>
              <th className="py-2 px-3 border-r border-slate-300">Product Item & Description</th>
              <th className="py-2 px-3 border-r border-slate-300 w-32">SKU / Code</th>
              <th className="py-2 px-3 border-r border-slate-300 w-44">Attribute Matrix (Color / Size)</th>
              <th className="py-2 px-3 text-right border-r border-slate-300 w-24">Unit Price</th>
              <th className="py-2 px-2.5 text-center border-r border-slate-300 w-16">Qty</th>
              <th className="py-2 px-3 text-right w-24">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {order.items.map((item, idx) => {
              const color = item.color || item.variant?.color || null;
              const size = item.size || item.variant?.size || null;
              const hasAttributes = Boolean(color || size || item.variant_name);
              const unitPrice = Number(item.unit_price) || 0;
              const qty = Number(item.quantity) || 1;
              const lineTotal = Number(item.total) || (unitPrice * qty);

              return (
                <tr key={idx} className="hover:bg-slate-50/60 print:hover:bg-transparent">
                  {/* SL */}
                  <td className="py-2.5 px-2.5 text-center font-bold text-slate-600 border-r border-slate-200">
                    {idx + 1}
                  </td>

                  {/* Product Details */}
                  <td className="py-2.5 px-3 border-r border-slate-200 font-medium">
                    <div className="font-bold text-slate-950 text-xs leading-snug">
                      {item.product_name}
                    </div>
                  </td>

                  {/* SKU */}
                  <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-[11px] text-slate-700">
                    {item.sku || 'SKU-STD'}
                  </td>

                  {/* Attributes Matrix (Color & Size Badges) */}
                  <td className="py-2.5 px-3 border-r border-slate-200">
                    {hasAttributes ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {color && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-50 text-blue-900 border border-blue-300">
                            Color: {color}
                          </span>
                        )}
                        {size && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-primary/10 text-primary/80 border border-primary/40">
                            Size: {size}
                          </span>
                        )}
                        {!color && !size && item.variant_name && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                            {item.variant_name}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Standard Variant
                      </span>
                    )}
                  </td>

                  {/* Unit Price */}
                  <td className="py-2.5 px-3 text-right font-medium text-slate-800 border-r border-slate-200">
                    {formatBDT(unitPrice, 'en')}
                  </td>

                  {/* Qty */}
                  <td className="py-2.5 px-2.5 text-center border-r border-slate-200">
                    <span className="inline-block px-2 py-0.5 bg-slate-100 font-black text-slate-950 rounded-md text-xs border border-slate-300">
                      {qty}
                    </span>
                  </td>

                  {/* Line Total */}
                  <td className="py-2.5 px-3 text-right font-black text-slate-950">
                    {formatBDT(lineTotal, 'en')}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Matrix Table Footer */}
          <tfoot>
            <tr className="bg-slate-50 text-slate-900 font-black border-t-2 border-slate-300 text-xs">
              <td colSpan={4} className="py-2.5 px-3 text-right font-bold text-slate-600 border-r border-slate-300">
                Matrix Totals ({totalItemsCount} Line Items):
              </td>
              <td className="py-2.5 px-3 text-right font-semibold text-slate-600 border-r border-slate-300">
                Items Subtotal:
              </td>
              <td className="py-2.5 px-2.5 text-center font-black text-slate-950 border-r border-slate-300 bg-slate-100">
                {totalUnits}
              </td>
              <td className="py-2.5 px-3 text-right font-black text-slate-950">
                {formatBDT(rawSubtotal, 'en')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: PAYMENT & FINANCIALS                                           */}
      {/* ========================================================================= */}
      <div className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
            3
          </div>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
            Payment Method & Financial Ledger
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Side: Payment Verification & Courier Collection Box (7 cols) */}
          <div className="md:col-span-7 space-y-3">
            {/* Courier Rider Cash Directive Box */}
            <div className={`p-4 rounded-xl border-2 ${
              isPaid
                ? 'border-primary bg-primary/10/60 text-primary/90'
                : 'border-slate-900 bg-amber-50/70 text-slate-950'
            }`}>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-300/80">
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Courier Collection Notice (রাইডার ক্যাশ কালেকশন)
                </span>
                <span className="font-mono text-[10px] font-bold uppercase">
                  Payment: {order.payment_method?.toUpperCase()}
                </span>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-baseline justify-between gap-1">
                <div>
                  <div className="text-xs font-bold text-slate-700">
                    {isPaid ? 'Customer Already Paid Online' : 'Total Amount to Collect at Delivery:'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isPaid 
                      ? 'DO NOT collect any money from customer' 
                      : 'পণ্য হস্তান্তরের সময় গ্রাহকের কাছ থেকে নগদ বুঝে নিন'}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xl sm:text-2xl font-black font-mono ${
                    isPaid ? 'text-primary' : 'text-slate-950'
                  }`}>
                    {isPaid ? '৳0 (PAID ONLINE)' : formatBDT(amountToCollect, 'en')}
                  </span>
                </div>
              </div>

              {order.payment_transaction_id && (
                <div className="mt-2 pt-1.5 border-t border-slate-300/80 text-[10px] font-mono text-slate-700">
                  Transaction Ref: <strong>{order.payment_transaction_id}</strong>
                </div>
              )}
            </div>

            {/* Warehouse Verification & Signatures */}
            <div className="grid grid-cols-2 gap-4 pt-4 text-[10px] text-slate-600">
              <div className="border-t border-slate-400 pt-1.5">
                <p className="font-bold text-slate-900">Packer & QC Signature:</p>
                <p className="text-[9px] text-slate-500 italic mt-0.5">Verified items, colors & sizes</p>
              </div>
              <div className="border-t border-slate-400 pt-1.5 text-right">
                <p className="font-bold text-slate-900">Rider / Customer Signature:</p>
                <p className="text-[9px] text-slate-500 italic mt-0.5">Received in good condition</p>
              </div>
            </div>
          </div>

          {/* Right Side: Financial Accounting Ledger (5 cols) */}
          <div className="md:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block border-b border-slate-200 pb-1.5">
              Financial Breakdown & Balance
            </span>

            <div className="flex justify-between text-slate-700">
              <span>Item Subtotal:</span>
              <span className="font-semibold text-slate-950">{formatBDT(rawSubtotal, 'en')}</span>
            </div>

            <div className="flex justify-between text-slate-700">
              <span>Delivery Charge:</span>
              <span className="font-semibold text-slate-950">+{formatBDT(deliveryFee, 'en')}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-primary font-semibold">
                <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ''}:</span>
                <span>-{formatBDT(discountAmount, 'en')}</span>
              </div>
            )}

            {advanceAmount > 0 && (
              <div className="flex justify-between text-blue-700 font-semibold">
                <span>Advance Paid:</span>
                <span>-{formatBDT(advanceAmount, 'en')}</span>
              </div>
            )}

            {/* Grand Total */}
            <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-baseline font-black text-sm text-slate-950">
              <span>Total Payable:</span>
              <span className="text-base text-slate-950 font-black">
                {formatBDT(totalPayable, 'en')}
              </span>
            </div>

            {/* Net Due on Delivery */}
            <div className="pt-1.5 border-t border-slate-200 flex justify-between items-baseline text-xs font-bold">
              <span className="text-slate-800">Net Due on Delivery:</span>
              <span className={`font-mono text-sm font-black ${
                isPaid ? 'text-primary' : 'text-slate-950'
              }`}>
                {isPaid ? '৳0' : formatBDT(amountToCollect, 'en')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FOOTER & TERMS                                                            */}
      {/* ========================================================================= */}
      <div className="mt-6 pt-3 border-t border-slate-300 text-[10px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p>
          <strong>Return Policy:</strong> 7-day official warranty for defects. Please verify item in presence of the courier rider.
        </p>
        <p className="font-mono text-[9px] text-slate-400">
          Generated automatically by BD E-Commerce Engine &bull; {new Date().toISOString().slice(0, 10)}
        </p>
      </div>
    </div>
  );
}
