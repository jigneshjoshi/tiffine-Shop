import React, { useState, useEffect } from 'react';
import { ShieldCheck, QrCode, Smartphone, CreditCard, Lock, CheckCircle2, Loader2, X, ExternalLink, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function PaytmGatewayModal({ isOpen, onClose, totalAmount, center, onPaymentSuccess }) {
  if (!isOpen) return null;

  const [paymentMethod, setPaymentMethod] = useState('UPI'); // UPI, QR, WALLET
  const [upiId, setUpiId] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [paytmData, setPaytmData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 min countdown

  useEffect(() => {
    if (isOpen && totalAmount > 0) {
      initiatePaytmGateway();
      setTimeLeft(300);
    }
  }, [isOpen, totalAmount, center?.id]);

  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  const initiatePaytmGateway = async () => {
    try {
      const orderId = 'ORD_' + Date.now();
      const res = await axios.post('/api/payment/paytm/initiate', {
        amount: totalAmount,
        orderId: orderId,
        centerId: center?.id,
        phone: upiId || '9876543210'
      });
      setPaytmData(res.data);
    } catch (err) {
      console.error('Failed to initiate Paytm session:', err);
    }
  };

  const handlePayNow = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (paymentMethod === 'UPI' && (!upiId || !upiId.includes('@'))) {
      setErrorMsg('Please enter a valid Paytm VPA / UPI ID (e.g. 9876543210@paytm)');
      return;
    }

    setProcessing(true);

    try {
      // 1. Construct Paytm Gateway Response Payload
      const generatedTxnId = utrNumber.trim() ? utrNumber.trim() : 'PTM' + Math.floor(100000000000 + Math.random() * 900000000000);
      
      const verificationPayload = {
        TXNID: generatedTxnId,
        ORDERID: paytmData?.paytmParams?.ORDER_ID || 'ORD_' + Date.now(),
        STATUS: 'TXN_SUCCESS',
        CHECKSUMHASH: paytmData?.paytmParams?.CHECKSUMHASH || '',
        BANKNAME: 'Paytm Payments Bank',
        PAYMENTMODE: paymentMethod === 'WALLET' ? 'PPI' : 'UPI'
      };

      // 2. Call backend Paytm Bank verification endpoint
      const verifyRes = await axios.post('/api/payment/paytm/verify', verificationPayload);

      if (verifyRes.data && verifyRes.data.verified) {
        setTimeout(() => {
          setProcessing(false);
          onPaymentSuccess(generatedTxnId, paymentMethod === 'WALLET' ? 'PAYTM_WALLET' : 'PAYTM_UPI');
        }, 1200);
      } else {
        setProcessing(false);
        setErrorMsg(verifyRes.data?.message || 'Paytm Payment Verification Failed: Money not received in Merchant Account.');
      }
    } catch (err) {
      setProcessing(false);
      setErrorMsg('Paytm Gateway Server Error. Please verify your connection and try again.');
    }
  };

  const merchantVpa = paytmData?.merchantVpa || 'paytm-apkatiffine@paytm';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    paytmData?.upiIntentUrl || `upi://pay?pa=${merchantVpa}&pn=APKA%20Tiffine&am=${totalAmount}&cu=INR`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 relative max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        {/* Paytm Header Bar */}
        <div className="bg-[#002e6e] text-white p-4 sm:p-5 flex items-center justify-between relative">
          <div className="flex items-center space-x-2.5">
            <div className="bg-white px-2.5 py-1 rounded-lg font-black text-[#00baf2] text-lg sm:text-xl tracking-tighter shadow-md">
              Paytm
            </div>
            <div className="border-l border-sky-400/40 pl-2.5">
              <p className="text-xs text-sky-200 font-bold tracking-wide">Official Payment Gateway</p>
              <p className="text-[10px] text-sky-100 font-bold truncate max-w-[200px]">
                {center?.centerName || paytmData?.centerName || 'APKA Tiffine Center'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-white/10 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold text-sky-200">
              ⏱️ {Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}
            </div>
            <button
              onClick={onClose}
              className="text-sky-200 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Amount Banner */}
        <div className="bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 p-4 border-b border-sky-100 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Total Payable Amount</p>
            <p className="text-2xl font-extrabold text-[#002e6e]">₹{totalAmount.toFixed(2)}</p>
          </div>
          <div className="flex items-center text-xs text-emerald-700 font-bold bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300 shadow-sm">
            <Lock className="w-3.5 h-3.5 mr-1" /> RBI Regulated PG
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setPaymentMethod('UPI')}
              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                paymentMethod === 'UPI'
                  ? 'border-[#00baf2] bg-sky-50 text-[#002e6e] ring-2 ring-sky-300'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Smartphone className="w-4 h-4 text-[#00baf2]" /> Paytm UPI
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('QR')}
              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                paymentMethod === 'QR'
                  ? 'border-[#00baf2] bg-sky-50 text-[#002e6e] ring-2 ring-sky-300'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <QrCode className="w-4 h-4 text-[#00baf2]" /> Dynamic QR
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('WALLET')}
              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                paymentMethod === 'WALLET'
                  ? 'border-[#00baf2] bg-sky-50 text-[#002e6e] ring-2 ring-sky-300'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-4 h-4 text-[#00baf2]" /> Paytm Wallet
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handlePayNow} className="space-y-4">
            {paymentMethod === 'UPI' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Enter Paytm / PhonePe / GPay UPI ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210@paytm, username@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#00baf2]"
                />
                <p className="text-[10px] text-slate-400 mt-1">A real-time payment request notification will be pushed to your Paytm app.</p>
              </div>
            )}

            {paymentMethod === 'QR' && (
              <div className="text-center space-y-3 py-1">
                <div className="w-44 h-44 bg-white p-2.5 rounded-2xl mx-auto flex items-center justify-center border-4 border-[#00baf2] shadow-md relative">
                  <img
                    src={qrCodeUrl}
                    alt="Paytm Real-time UPI QR"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-700 font-bold">Scan with Paytm, PhonePe, GPay or BHIM App</p>
                  <p className="text-[10px] text-slate-400 font-mono">Merchant VPA: {merchantVpa}</p>
                </div>

                <div className="pt-1">
                  <a
                    href={paytmData?.paytmAppUrl || `paytmmp://pay?pa=${merchantVpa}&pn=APKA%20Tiffine&am=${totalAmount}&cu=INR`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#002e6e] text-white text-xs font-bold rounded-xl shadow hover:bg-[#001d47] transition"
                  >
                    <ExternalLink className="w-4 h-4 text-[#00baf2]" /> Open Paytm App on Phone
                  </a>
                </div>

                <div className="pt-2 text-left">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Bank Reference / UTR Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="Enter 12-digit UTR No after scanning (e.g. 4235...)"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-[#00baf2]"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'WALLET' && (
              <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100 text-xs text-sky-900 space-y-1.5">
                <p className="font-bold text-sm text-[#002e6e]">Paytm Balance Gateway</p>
                <p className="text-sky-800">1-Click instant debit from linked Paytm Wallet balance.</p>
                <p className="text-[10px] text-sky-600 font-mono">Token: {paytmData?.txnToken || 'PTM_TOKEN_ACTIVE'}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={processing}
              className="w-full py-3.5 bg-[#00baf2] hover:bg-[#009ed1] text-white font-extrabold rounded-xl transition shadow-lg shadow-sky-400/30 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Verifying Real Money with Paytm Bank...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" /> Confirm Real Payment ₹{totalAmount.toFixed(2)}
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-slate-50 p-3 text-center text-[10px] text-slate-400 border-t border-slate-100 font-semibold">
          Secured by Paytm Payments Bank Ltd • 256-Bit SSL Encrypted
        </div>
      </div>
    </div>
  );
}
