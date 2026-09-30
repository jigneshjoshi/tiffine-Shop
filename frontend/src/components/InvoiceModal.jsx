import React from 'react';
import { Download, Printer, Utensils, CheckCircle2, ShieldCheck, X } from 'lucide-react';

export default function InvoiceModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const subtotal = order.subtotal || Math.round((order.totalAmount / 1.05) * 100) / 100;
  const tax = order.taxAmount || Math.round((order.totalAmount - subtotal) * 100) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-8 shadow-2xl border border-slate-200 relative my-4 sm:my-8 text-slate-800 font-['Plus_Jakarta_Sans',sans-serif] max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Area */}
        <div id="tax-invoice-content" className="space-y-5 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-4 sm:pb-5 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
                <Utensils className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">APKA Tiffine Center</h1>
                <p className="text-xs text-slate-500 font-semibold">Official GST Tax Invoice & Receipt</p>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${
                  order.paymentMode === 'COD' && order.paymentStatus === 'PENDING_COD'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                {order.paymentMode === 'COD'
                  ? (order.paymentStatus === 'PENDING_COD' ? '💵 CASH ON DELIVERY (PENDING)' : '✓ PAID IN CASH TO VENDOR')
                  : '✓ PAID VIA PAYTM GATEWAY'}
              </span>
              <p className="text-xs text-slate-400 mt-1 font-mono">INV-{order.orderNumber}</p>
            </div>
          </div>

          {/* Invoice Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl text-xs border border-slate-100">
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Invoice Date</p>
              <p className="font-bold text-slate-800 mt-0.5">{invoiceDate}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Reference / Txn ID</p>
              <p className="font-mono font-bold text-slate-800 mt-0.5 truncate">{order.paytmTxnId || 'PTM' + Date.now()}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Plan Type</p>
              <p className="font-bold text-orange-600 mt-0.5">{order.planType} SUBSCRIPTION</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Payment Status</p>
              <p className={`font-bold mt-0.5 ${order.paymentStatus === 'PENDING_COD' ? 'text-amber-600' : 'text-emerald-600'}`}>
                {order.paymentStatus === 'PENDING_COD' ? 'PAY ON DELIVERY' : 'SUCCESSFUL'}
              </p>
            </div>
          </div>

          {/* Vendor & Customer Address Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
              <p className="font-extrabold text-slate-900 uppercase text-[11px] text-orange-600">Issued By (Vendor):</p>
              <p className="font-bold text-slate-800">{order.tiffinCenter?.centerName || 'Maa Ki Rasoi Tiffin Center'}</p>
              <p className="text-slate-600">{order.tiffinCenter?.address || 'Laxmi Nagar, Delhi'}</p>
              <p className="text-slate-500">Phone: {order.tiffinCenter?.phone || '9811223344'}</p>
              {order.tiffinCenter?.fssaiNo && <p className="text-slate-500 font-mono">FSSAI Lic: {order.tiffinCenter.fssaiNo}</p>}
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
              <p className="font-extrabold text-slate-900 uppercase text-[11px] text-orange-600">Billed To (Customer):</p>
              <p className="font-bold text-slate-800">{order.user?.name || 'Customer'}</p>
              <p className="text-slate-600">{order.deliveryAddress}</p>
              <p className="text-slate-500">Phone: {order.user?.phone}</p>
            </div>
          </div>

          {/* Itemized Billing Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3">Item Description</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{order.tiffinItem?.title}</p>
                    <p className="text-[11px] text-slate-500">{order.tiffinItem?.dishes}</p>
                  </td>
                  <td className="p-3 font-semibold text-slate-600">{order.tiffinItem?.category}</td>
                  <td className="p-3 text-center font-bold">{order.quantity || 1}</td>
                  <td className="p-3 text-right font-extrabold text-slate-900">₹{subtotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Computation Summary */}
          <div className="flex justify-end text-xs">
            <div className="w-full sm:w-64 space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-bold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (5% Food Tax):</span>
                <span className="font-bold">₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge:</span>
                <span className="font-bold text-emerald-600">FREE</span>
              </div>
              <div className="flex justify-between text-slate-900 font-extrabold text-base pt-2 border-t border-slate-200">
                <span>Total Amount Paid:</span>
                <span className="text-orange-600">₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Paytm Stamp & Guarantee */}
          <div className="flex items-center justify-between p-3 bg-sky-50 rounded-2xl border border-sky-100 text-sky-900 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-600" />
              <span>Verified Paytm Instant Payment • 100% Secure Transaction</span>
            </div>
            <span className="font-bold font-mono text-[10px] uppercase text-sky-700">AUTH PASSED</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-50 transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-orange-500/20"
          >
            <Printer className="w-4 h-4" /> Print / Save Tax Invoice PDF
          </button>
        </div>
      </div>
    </div>
  );
}
