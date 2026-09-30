import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Package,
  Utensils,
  MapPin,
  Clock,
  CheckCircle2,
  Calendar,
  DollarSign,
  Phone,
  Store,
  ChefHat,
  ShieldCheck,
  Truck,
  FileText,
  Printer,
  Key,
  Copy,
  CheckCheck,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Navigation,
  Check,
  X,
  CreditCard,
  MessageCircle,
  Sparkles,
  Info,
  Layers,
  ChevronRight,
  ExternalLink,
  Flame,
  Leaf,
  Loader2,
  Camera,
  QrCode,
  XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import InvoiceModal from '../components/InvoiceModal';
import PaytmGatewayModal from '../components/PaytmGatewayModal';
import notify from '../utils/notify';

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals & Actions State
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaytm15DayModal, setShowPaytm15DayModal] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);
  
  // Delivery OTP Verification State (for Vendor/Admin view)
  const [enteredOtp, setEnteredOtp] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Status Change State (for Vendor/Admin)
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Skip / Pause Date Modal State
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipTargetDate, setSkipTargetDate] = useState('');
  const [skipReasonChip, setSkipReasonChip] = useState('Out of Station / Travel');
  const [skipCustomNotes, setSkipCustomNotes] = useState('');
  const [submittingSkip, setSubmittingSkip] = useState(false);

  // Cancel Order Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonChip, setCancelReasonChip] = useState('Schedule Changed');
  const [cancelCustomNotes, setCancelCustomNotes] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Custom QR Payment Proof Modal State
  const [showProofModal, setShowProofModal] = useState(false);
  const [verifyingProof, setVerifyingProof] = useState(false);

  const handleVerifyPaymentProof = async (status, notes) => {
    setVerifyingProof(true);
    try {
      const res = await axios.put(`/api/vendor/orders/${order.id}/verify-payment-proof`, {
        status: status || 'VERIFIED',
        notes: notes || 'Payment proof verified by kitchen'
      });
      notify.success(
        status === 'VERIFIED'
          ? `✅ Payment Approved & Order #${order.orderNumber} Confirmed!`
          : `❌ Payment Proof Rejected for Order #${order.orderNumber}`,
        status === 'VERIFIED' ? 'Payment Verified' : 'Payment Rejected'
      );
      setShowProofModal(false);
      fetchOrderDetails(true);
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to update payment proof status.');
    } finally {
      setVerifyingProof(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [orderId]);

  // Real-time polling every 6 seconds to track live status updates
  useEffect(() => {
    if (!orderId) return;
    const interval = setInterval(() => {
      fetchOrderDetails(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrderDetails = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      // Fetch order either via customer or vendor endpoint
      let res;
      try {
        res = await axios.get(`/api/customer/orders/${orderId}`);
      } catch (err) {
        res = await axios.get(`/api/vendor/orders/${orderId}`);
      }
      setOrder(res.data);

      // Fetch attendance logs for multi-day plans
      try {
        const attRes = await axios.get(`/api/customer/orders/${orderId}/attendance`);
        setAttendanceLogs(attRes.data || []);
      } catch (e) {
        console.error('Attendance fetch error:', e);
      }
    } catch (err) {
      console.error(err);
      if (!silent) setError('Order not found or access restricted.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleCopyOtp = () => {
    if (!order?.currentDeliveryOtp) return;
    navigator.clipboard.writeText(order.currentDeliveryOtp);
    setCopiedOtp(true);
    notify.success('Delivery OTP copied to clipboard!', 'Copied');
    setTimeout(() => setCopiedOtp(false), 3000);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!enteredOtp || enteredOtp.length !== 4) {
      notify.error('Please enter the valid 4-digit OTP provided by the customer.');
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await axios.post(`/api/vendor/orders/${order.id}/verify-delivery-otp`, {
        otp: enteredOtp,
        notes: deliveryNote || 'Handed over directly to customer'
      });
      notify.success(res.data.message || 'OTP verified! Meal marked as delivered.');
      setEnteredOtp('');
      setDeliveryNote('');
      fetchOrderDetails(true);
    } catch (err) {
      notify.error(err.response?.data?.error || 'Invalid OTP. Please verify with customer.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      if (newStatus === 'CONFIRMED') {
        await axios.put(`/api/vendor/orders/${order.id}/confirm`);
      } else {
        await axios.put(`/api/vendor/orders/${order.id}/status`, { status: newStatus });
      }
      notify.success(`Order status updated to ${newStatus.replace('_', ' ')}`);
      fetchOrderDetails(true);
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCollectCod = async () => {
    try {
      await axios.put(`/api/vendor/orders/${order.id}/collect-cod`);
      notify.success('Cash collected! Payment marked as PAID.');
      fetchOrderDetails(true);
    } catch (err) {
      notify.error('Failed to update cash collection.');
    }
  };

  const handleSubmitSkipDate = async (e) => {
    e.preventDefault();
    if (!skipTargetDate) {
      notify.error('Please select the date you wish to pause/skip.');
      return;
    }

    setSubmittingSkip(true);
    try {
      const note = `${skipReasonChip}${skipCustomNotes ? ` - ${skipCustomNotes}` : ''}`;
      await axios.post('/api/customer/orders/attendance', {
        orderId: order.id,
        date: skipTargetDate,
        status: 'SKIPPED',
        notes: note
      });
      notify.success(`Tiffin paused for ${skipTargetDate}. 0 charges billed for this day.`);
      setShowSkipModal(false);
      setSkipTargetDate('');
      setSkipCustomNotes('');
      fetchOrderDetails(true);
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to record skipped day.');
    } finally {
      setSubmittingSkip(false);
    }
  };

  const handleConfirmCancelOrder = async (e) => {
    e.preventDefault();
    setSubmittingCancel(true);
    try {
      const reason = `${cancelReasonChip}${cancelCustomNotes ? ` - ${cancelCustomNotes}` : ''}`;
      const cancelledByRole = user?.role || 'CUSTOMER';
      await axios.put(`/api/customer/orders/${order.id}/cancel`, {
        reason: reason,
        cancelledBy: cancelledByRole
      });
      notify.success(`Order #${order.orderNumber} cancelled successfully.`);
      setShowCancelModal(false);
      fetchOrderDetails(true);
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to cancel order.');
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handlePaytm15DaySuccess = async (response) => {
    try {
      await axios.post(`/api/customer/orders/${order.id}/pay-15day`, {
        paytmTxnId: response.txnId || ('PTM_15D_' + Date.now())
      });
      notify.success('15-Day Attendance Bill settled successfully!');
      setShowPaytm15DayModal(false);
      fetchOrderDetails(true);
    } catch (err) {
      notify.error('Failed to record 15-day payment.');
    }
  };

  const getMapsUrl = (address) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`;
  };

  const isCustomer = user?.role === 'CUSTOMER';
  const isVendor = user?.role === 'VENDOR' || user?.role === 'ADMIN';

  // Stepper helper
  const getStepState = (stepKey) => {
    const status = order?.orderStatus;
    if (status === 'CANCELLED') return 'cancelled';

    const orderFlow = ['PENDING_CONFIRMATION', 'CONFIRMED', 'PREPARING', 'DISPATCHED', 'DELIVERED'];
    const currentIdx = orderFlow.indexOf(status);
    const targetIdx = orderFlow.indexOf(stepKey);

    if (currentIdx === -1) return 'pending';
    if (targetIdx < currentIdx) return 'completed';
    if (targetIdx === currentIdx) return 'current';
    return 'upcoming';
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        <p className="text-slate-600 font-extrabold text-sm animate-pulse">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Order Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">{error || 'We could not locate this order in our records.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-sm rounded-xl transition shadow-md shadow-orange-500/20"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isVeg = order.tiffinItem?.category === 'VEG' || order.tiffinItem?.category === 'JAIN';
  const isMonthlyOr15Day = order.planType === 'MONTHLY' || order.planType === '15_DAYS';

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 pt-4">
      {/* Top Header & Breadcrumbs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-orange-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Orders</span>
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 shadow-sm transition"
            >
              <FileText className="w-4 h-4 text-orange-500" />
              <span>Tax Invoice</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 shadow-sm transition"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print KOT Slip</span>
            </button>

            {isCustomer && order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'CANCELLED' && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-bold rounded-xl border border-rose-200 shadow-sm transition"
              >
                <X className="w-4 h-4" />
                <span>Cancel Order</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Order Banner & Top Stats */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-orange-500 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  {order.planType?.replace('_', ' ')} PLAN
                </span>
                <span className="bg-white/10 text-white backdrop-blur-md text-[11px] font-bold px-3 py-1 rounded-full border border-white/10">
                  Slot: {order.tiffinItem?.mealType?.replace('_', ' ')}
                </span>
                <span className={`text-[11px] font-black px-3 py-1 rounded-full ${
                  order.paymentStatus === 'PAID'
                    ? 'bg-emerald-500 text-white'
                    : order.paymentStatus === 'PARTIAL_15DAY_PENDING'
                    ? 'bg-amber-500 text-white'
                    : 'bg-rose-500 text-white'
                }`}>
                  {order.paymentStatus === 'PAID' ? '✓ PAID' : order.paymentStatus}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight mb-2">
                Order #{order.orderNumber}
              </h1>

              <p className="text-slate-300 text-xs sm:text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-400" />
                <span>Placed on {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </p>
            </div>

            {/* Total Payable Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 min-w-[220px] text-right flex flex-col justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-slate-300">Total Billed</p>
                <p className="text-2xl sm:text-3xl font-black text-amber-300">
                  ₹{order.totalAmount}
                </p>
              </div>

              <div className="mt-2 text-xs text-slate-200 flex items-center justify-end gap-1.5 font-medium">
                <CreditCard className="w-3.5 h-3.5 text-orange-400" />
                <span>Paid via {order.paymentMode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Delivery Progress Stepper */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-500" />
              <span>Live Order & Delivery Tracker</span>
            </h2>

            {order.orderStatus === 'CANCELLED' ? (
              <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-black rounded-full">
                CANCELLED ({order.cancelledBy || 'User'})
              </span>
            ) : (
              <span className={`px-3 py-1 text-xs font-black rounded-full flex items-center gap-1.5 ${
                order.orderStatus === 'DELIVERED'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                {order.orderStatus.replace('_', ' ')}
              </span>
            )}
          </div>

          {order.orderStatus === 'CANCELLED' ? (
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 text-xs sm:text-sm">
              <p className="font-extrabold flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                This order was cancelled
              </p>
              <p className="text-rose-700">
                Reason: {order.cancellationReason || 'Cancelled upon request'}
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                {[
                  { key: 'PENDING_CONFIRMATION', label: 'Order Placed', desc: 'Received by Kitchen' },
                  { key: 'CONFIRMED', label: 'Accepted', desc: 'Kitchen Confirmed' },
                  { key: 'PREPARING', label: 'Cooking', desc: 'Fresh Preparation' },
                  { key: 'DISPATCHED', label: 'Out for Delivery', desc: 'Rider En Route' },
                  { key: 'DELIVERED', label: 'Delivered', desc: 'OTP Handshake Done' },
                ].map((step, idx) => {
                  const state = getStepState(step.key);
                  return (
                    <div key={step.key} className="flex flex-col items-center sm:items-start text-center sm:text-left relative">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                          state === 'completed'
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                            : state === 'current'
                            ? 'bg-orange-500 text-white ring-4 ring-orange-200 animate-pulse'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                          {state === 'completed' ? <Check className="w-4 h-4" /> : idx + 1}
                        </div>
                      </div>
                      <p className={`text-xs font-black ${state === 'current' ? 'text-orange-600' : state === 'completed' ? 'text-slate-800' : 'text-slate-400'}`}>
                        {step.label}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vendor Fast Status Control Panel */}
          {isVendor && order.orderStatus !== 'CANCELLED' && (
            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>Kitchen Quick Status Switcher:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {order.orderStatus === 'PENDING_CONFIRMATION' && (
                  <button
                    onClick={() => handleUpdateStatus('CONFIRMED')}
                    disabled={updatingStatus}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-sm transition disabled:opacity-50"
                  >
                    ✓ Accept Order
                  </button>
                )}
                {['CONFIRMED', 'PENDING_CONFIRMATION'].includes(order.orderStatus) && (
                  <button
                    onClick={() => handleUpdateStatus('PREPARING')}
                    disabled={updatingStatus}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-sm transition disabled:opacity-50"
                  >
                    👨‍🍳 Mark Cooking / Preparing
                  </button>
                )}
                {['CONFIRMED', 'PREPARING'].includes(order.orderStatus) && (
                  <button
                    onClick={() => handleUpdateStatus('DISPATCHED')}
                    disabled={updatingStatus}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-sm transition disabled:opacity-50"
                  >
                    🛵 Mark Out for Delivery
                  </button>
                )}
                {order.paymentMode === 'COD' && order.paymentStatus !== 'PAID' && (
                  <button
                    onClick={handleCollectCod}
                    className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl shadow-sm transition"
                  >
                    💵 Mark Cash Collected
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* OTP Security Handshake Card */}
        {order.orderStatus !== 'CANCELLED' && (
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-orange-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-orange-800 font-black text-sm uppercase tracking-wider">
                  <ShieldCheck className="w-5 h-5 text-orange-600" />
                  <span>Secure Contactless OTP Handshake</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  {order.todayOtpVerified || order.orderStatus === 'DELIVERED'
                    ? '✓ Meal Handover Verified & Delivered Today!'
                    : ['DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERING'].includes(order.orderStatus)
                    ? '🛵 Out for Delivery: 4-Digit Handover OTP'
                    : '🔒 Delivery Handover OTP Locked'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
                  {isCustomer
                    ? (order.todayOtpVerified || order.orderStatus === 'DELIVERED')
                      ? 'Meal has been received and verified with delivery partner. Today\'s attendance is logged in your ledger.'
                      : ['DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERING'].includes(order.orderStatus)
                      ? 'Share this 4-digit OTP with your delivery partner ONLY when you receive your fresh tiffin box. Once entered by the vendor, attendance is logged.'
                      : 'Your 4-digit delivery PIN unlocks automatically once the kitchen dispatches your order ("Out for Delivery"). Never share OTP without receiving your meal.'
                    : 'Ask the customer for their 4-digit live delivery PIN and enter it below to confirm attendance & delivery completion.'}
                </p>
              </div>

              {/* Customer OTP Box vs Vendor OTP Entry */}
              {isCustomer ? (
                (order.todayOtpVerified || order.orderStatus === 'DELIVERED') ? (
                  <div className="flex items-center gap-2 px-4 py-3 bg-emerald-100 text-emerald-900 rounded-2xl font-black text-xs border border-emerald-300 shadow-sm flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Attendance Verified Today</span>
                  </div>
                ) : ['DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERING'].includes(order.orderStatus) ? (
                  <div className="flex items-center gap-3 bg-white px-5 py-4 rounded-2xl border-2 border-orange-400 shadow-lg flex-shrink-0">
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-black text-orange-600">Your Delivery OTP</p>
                      <p className="text-3xl font-black tracking-widest text-slate-900 font-mono">
                        {order.currentDeliveryOtp || '----'}
                      </p>
                    </div>
                    <button
                      onClick={handleCopyOtp}
                      className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition"
                      title="Copy OTP"
                    >
                      {copiedOtp ? <CheckCheck className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 text-amber-900 rounded-2xl font-bold text-xs border border-amber-200 shadow-xs flex-shrink-0">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Unlocks on Dispatch</span>
                  </div>
                )
              ) : (
                <form onSubmit={handleVerifyOtp} className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
                  <input
                    type="text"
                    maxLength={4}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 4-digit OTP"
                    className="w-36 text-center font-mono font-black text-lg py-2.5 px-3 bg-white rounded-xl border-2 border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={verifyingOtp || enteredOtp.length !== 4}
                    className="px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {verifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    <span>Verify & Deliver</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* 2-Column Grid: Meal Details & Location */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Meal & Dishes Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meal Box Spec */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
              <h3 className="text-base sm:text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-orange-500" />
                <span>Tiffin Meal & Dishes Breakdown</span>
              </h3>

              <div className="flex flex-col sm:flex-row gap-5">
                <div className="w-full sm:w-44 h-40 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
                  <img
                    src={order.tiffinItem?.imageUrl || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600'}
                    alt={order.tiffinItem?.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    <span className="text-xs font-black text-slate-700 uppercase">{order.tiffinItem?.category}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-bold text-orange-600">{order.tiffinItem?.mealType?.replace('_', ' ')}</span>
                  </div>

                  <h4 className="text-lg font-black text-slate-900">{order.tiffinItem?.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{order.tiffinItem?.description}</p>

                  {order.tiffinItem?.dishes && (
                    <div className="mt-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 block">
                        Included Dishes in Every Thali:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {order.tiffinItem.dishes.split(',').map((dish, i) => (
                          <span
                            key={i}
                            className="bg-white px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 border border-slate-200/80 shadow-xs"
                          >
                            🍱 {dish.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <span>Order Quantity: <strong>{order.quantity} Tiffin Box(es)</strong></span>
                    <span>Daily Rate: <strong>₹{order.pricePerDayRate || order.tiffinItem?.pricePerDay} / day</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance & Subscription Ledger (For Multi-day orders) */}
            {isMonthlyOr15Day && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-orange-500" />
                      <span>Daily Delivery & Attendance Ledger</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Completed: <strong>{order.deliveredDaysCount} Days</strong> | Paused/Skipped: <strong>{order.skippedDaysCount} Days</strong>
                    </p>
                  </div>

                  {isCustomer && order.orderStatus !== 'CANCELLED' && (
                    <button
                      onClick={() => setShowSkipModal(true)}
                      className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-black shadow-xs transition"
                    >
                      ⏸ Pause / Skip a Date
                    </button>
                  )}
                </div>

                {/* 15-Day Postpaid Alert Banner if pending */}
                {order.is15DayPaymentPending && (
                  <div className="mb-5 p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-black text-amber-900">15-Day Attendance Cycle Completed!</p>
                        <p className="text-xs text-amber-700">Due Amount: ₹{order.dueAmount15Day} ({order.deliveredDaysCount} days consumed)</p>
                      </div>
                    </div>
                    {isCustomer && (
                      <button
                        onClick={() => setShowPaytm15DayModal(true)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md transition"
                      >
                        Pay ₹{order.dueAmount15Day} via Paytm
                      </button>
                    )}
                  </div>
                )}

                {/* Attendance Log Table */}
                {attendanceLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">
                    No daily attendance marked yet. Daily deliveries will appear here as OTPs are verified.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase font-black text-[10px]">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Delivered Time</th>
                          <th className="py-2.5 px-3">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendanceLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 font-bold text-slate-800">{log.attendanceDate}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                                log.status === 'DELIVERED'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : log.status === 'SKIPPED'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {log.deliveredAt ? new Date(log.deliveredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">{log.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Col: Address, Kitchen Contact, & Bill Summary */}
          <div className="space-y-6">
            {/* Delivery Address Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-500" />
                <span>Delivery Address</span>
              </h3>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                <p className="font-bold text-slate-800 leading-relaxed">{order.deliveryAddress}</p>
                <p className="text-slate-500 font-medium">Area: {order.area} • PIN: {order.pincode}</p>
              </div>

              <a
                href={getMapsUrl(order.deliveryAddress)}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4 text-blue-600" />
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>

            {/* Kitchen Partner Profile */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-orange-500" />
                <span>Kitchen Partner</span>
              </h3>

              <div className="space-y-2 text-xs">
                <p className="font-extrabold text-slate-900 text-sm">{order.tiffinCenter?.centerName}</p>
                <p className="text-slate-500">Chef / Owner: {order.tiffinCenter?.ownerName}</p>
                <p className="text-slate-500">FSSAI Lic: <strong>{order.tiffinCenter?.fssaiNo || 'Certified 100%'}</strong></p>
                <p className="text-slate-500">Address: {order.tiffinCenter?.address}, {order.tiffinCenter?.area}</p>
              </div>

              {order.tiffinCenter?.phone && (
                <a
                  href={`tel:${order.tiffinCenter.phone}`}
                  className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Call Kitchen ({order.tiffinCenter.phone})</span>
                </a>
              )}
            </div>

            {/* Customer Contact (for Vendor/Admin) */}
            {isVendor && order.user && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-indigo-500" />
                  <span>Customer Details</span>
                </h3>

                <div className="space-y-1.5 text-xs">
                  <p className="font-extrabold text-slate-900">{order.user.name}</p>
                  <p className="text-slate-500">Phone: {order.user.phone}</p>
                  <p className="text-slate-500">Email: {order.user.email}</p>
                </div>

                {order.user.phone && (
                  <a
                    href={`tel:${order.user.phone}`}
                    className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs rounded-xl border border-indigo-200 transition flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4 text-indigo-600" />
                    <span>Call Customer ({order.user.phone})</span>
                  </a>
                )}
              </div>
            )}

            {/* Custom UPI QR Payment Proof & Verification Card */}
            {order.paymentMode === 'CUSTOM_QR' && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-amber-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-amber-600" />
                    <span>UPI QR Payment Proof</span>
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                    order.paymentProofStatus === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : order.paymentProofStatus === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800 animate-pulse'
                  }`}>
                    {order.paymentProofStatus === 'VERIFIED'
                      ? '✓ Verified & Paid'
                      : order.paymentProofStatus === 'REJECTED'
                      ? '❌ Proof Rejected'
                      : '⏳ Under Review'}
                  </span>
                </div>

                <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2 text-xs">
                  {order.paymentReferenceNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bank UTR / Ref:</span>
                      <span className="font-mono font-bold text-slate-800">{order.paymentReferenceNumber}</span>
                    </div>
                  )}

                  {order.paymentScreenshotUrl ? (
                    <div className="space-y-2 pt-1">
                      <p className="text-[11px] text-slate-500 font-medium">Uploaded Payment Screenshot Proof:</p>
                      <div className="relative group cursor-pointer" onClick={() => setShowProofModal(true)}>
                        <img
                          src={order.paymentScreenshotUrl}
                          alt="Payment Receipt"
                          className="w-full h-36 object-cover rounded-xl border border-amber-300 shadow-sm transition group-hover:opacity-90"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-xl flex items-center justify-center text-white font-bold text-xs">
                          🔍 Click to Zoom / Inspect
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No screenshot proof uploaded.</p>
                  )}
                </div>

                {/* Vendor 1-Click Verification Action Buttons */}
                {isVendor && order.paymentProofStatus !== 'VERIFIED' && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleVerifyPaymentProof('VERIFIED', 'Verified by kitchen owner')}
                      disabled={verifyingProof}
                      className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve Proof ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const reason = window.prompt('Enter reason for rejecting payment proof:', 'Screenshot not clear / amount mismatch');
                        if (reason) handleVerifyPaymentProof('REJECTED', reason);
                      }}
                      disabled={verifyingProof}
                      className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" /> Reject Proof
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Price & Billing Breakdown */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>Payment Summary</span>
              </h3>

              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between text-slate-600 pb-1">
                  <span>Subtotal:</span>
                  <span className="font-bold">₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-2 pb-1">
                  <span>GST Tax (5%):</span>
                  <span className="font-bold">₹{order.taxAmount}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-2 pb-1">
                  <span>Delivery Charges:</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between text-slate-900 font-black text-sm pt-2">
                  <span>Total Amount:</span>
                  <span className="text-orange-600">₹{order.totalAmount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Proof Lightbox Modal */}
      {showProofModal && order.paymentScreenshotUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative space-y-4">
            <button
              onClick={() => setShowProofModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 border-b pb-3">
              <Camera className="w-5 h-5 text-orange-600" />
              <h3 className="font-black text-slate-900 text-base">Payment Screenshot • Order #{order.orderNumber}</h3>
            </div>
            <div className="bg-slate-900 rounded-2xl p-2 max-h-[420px] overflow-auto flex items-center justify-center">
              <img
                src={order.paymentScreenshotUrl}
                alt="Full Payment Proof"
                className="max-h-[400px] max-w-full object-contain rounded-xl"
              />
            </div>
            <div className="flex justify-between items-center pt-2">
              <a
                href={order.paymentScreenshotUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-orange-600 hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
              </a>
              <button
                onClick={() => setShowProofModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Invoice Modal */}
      {showInvoiceModal && (
        <InvoiceModal
          order={order}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}

      {/* Paytm 15-Day Modal */}
      {showPaytm15DayModal && (
        <PaytmGatewayModal
          isOpen={showPaytm15DayModal}
          amount={order.dueAmount15Day || 1000}
          orderNumber={`ORD-15D-${order.id}`}
          onSuccess={handlePaytm15DaySuccess}
          onClose={() => setShowPaytm15DayModal(false)}
        />
      )}

      {/* Pause / Skip Tiffin Modal */}
      {showSkipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowSkipModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              <span>Pause / Skip a Delivery Date</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Select the date you want to skip. You won't be charged for this day.
            </p>

            <form onSubmit={handleSubmitSkipDate} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Date to Skip *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={skipTargetDate}
                  onChange={(e) => setSkipTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Reason</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {['Out of Station / Travel', 'Diet / Fasting Today', 'Eating Out', 'Other'].map(r => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setSkipReasonChip(r)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition ${
                        skipReasonChip === r ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Optional additional notes..."
                  value={skipCustomNotes}
                  onChange={(e) => setSkipCustomNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSkipModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSkip}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md disabled:opacity-50"
                >
                  {submittingSkip ? 'Pausing...' : 'Confirm Pause'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5" />
              <span>Cancel Order #{order.orderNumber}?</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to cancel this order?
            </p>

            <form onSubmit={handleConfirmCancelOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Reason for cancellation</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {['Schedule Changed', 'Ordered by Mistake', 'Address Changed', 'Other Reason'].map(r => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setCancelReasonChip(r)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition ${
                        cancelReasonChip === r ? 'bg-rose-500 text-white border-rose-500' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Optional details..."
                  value={cancelCustomNotes}
                  onChange={(e) => setCancelCustomNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md disabled:opacity-50"
                >
                  {submittingCancel ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
