import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ShoppingBag,
  Utensils,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  Truck,
  Printer,
  ShieldCheck,
  AlertCircle,
  Check,
  X,
  CreditCard,
  Phone,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Award,
  ChevronRight,
  Filter,
  DollarSign,
  ChefHat,
  Eye,
  AlertTriangle,
  Info,
  Package,
  RotateCcw,
  UserCheck,
  User,
  Camera,
  Key,
  Copy,
  CheckCheck,
  Save,
  FileText,
  CalendarDays,
  Flame,
  Leaf,
  Search,
  ArrowRight,
  QrCode,
  XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import InvoiceModal from '../components/InvoiceModal';
import PaytmGatewayModal from '../components/PaytmGatewayModal';
import Pagination from '../components/Pagination';
import notify from '../utils/notify';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE', 'HISTORY', 'PROFILE'
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCurrentPage, setActiveCurrentPage] = useState(1);
  const [activePageSize, setActivePageSize] = useState(5);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);

  // Full Order Details & Tracker Modal State
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);

  // Order Cancellation State
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReasonChip, setCancelReasonChip] = useState('Schedule / Plans Changed');
  const [cancelCustomNotes, setCancelCustomNotes] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Attendance & 15-Day Payment Modal State
  const [activeAttendanceOrder, setActiveAttendanceOrder] = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [showPaytm15DayModal, setShowPaytm15DayModal] = useState(false);
  const [payingOrder15Day, setPayingOrder15Day] = useState(null);

  // Skip Tiffin Date & Mandatory Reason Modal State
  const [skipTargetDate, setSkipTargetDate] = useState(null);
  const [skipReasonChip, setSkipReasonChip] = useState('');
  const [skipCustomNotes, setSkipCustomNotes] = useState('');
  const [submittingSkip, setSubmittingSkip] = useState(false);

  // Customer Profile Edit State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: user?.address || '',
    city: user?.city || '',
    pincode: user?.pincode || '',
    dietaryPreference: user?.dietaryPreference || 'PURE_VEG',
    specialNotes: user?.specialNotes || ''
  });
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(user?.profileImageUrl || null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [copiedOtpId, setCopiedOtpId] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchUserOrders();
      fetchCustomerProfile();
    }
  }, [user?.id]);

  // Real-Time Polling every 6 seconds for live status updates & OTP handshake sync
  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => {
      fetchUserOrders(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const fetchUserOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(`/api/customer/users/${user.id}/orders`);
      const fetched = res.data || [];
      setOrders(fetched);

      if (selectedOrderDetail) {
        const fresh = fetched.find(o => o.id === selectedOrderDetail.id);
        if (fresh) setSelectedOrderDetail(fresh);
      }
      if (activeAttendanceOrder) {
        const freshAtt = fetched.find(o => o.id === activeAttendanceOrder.id);
        if (freshAtt) setActiveAttendanceOrder(freshAtt);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchCustomerProfile = async () => {
    try {
      const res = await axios.get(`/api/customer/profile/${user.id}`);
      if (res.data) {
        const d = res.data;
        setProfileForm({
          name: d.name || '',
          phone: d.phone || '',
          email: d.email || '',
          address: d.address || '',
          city: d.city || '',
          pincode: d.pincode || '',
          dietaryPreference: d.dietaryPreference || 'PURE_VEG',
          specialNotes: d.specialNotes || ''
        });
        if (d.profileImageUrl) setProfilePhotoPreview(d.profileImageUrl);
        updateUser(d);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const handleOpenAttendanceModal = async (order) => {
    setActiveAttendanceOrder(order);
    try {
      const res = await axios.get(`/api/customer/orders/${order.id}/attendance`);
      setAttendanceLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    }
  };

  // Universal 3-Hour Cutoff Verification Rule:
  // Lunch (12:00 PM - 1:00 PM supply): Cut-off is 9:00 AM
  // Dinner (7:00 PM - 8:30 PM supply): Cut-off is 4:00 PM
  const checkOrderCancellationEligibility = (order) => {
    if (!order) return { allowed: false, message: 'Invalid order', badgeType: 'error' };

    if (order.orderStatus === 'CANCELLED') {
      return { allowed: false, isCancelled: true, message: 'Order is already cancelled', badgeType: 'cancelled' };
    }
    if (order.orderStatus === 'DELIVERED') {
      return { allowed: false, isDelivered: true, message: 'Meals already delivered', badgeType: 'locked' };
    }
    if (order.orderStatus === 'DISPATCHED') {
      return { allowed: false, isDispatched: true, message: 'Out for delivery (Rider is on the way)', badgeType: 'locked' };
    }

    const today = new Date().toISOString().split('T')[0];
    const orderStartDate = order.startDate ? order.startDate : today;

    if (orderStartDate < today) {
      return { allowed: false, message: 'Past subscription date', badgeType: 'locked' };
    }

    if (orderStartDate > today) {
      return { allowed: true, message: 'Open: Future subscription date', badgeType: 'open' };
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMin;

    const mealType = order.tiffinItem?.mealType || 'FULL_DAY';

    if (mealType === 'LUNCH') {
      if (currentTimeMinutes >= 9 * 60) {
        return {
          allowed: false,
          cutoffPassed: true,
          message: 'Locked: Lunch cut-off closed at 9:00 AM (3 hrs before 12 PM supply)',
          badgeType: 'cutoff_closed'
        };
      }
      return {
        allowed: true,
        cutoffPassed: false,
        message: 'Open: Lunch cancellation open till 9:00 AM today',
        badgeType: 'open'
      };
    } else if (mealType === 'DINNER') {
      if (currentTimeMinutes >= 16 * 60) {
        return {
          allowed: false,
          cutoffPassed: true,
          message: 'Locked: Dinner cut-off closed at 4:00 PM (3 hrs before 7 PM supply)',
          badgeType: 'cutoff_closed'
        };
      }
      return {
        allowed: true,
        cutoffPassed: false,
        message: 'Open: Dinner cancellation open till 4:00 PM today',
        badgeType: 'open'
      };
    } else {
      if (currentTimeMinutes >= 16 * 60) {
        return {
          allowed: false,
          cutoffPassed: true,
          message: 'Locked: Same-day meal cut-off closed at 4:00 PM',
          badgeType: 'cutoff_closed'
        };
      }
      return {
        allowed: true,
        cutoffPassed: false,
        message: 'Open: Cut-off is 9:00 AM for Lunch / 4:00 PM for Dinner',
        badgeType: 'open'
      };
    }
  };

  const handleOpenCancelModal = (order, e) => {
    if (e) e.stopPropagation();
    const eligibility = checkOrderCancellationEligibility(order);
    if (!eligibility.allowed) {
      notify.warning(eligibility.message, 'Cancellation Closed');
      return;
    }
    setOrderToCancel(order);
    setCancelReasonChip('Schedule / Plans Changed');
    setCancelCustomNotes('');
  };

  const handleConfirmOrderCancellation = async (e) => {
    e.preventDefault();
    if (!orderToCancel) return;

    const finalReason = cancelReasonChip === 'Other Reason'
      ? (cancelCustomNotes.trim() || 'Customer requested cancellation')
      : (cancelCustomNotes.trim() ? `${cancelReasonChip} - ${cancelCustomNotes.trim()}` : cancelReasonChip);

    setSubmittingCancel(true);
    try {
      const res = await axios.put(`/api/customer/orders/${orderToCancel.id}/cancel`, {
        reason: finalReason,
        cancelledBy: `CUSTOMER (${user.name})`
      });

      notify.success(`Order #${orderToCancel.orderNumber} cancelled successfully.`, 'Order Cancelled');
      setOrderToCancel(null);
      setCancelReasonChip('');
      setCancelCustomNotes('');

      await fetchUserOrders(true);
      if (selectedOrderDetail && selectedOrderDetail.id === orderToCancel.id) {
        setSelectedOrderDetail(res.data.order);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to cancel order. Please check 3-hour cut-off window.';
      notify.error(msg, 'Cancellation Error');
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handleCopyOtp = (orderId, otp) => {
    if (!otp) return;
    navigator.clipboard.writeText(otp);
    setCopiedOtpId(orderId);
    notify.info(`Delivery OTP ${otp} copied to clipboard. Share with your delivery rider upon meal arrival!`, 'OTP Copied');
    setTimeout(() => setCopiedOtpId(null), 3000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      // 1. Update text fields
      const res = await axios.put(`/api/customer/profile/${user.id}`, profileForm);
      let updatedUser = res.data.user || res.data;

      // 2. Upload photo if selected
      if (profilePhotoFile) {
        const formData = new FormData();
        formData.append('photo', profilePhotoFile);
        const photoRes = await axios.post(`/api/customer/profile/${user.id}/photo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (photoRes.data.user) {
          updatedUser = photoRes.data.user;
        }
        setProfilePhotoPreview(photoRes.data.profileImageUrl);
      }

      updateUser(updatedUser);
      notify.success('Your profile & delivery preferences have been saved successfully!', 'Profile Updated');
      setProfilePhotoFile(null);
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to update profile. Please try again.', 'Update Failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhotoFile(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
    }
  };

  const generateDatesList = (order) => {
    if (!order) return [];
    const list = [];
    const start = order.startDate ? new Date(order.startDate) : new Date();

    let totalDays = 1;
    if (order.planType === 'MONTHLY' || order.planType === '30_DAYS') {
      totalDays = 30;
    } else if (order.planType === '15_DAYS' || order.planType === '15DAYS') {
      totalDays = 15;
    } else {
      totalDays = 1;
    }

    if (order.endDate && order.startDate) {
      const end = new Date(order.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 0 && diffDays <= 45) {
        totalDays = diffDays;
      }
    }

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      list.push({
        dayNumber: i + 1,
        dateStr: dateStr,
        dateObj: d,
        formatted: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
      });
    }
    return list;
  };

  const handleOpenSkipModal = (dateStr) => {
    setSkipTargetDate(dateStr);
    setSkipReasonChip('Fasting / Vrat');
    setSkipCustomNotes('');
  };

  const handleSubmitSkipTiffin = async (e) => {
    e.preventDefault();
    if (!activeAttendanceOrder || !skipTargetDate) return;

    const finalReason = skipReasonChip === 'Other'
      ? skipCustomNotes.trim()
      : (skipCustomNotes.trim() ? `${skipReasonChip} - ${skipCustomNotes.trim()}` : skipReasonChip);

    if (!finalReason) {
      notify.warning('Mandatory Reason Required: Please select or enter why you are skipping this tiffin.', 'Reason Required');
      return;
    }

    setSubmittingSkip(true);
    try {
      await axios.post('/api/customer/orders/attendance', {
        orderId: activeAttendanceOrder.id,
        date: skipTargetDate,
        status: 'SKIPPED',
        reason: finalReason
      });

      notify.success(`Tiffin skipped for ${skipTargetDate}. Reason: "${finalReason}" recorded for you and vendor.`, 'Attendance Logged');
      setSkipTargetDate(null);
      setSkipReasonChip('');
      setSkipCustomNotes('');

      const res = await axios.get(`/api/customer/orders/${activeAttendanceOrder.id}/attendance`);
      setAttendanceLogs(res.data || []);
      fetchUserOrders(true);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update attendance. Check 3-hour cut-off window.';
      notify.error(msg, 'Attendance Error');
    } finally {
      setSubmittingSkip(false);
    }
  };

  const handlePay15DayBillSuccess = async (txnId) => {
    if (!payingOrder15Day) return;
    try {
      await axios.post(`/api/customer/orders/${payingOrder15Day.id}/pay-15day`, {
        paytmTxnId: txnId
      });
      notify.success('15-Day Attendance Bill Paid Successfully via Paytm Gateway!', 'Payment Received');
      setShowPaytm15DayModal(false);
      setPayingOrder15Day(null);
      fetchUserOrders(true);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to process 15-day payment.';
      notify.error(msg, 'Payment Failed');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING_CONFIRMATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full font-bold text-xs animate-pulse">
            <Clock className="w-3 h-3 text-amber-600 animate-spin" /> Waiting Confirmation
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-100 text-sky-800 border border-sky-300 rounded-full font-bold text-xs">
            <CheckCircle2 className="w-3 h-3 text-sky-600" /> Kitchen Confirmed
          </span>
        );
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-800 border border-orange-300 rounded-full font-bold text-xs animate-pulse">
            <ChefHat className="w-3 h-3 text-orange-600" /> Cooking Fresh
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-800 border border-indigo-300 rounded-full font-bold text-xs">
            <Truck className="w-3 h-3 text-indigo-600 animate-bounce" /> Out For Delivery
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-bold text-xs">
            <Check className="w-3 h-3 text-emerald-600" /> Meal Delivered 🍱
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-full font-bold text-xs">
            <X className="w-3 h-3 text-rose-600" /> Cancelled ❌
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full font-bold text-xs">
            {status}
          </span>
        );
    }
  };

  const activeOrdersList = orders.filter(o => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED');
  const historyOrdersList = orders.filter(o => o.orderStatus === 'DELIVERED' || o.orderStatus === 'CANCELLED');

  const totalMealsEaten = orders.reduce((sum, o) => sum + (o.deliveredDaysCount || 0), 0);
  const totalSpentAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const total15DayPending = orders.reduce((sum, o) => sum + (o.dueAmount15Day || 0), 0);

  const cancellationReasonChips = [
    { label: '💼 Schedule / Plans Changed', val: 'Schedule / Plans Changed' },
    { label: '🚄 Out of Station / Traveling', val: 'Out of Station / Traveling' },
    { label: '🎯 Ordered by Mistake', val: 'Ordered by Mistake' },
    { label: '🥗 Food / Diet Preference', val: 'Food / Diet Preference Changed' },
    { label: '🏠 Cooking at Home', val: 'Cooking at Home' },
    { label: '✏️ Other Reason', val: 'Other Reason' }
  ];

  const skipReasonChips = [
    { label: '🕉️ Fasting / Vrat', val: 'Fasting / Vrat' },
    { label: '🚄 Out of Station / Travel', val: 'Out of Station' },
    { label: '🤒 Sick / Health Reason', val: 'Health Issue / Sick' },
    { label: '🏠 Cooking at Home', val: 'Cooking at Home' },
    { label: '🥗 Eating Outside', val: 'Eating Outside' },
    { label: '✏️ Other Reason', val: 'Other' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-8">
      {/* Dashboard Top Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-emerald-600 text-white p-4 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 sm:gap-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 z-10 min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            {profilePhotoPreview ? (
              <img
                src={profilePhotoPreview}
                alt={user?.name}
                className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-white/80 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-2xl sm:text-3xl font-black border-2 border-white/40 shadow-md">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <button
              onClick={() => setActiveTab('PROFILE')}
              title="Change Profile Picture"
              className="absolute -bottom-1 -right-1 p-1.5 bg-white text-orange-600 rounded-xl shadow-md hover:scale-110 transition"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider">
              👋 Customer Dashboard
            </span>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight break-words leading-tight">{user?.name}</h1>
            <p className="text-xs text-orange-100 font-medium break-words">
              {user?.phone} • {user?.email}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 z-10 w-full md:w-auto flex-shrink-0">
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`px-3.5 py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
              activeTab === 'PROFILE'
                ? 'bg-white text-orange-700 shadow-md'
                : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md'
            }`}
          >
            <User className="w-4 h-4" /> Edit Profile & Preferences
          </button>

          <Link
            to="/"
            className="px-3.5 py-2.5 bg-white hover:bg-orange-50 text-orange-700 font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl transition shadow-md flex items-center justify-center gap-1.5"
          >
            <Utensils className="w-4 h-4 text-orange-600" /> Explore Tiffins →
          </Link>
        </div>
      </div>

      {/* Navigation Tabs (Mobile Touch-Friendly) */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-black overflow-x-auto no-scrollbar scroll-smooth">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`flex-shrink-0 sm:flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${
            activeTab === 'ACTIVE'
              ? 'bg-orange-600 text-white shadow-md'
              : 'text-slate-600 hover:text-orange-600'
          }`}
        >
          <ShoppingBag className="w-4 h-4 flex-shrink-0" />
          <span>Active Orders & OTP ({activeOrdersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`flex-shrink-0 sm:flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${
            activeTab === 'HISTORY'
              ? 'bg-purple-700 text-white shadow-md'
              : 'text-slate-600 hover:text-purple-700'
          }`}
        >
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>Order History ({historyOrdersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`flex-shrink-0 sm:flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${
            activeTab === 'PROFILE'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'text-slate-600 hover:text-emerald-700'
          }`}
        >
          <User className="w-4 h-4 flex-shrink-0" />
          <span>My Profile & Address</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* 👤 TAB 3: CUSTOMER PROFILE & PREFERENCES MANAGEMENT */}
      {/* =================================================================== */}
      {activeTab === 'PROFILE' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <User className="w-6 h-6 text-emerald-600" /> Customer Profile & Settings
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Update your contact details, dietary preferences, delivery address & profile photo.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200">
              Active Member
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6 text-xs sm:text-sm">
            {/* Profile Avatar Upload Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="relative">
                {profilePhotoPreview ? (
                  <img
                    src={profilePhotoPreview}
                    alt="Preview"
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl font-black border-4 border-white shadow-md">
                    {profileForm.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <label
                  htmlFor="profile-photo-input"
                  className="absolute -bottom-2 -right-2 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg cursor-pointer transition transform hover:scale-105"
                  title="Upload New Photo"
                >
                  <Camera className="w-4 h-4" />
                </label>
                <input
                  id="profile-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>

              <div className="space-y-1 text-center sm:text-left">
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">Profile Photo & Avatar</h4>
                <p className="text-xs text-slate-500">
                  Upload JPG, PNG or WebP image. Max size 10MB.
                </p>
                {profilePhotoFile && (
                  <p className="text-xs text-emerald-600 font-bold">
                    ✓ Selected: {profilePhotoFile.name} (Click "Save Changes" below to apply)
                  </p>
                )}
              </div>
            </div>

            {/* Input Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={profileForm.email}
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400">Email cannot be changed directly</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dietary Preference *</label>
                <select
                  value={profileForm.dietaryPreference}
                  onChange={(e) => setProfileForm({ ...profileForm, dietaryPreference: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
                >
                  <option value="PURE_VEG">🥗 Pure Veg (No Egg / Meat)</option>
                  <option value="JAIN">🕉️ Jain / Swaminarayan (No Onion / Garlic / Root Veg)</option>
                  <option value="EGGETARIAN">🍳 Eggetarian (Veg + Eggs)</option>
                  <option value="NON_VEG">🍗 Non-Vegetarian</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Default Delivery Address *</label>
                <textarea
                  rows="2"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="Flat No, Building, Street, Landmark..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">City / Town</label>
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  placeholder="e.g. Ahmedabad, Mumbai, Delhi"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={profileForm.pincode}
                  onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                  placeholder="e.g. 380015"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Special Delivery Instructions / Dietary Notes</label>
                <textarea
                  rows="2"
                  value={profileForm.specialNotes}
                  onChange={(e) => setProfileForm({ ...profileForm, specialNotes: e.target.value })}
                  placeholder="e.g. Ring doorbell twice, Leave at security gate, Low spicy food preferred..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-2 disabled:opacity-50"
              >
                {savingProfile ? (
                  <>Saving Profile...</>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Profile Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* 🍱 TAB 1: ACTIVE ORDERS & TODAY'S DELIVERY SECURITY OTP */}
      {/* =================================================================== */}
      {activeTab === 'ACTIVE' && (
        <div className="space-y-6">
          {/* Universal Supply & 3-Hour Cutoff Timing Guide Banner */}
          <div className="bg-amber-50/90 border border-amber-200 rounded-3xl p-4 sm:p-5 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-200/70 text-amber-800 rounded-2xl flex-shrink-0 mt-0.5">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="font-black text-xs sm:text-sm uppercase tracking-wide text-amber-900">
                  ⏰ Meal Delivery Schedule & 3-Hour Cancellation Rule
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-amber-900/90 font-medium pt-1">
                  <div>
                    ☀️ <strong>Day Lunch:</strong> 12:00 PM – 1:00 PM • <span className="text-rose-700 font-extrabold">Cut-off: 9:00 AM</span>
                  </div>
                  <div>
                    🌙 <strong>Night Dinner:</strong> 7:00 PM – 8:30 PM • <span className="text-rose-700 font-extrabold">Cut-off: 4:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between space-x-2">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Active Plans</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{activeOrdersList.length}</p>
                <p className="text-[10px] sm:text-[11px] text-emerald-600 font-bold">Live Tracking</p>
              </div>
              <div className="p-2.5 sm:p-3 bg-orange-100 text-orange-600 rounded-2xl">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between space-x-2">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Meals Delivered</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{totalMealsEaten}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">OTP Verified</p>
              </div>
              <div className="p-2.5 sm:p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                <ChefHat className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between space-x-2">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Spent</p>
                <p className="text-xl sm:text-2xl font-black text-purple-700 mt-1">₹{totalSpentAmount.toFixed(0)}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">GST Invoices</p>
              </div>
              <div className="p-2.5 sm:p-3 bg-purple-100 text-purple-700 rounded-2xl">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between space-x-2">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">15-Day Pending</p>
                <p className="text-xl sm:text-2xl font-black text-rose-600 mt-1">₹{total15DayPending.toFixed(0)}</p>
                <p className="text-[10px] sm:text-[11px] text-sky-600 font-bold">Paytm Gateway</p>
              </div>
              <div className="p-2.5 sm:p-3 bg-rose-100 text-rose-600 rounded-2xl">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>

          {/* Active Orders List */}
          {activeOrdersList.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 sm:p-14 border border-slate-100 shadow-sm text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black text-slate-900">No Active Tiffin Orders Right Now</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Explore top-rated verified home tiffin centers in your area with fresh cooked meals!
                </p>
              </div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-orange-500/20 transition"
              >
                <Utensils className="w-4 h-4" /> Find Tiffins Near Me
              </Link>
            </div>
          ) : (() => {
            const filteredActive = activeOrdersList.filter(o => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              return (
                o.orderNumber?.toLowerCase().includes(q) ||
                o.tiffinCenter?.centerName?.toLowerCase().includes(q) ||
                o.tiffinItem?.title?.toLowerCase().includes(q)
              );
            });

            const paginatedActive = filteredActive.slice(
              (activeCurrentPage - 1) * activePageSize,
              activeCurrentPage * activePageSize
            );

            return (
              <div className="space-y-5">
                {/* Search Bar for Customer Orders */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by Order #, Meal Package, or Kitchen Center..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setActiveCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {paginatedActive.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
                    No active orders match "{searchQuery}".
                  </div>
                ) : (
                  paginatedActive.map(order => {
                    const eligibility = checkOrderCancellationEligibility(order);
                    const isMonthlyOr15Day = order.planType === 'MONTHLY' || order.planType === '30_DAYS' || order.planType === '15_DAYS' || order.planType === '15DAYS';
                    const totalPlanDays = (order.planType === 'MONTHLY' || order.planType === '30_DAYS') ? 30 : (order.planType === '15_DAYS' || order.planType === '15DAYS') ? 15 : 1;
                    const progressPct = Math.min(100, Math.round(((order.deliveredDaysCount || 0) / totalPlanDays) * 100));

                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-md space-y-5 transition hover:border-orange-300"
                      >
                        {/* Header Strip */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => navigate(`/order/${order.id}`)}
                                className="font-mono font-black text-orange-600 hover:text-orange-700 hover:underline text-base sm:text-lg flex items-center gap-1"
                              >
                                #{order.orderNumber}
                                <ArrowRight className="w-4 h-4" />
                              </button>
                              <span className="px-2.5 py-0.5 bg-orange-100 text-orange-800 font-extrabold text-xs rounded-full">
                                {order.planType} Plan
                              </span>
                              {getStatusBadge(order.orderStatus)}
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                              Kitchen: <strong className="text-slate-800">{order.tiffinCenter?.centerName}</strong> • Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'Today'}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/order/${order.id}`)}
                              className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" /> Full Order Details
                            </button>
                            <button
                              onClick={() => setSelectedInvoiceOrder(order)}
                              className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition flex items-center gap-1"
                            >
                              <Printer className="w-3.5 h-3.5" /> Tax Invoice
                            </button>
                          </div>
                        </div>

                    {/* KEY FEATURE: DELIVERY STATUS-CONTROLLED OTP DISPLAY */}
                    {order.todayOtpVerified || order.orderStatus === 'DELIVERED' ? (
                      <div className="bg-emerald-50 rounded-2xl p-4 sm:p-5 border border-emerald-200 text-emerald-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="font-black text-xs sm:text-sm text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                              ✓ Today's Tiffin Meal Delivered & Verified
                            </span>
                            <p className="text-xs text-emerald-700">
                              OTP Handshake verified with vendor. Today's attendance successfully logged in ledger.
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-emerald-200 text-emerald-950 font-extrabold text-xs rounded-full self-start sm:self-auto flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-700" /> Attendance Logged
                        </span>
                      </div>
                    ) : ['DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERING'].includes(order.orderStatus) ? (
                      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg relative overflow-hidden">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Key className="w-5 h-5 text-amber-200 animate-bounce" />
                              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-100">
                                🛵 Out for Delivery: Handover OTP
                              </span>
                            </div>
                            <p className="text-xs text-orange-100 font-medium max-w-xl">
                              Your meal is on the way! <strong>Share this 4-digit OTP ONLY after physically receiving your tiffin box.</strong> The vendor verifies this to confirm delivery & attendance.
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-amber-300/40 shadow-inner">
                              {order.currentDeliveryOtp ? (
                                order.currentDeliveryOtp.split('').map((digit, idx) => (
                                  <span
                                    key={idx}
                                    className="w-8 h-10 sm:w-9 sm:h-11 bg-slate-900 border border-amber-400 text-amber-300 font-mono font-black text-xl sm:text-2xl flex items-center justify-center rounded-xl shadow-md"
                                  >
                                    {digit}
                                  </span>
                                ))
                              ) : (
                                <span className="font-mono font-black text-lg text-amber-300 px-3">----</span>
                              )}
                            </div>

                            <button
                              onClick={() => handleCopyOtp(order.id, order.currentDeliveryOtp)}
                              className="p-3 bg-white hover:bg-orange-50 text-orange-700 font-black text-xs rounded-2xl transition shadow-md flex items-center gap-1"
                              title="Copy OTP"
                            >
                              {copiedOtpId === order.id ? (
                                <>
                                  <CheckCheck className="w-4 h-4 text-emerald-600" /> Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 text-orange-600" /> Copy
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 text-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl flex-shrink-0 mt-0.5">
                            <ShieldCheck className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-xs sm:text-sm text-slate-900 uppercase">
                                🔒 Delivery Handover OTP Locked
                              </span>
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-md">
                                {order.orderStatus === 'PREPARING' ? '👨‍🍳 Kitchen Cooking' : 'Order Confirmed'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              Your 4-digit handover OTP unlocks automatically when the kitchen marks your order as <strong>"Out for Delivery"</strong>. Do not share OTP without receiving your meal.
                            </p>
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 font-bold bg-white px-3 py-2 rounded-xl border border-slate-200 self-start md:self-auto flex items-center gap-1.5 flex-shrink-0">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>Unlocks on Dispatch</span>
                        </div>
                      </div>
                    )}

                    {/* Meal Item & Delivery Address Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex items-center gap-2">
                          <ChefHat className="w-4 h-4 text-orange-600" />
                          <h4 className="font-black text-slate-900 text-sm">{order.tiffinItem?.title}</h4>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2">{order.tiffinItem?.dishes || order.tiffinItem?.description}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700 pt-1">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                            {order.tiffinItem?.category}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-md font-extrabold ${
                            order.tiffinItem?.mealType === 'LUNCH'
                              ? 'bg-amber-100 text-amber-800'
                              : order.tiffinItem?.mealType === 'DINNER'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {order.tiffinItem?.mealType === 'LUNCH'
                              ? '☀️ Lunch Delivery (12:00 PM - 1:30 PM)'
                              : order.tiffinItem?.mealType === 'DINNER'
                              ? '🌙 Dinner Delivery (7:00 PM - 8:30 PM)'
                              : '🍱 Full Day (Lunch + Dinner)'}
                          </span>
                          <span>Qty: {order.quantity}</span>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-rose-600" />
                          <h4 className="font-black text-slate-900 text-sm">Delivery Destination</h4>
                        </div>
                        <p className="text-xs text-slate-600">{order.deliveryAddress}</p>
                        <p className="text-xs text-slate-500 font-semibold">
                          {order.area}, {order.pincode}
                        </p>
                      </div>
                    </div>

                    {/* KEY FEATURE: FULL ATTENDANCE MATRIX & PROGRESS (FOR MULTI-DAY / MONTHLY) */}
                    {isMonthlyOr15Day && (
                      <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                              <CalendarDays className="w-4 h-4 text-emerald-600" />
                              Subscription Attendance Matrix ({totalPlanDays} Days Plan)
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Every delivered meal is recorded automatically upon OTP handshake verification.
                            </p>
                          </div>
                          <button
                            onClick={() => handleOpenAttendanceModal(order)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1 self-start sm:self-auto"
                          >
                            <Calendar className="w-3.5 h-3.5" /> Full Attendance Calendar & Skip
                          </button>
                        </div>

                        {/* Progress Bar & KPI Counts */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-700">Delivery Progress: {order.deliveredDaysCount || 0} of {totalPlanDays} Days</span>
                            <span className="text-emerald-600">{progressPct}% Completed</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-orange-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${progressPct}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
                          <div className="p-2 bg-white rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Plan Days</span>
                            <span className="font-black text-slate-800 text-sm">{totalPlanDays}</span>
                          </div>
                          <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                            <span className="text-[10px] text-emerald-700 font-bold block uppercase">Delivered</span>
                            <span className="font-black text-emerald-600 text-sm">{order.deliveredDaysCount || 0}</span>
                          </div>
                          <div className="p-2 bg-sky-50 rounded-xl border border-sky-200">
                            <span className="text-[10px] text-sky-700 font-bold block uppercase">Remaining</span>
                            <span className="font-black text-sky-600 text-sm">{Math.max(0, totalPlanDays - (order.deliveredDaysCount || 0) - (order.skippedDaysCount || 0))}</span>
                          </div>
                          <div className="p-2 bg-rose-50 rounded-xl border border-rose-200">
                            <span className="text-[10px] text-rose-700 font-bold block uppercase">Skipped</span>
                            <span className="font-black text-rose-600 text-sm">{order.skippedDaysCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Custom QR Payment Proof Status Banner */}
                    {order.paymentMode === 'CUSTOM_QR' && (
                      <div className={`rounded-2xl p-3.5 border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        order.paymentProofStatus === 'VERIFIED'
                          ? 'bg-emerald-50 border-emerald-200'
                          : order.paymentProofStatus === 'REJECTED'
                          ? 'bg-rose-50 border-rose-200'
                          : 'bg-amber-50 border-amber-200'
                      }`}>
                        <div className="flex items-start gap-2.5">
                          <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                            order.paymentProofStatus === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : order.paymentProofStatus === 'REJECTED'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            <QrCode className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-slate-900 uppercase text-[11px]">
                                UPI QR Payment Proof
                              </span>
                              <span className={`px-2 py-0.5 rounded-full font-black text-[9px] ${
                                order.paymentProofStatus === 'VERIFIED'
                                  ? 'bg-emerald-200 text-emerald-900'
                                  : order.paymentProofStatus === 'REJECTED'
                                  ? 'bg-rose-200 text-rose-900'
                                  : 'bg-amber-200 text-amber-900 animate-pulse'
                              }`}>
                                {order.paymentProofStatus === 'VERIFIED'
                                  ? '✓ APPROVED'
                                  : order.paymentProofStatus === 'REJECTED'
                                  ? '✕ REJECTED'
                                  : '⏳ UNDER REVIEW'}
                              </span>
                            </div>
                            <p className={`text-[11px] ${
                              order.paymentProofStatus === 'VERIFIED'
                                ? 'text-emerald-700'
                                : order.paymentProofStatus === 'REJECTED'
                                ? 'text-rose-700'
                                : 'text-amber-800'
                            }`}>
                              {order.paymentProofStatus === 'VERIFIED'
                                ? 'Your payment screenshot was verified by the kitchen. Order is fully confirmed!'
                                : order.paymentProofStatus === 'REJECTED'
                                ? 'Your proof was rejected. Please contact the kitchen or re-submit a clear screenshot.'
                                : 'Your payment screenshot is being reviewed by the kitchen owner. Usually takes 5-10 minutes.'}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(`/order/${order.id}`)}
                          className={`px-3 py-1.5 font-black text-xs rounded-xl transition whitespace-nowrap self-start sm:self-auto flex items-center gap-1 ${
                            order.paymentProofStatus === 'VERIFIED'
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : order.paymentProofStatus === 'REJECTED'
                              ? 'bg-rose-600 text-white hover:bg-rose-700'
                              : 'bg-amber-600 text-white hover:bg-amber-700'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </button>
                      </div>
                    )}

                    {/* Bottom Actions & Cancellation Guard */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">Total Bill: ₹{order.totalAmount?.toFixed(2)}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold text-[10px]">
                          {order.paymentMode} ({order.paymentStatus})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {eligibility.allowed ? (
                          <button
                            onClick={(e) => handleOpenCancelModal(order, e)}
                            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 transition flex items-center gap-1.5"
                          >
                            <X className="w-3.5 h-3.5" /> Cancel Order
                          </button>
                        ) : (
                          <span
                            className="px-3 py-1.5 bg-slate-100 text-slate-500 font-medium rounded-xl border border-slate-200 flex items-center gap-1 text-[11px]"
                            title={eligibility.message}
                          >
                            🔒 {eligibility.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }))}

              {/* Pagination for Active Orders */}
              {filteredActive.length > activePageSize && (
                <Pagination
                  currentPage={activeCurrentPage}
                  totalItems={filteredActive.length}
                  pageSize={activePageSize}
                  onPageChange={setActiveCurrentPage}
                  onPageSizeChange={(size) => {
                    setActivePageSize(size);
                    setActiveCurrentPage(1);
                  }}
                  pageSizeOptions={[5, 10, 20, 50]}
                />
              )}
            </div>
          );
        })()}
      </div>
    )}

      {/* =================================================================== */}
      {/* 📜 TAB 2: ORDER HISTORY & ARCHIVE */}
      {/* =================================================================== */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4">
          {historyOrdersList.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="font-black text-slate-900 text-base">No Past Order History</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Completed and delivered meal subscriptions will show up here along with invoices.</p>
            </div>
          ) : (() => {
            const filteredHistory = historyOrdersList.filter(o => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              return (
                o.orderNumber?.toLowerCase().includes(q) ||
                o.tiffinCenter?.centerName?.toLowerCase().includes(q) ||
                o.tiffinItem?.title?.toLowerCase().includes(q)
              );
            });

            const paginatedHistory = filteredHistory.slice(
              (historyCurrentPage - 1) * historyPageSize,
              historyCurrentPage * historyPageSize
            );

            return (
              <div className="space-y-4">
                {/* Search Bar for History Orders */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search past orders by Order #, Meal Package, or Kitchen Center..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setHistoryCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-4">Order #</th>
                          <th className="p-4">Package</th>
                          <th className="p-4">Center</th>
                          <th className="p-4">Dates</th>
                          <th className="p-4">Delivered Days</th>
                          <th className="p-4">Total Amount</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {paginatedHistory.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="p-8 text-center text-slate-400 font-semibold">
                              No history orders match "{searchQuery}".
                            </td>
                          </tr>
                        ) : (
                          paginatedHistory.map(order => (
                            <tr key={order.id} className="hover:bg-slate-50/80 transition">
                              <td className="p-4 font-mono font-bold text-slate-900">#{order.orderNumber}</td>
                              <td className="p-4 font-bold text-slate-900">{order.tiffinItem?.title}</td>
                              <td className="p-4">{order.tiffinCenter?.centerName}</td>
                              <td className="p-4 text-[11px] text-slate-500">
                                {order.startDate} → {order.endDate || order.startDate}
                              </td>
                              <td className="p-4 font-bold text-emerald-600">{order.deliveredDaysCount || 0} Meals</td>
                              <td className="p-4 font-bold text-slate-900">₹{order.totalAmount?.toFixed(2)}</td>
                              <td className="p-4">{getStatusBadge(order.orderStatus)}</td>
                              <td className="p-4 text-right space-x-1.5">
                                <button
                                  onClick={() => setSelectedInvoiceOrder(order)}
                                  className="px-2.5 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold rounded-lg border border-purple-200 transition"
                                >
                                  Invoice
                                </button>
                                <button
                                  onClick={() => setSelectedOrderDetail(order)}
                                  className="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-lg transition"
                                >
                                  Details
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination for History */}
                  {filteredHistory.length > historyPageSize && (
                    <div className="p-4 border-t border-slate-100">
                      <Pagination
                        currentPage={historyCurrentPage}
                        totalItems={filteredHistory.length}
                        pageSize={historyPageSize}
                        onPageChange={setHistoryCurrentPage}
                        onPageSizeChange={(size) => {
                          setHistoryPageSize(size);
                          setHistoryCurrentPage(1);
                        }}
                        pageSizeOptions={[5, 10, 25, 50]}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* =================================================================== */}
      {/* 🔍 MODAL 1: FULL ORDER TRACKER & INSPECTOR */}
      {/* =================================================================== */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6 my-6 text-slate-800">
            <button
              onClick={() => setSelectedOrderDetail(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b pb-4">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg sm:text-xl">
                  Order Details #{selectedOrderDetail.orderNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedOrderDetail.tiffinCenter?.centerName} • {selectedOrderDetail.planType} Plan
                </p>
              </div>
            </div>

            {/* OTP Display in Modal */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Active Delivery Security OTP</span>
                <span className="font-mono font-black text-2xl text-amber-900 tracking-wider">
                  {selectedOrderDetail.currentDeliveryOtp || '----'}
                </span>
              </div>
              <button
                onClick={() => handleCopyOtp(selectedOrderDetail.id, selectedOrderDetail.currentDeliveryOtp)}
                className="px-3 py-2 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Copy OTP
              </button>
            </div>

            {/* Pricing Breakdown */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({selectedOrderDetail.quantity} x {selectedOrderDetail.tiffinItem?.title})</span>
                <span>₹{selectedOrderDetail.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST Tax (5%)</span>
                <span>₹{selectedOrderDetail.taxAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-sm border-t pt-2">
                <span>Grand Total</span>
                <span>₹{selectedOrderDetail.totalAmount?.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedInvoiceOrder(selectedOrderDetail);
                  setSelectedOrderDetail(null);
                }}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> View Tax Invoice
              </button>
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ❌ MODAL 2: ORDER CANCELLATION WITH CUTOFF CHECK */}
      {/* =================================================================== */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative text-slate-800 space-y-4">
            <button
              onClick={() => setOrderToCancel(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b pb-3">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">Cancel Order #{orderToCancel.orderNumber}</h3>
                <p className="text-[11px] text-slate-500">Universal 3-hour cutoff policy verification</p>
              </div>
            </div>

            <form onSubmit={handleConfirmOrderCancellation} className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-[11px] space-y-1">
                <p className="font-extrabold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" /> 3-Hour Prior Cancellation Window:
                </p>
                <p className="text-[10px] text-amber-800">
                  Lunch cut-off is 9:00 AM. Dinner cut-off is 4:00 PM. Your order is eligible for cancellation right now.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] mb-2">
                  Select Cancellation Reason *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {cancellationReasonChips.map(chip => (
                    <button
                      key={chip.val}
                      type="button"
                      onClick={() => setCancelReasonChip(chip.val)}
                      className={`p-2.5 rounded-xl text-left font-bold transition text-[11px] border ${
                        cancelReasonChip === chip.val
                          ? 'bg-rose-50 border-rose-500 text-rose-700 ring-1 ring-rose-500 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Explain why you are cancelling..."
                  value={cancelCustomNotes}
                  onChange={(e) => setCancelCustomNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 font-medium text-xs"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOrderToCancel(null)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Keep Order
                </button>

                <button
                  type="submit"
                  disabled={submittingCancel}
                  className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-lg shadow-rose-500/20 transition disabled:opacity-50"
                >
                  {submittingCancel ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 📅 MODAL 3: INTERACTIVE DAILY ATTENDANCE & DATE LEDGER */}
      {/* =================================================================== */}
      {activeAttendanceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl border border-slate-100 space-y-5 relative my-8">
            <button
              onClick={() => setActiveAttendanceOrder(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base sm:text-lg">Subscription Attendance Chart</h3>
                <p className="text-xs text-slate-500">
                  Order: <strong className="text-slate-800">#{activeAttendanceOrder.orderNumber}</strong> • Package: <strong className="text-orange-600">{activeAttendanceOrder.tiffinItem?.title}</strong>
                </p>
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <p className="text-[10px] uppercase font-bold text-emerald-800">Delivered Meals</p>
                <p className="text-xl font-black text-emerald-600">{activeAttendanceOrder.deliveredDaysCount || 0}</p>
              </div>
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
                <p className="text-[10px] uppercase font-bold text-rose-800">Skipped Days</p>
                <p className="text-xl font-black text-rose-600">{activeAttendanceOrder.skippedDaysCount || 0}</p>
              </div>
              <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200">
                <p className="text-[10px] uppercase font-bold text-sky-800">15-Day Bill Due</p>
                <p className="text-xl font-black text-sky-600">₹{activeAttendanceOrder.dueAmount15Day?.toFixed(2) || '0.00'}</p>
              </div>
            </div>

            {/* Calendar Days Matrix */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">All Plan Dates & Real-Time Status</h4>
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {generateDatesList(activeAttendanceOrder).map(item => {
                  const log = attendanceLogs.find(l => l.attendanceDate === item.dateStr);
                  const isDelivered = log?.status === 'DELIVERED';
                  const isSkipped = log?.status === 'SKIPPED';
                  const today = new Date().toISOString().split('T')[0];
                  const isPast = item.dateStr < today;
                  const isToday = item.dateStr === today;
                  const cutoffStatus = checkOrderCancellationEligibility(activeAttendanceOrder);

                  return (
                    <div
                      key={item.dateStr}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition ${
                        isDelivered
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                          : isSkipped
                          ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900">Day {item.dayNumber}: {item.formatted}</span>
                          {isToday && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 font-extrabold text-[9px] rounded-full">
                              TODAY
                            </span>
                          )}
                        </div>

                        {isDelivered && (
                          <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> OTP Verified • Delivered ({log?.notes || 'Delivered on time'})
                          </p>
                        )}
                        {isSkipped && (
                          <p className="text-[11px] text-rose-700 font-bold flex items-center gap-1">
                            <X className="w-3.5 h-3.5" /> Skipped • Reason: <span className="font-normal italic">"{log?.notes}"</span>
                          </p>
                        )}
                        {!log && (
                          <p className="text-[11px] text-slate-500 font-medium">
                            {isPast ? 'Past Date' : (isToday ? 'Scheduled for today • Handshake OTP active' : 'Upcoming Day')}
                          </p>
                        )}
                      </div>

                      <div>
                        {isDelivered ? (
                          <span className="px-2.5 py-1 bg-emerald-600 text-white font-extrabold text-[10px] rounded-xl shadow-sm">
                            Delivered 🟢
                          </span>
                        ) : isSkipped ? (
                          <span className="px-2.5 py-1 bg-rose-600 text-white font-extrabold text-[10px] rounded-xl shadow-sm">
                            Skipped 🔴
                          </span>
                        ) : (!isPast && (!isToday || cutoffStatus.allowed)) ? (
                          <button
                            onClick={() => handleOpenSkipModal(item.dateStr)}
                            className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 font-bold text-[11px] rounded-xl transition shadow-sm"
                          >
                            Skip Tiffin
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-200 text-slate-500 font-bold text-[10px] rounded-xl cursor-not-allowed">
                            🔒 Locked
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skip Tiffin Reason Modal */}
      {skipTargetDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative text-slate-800 space-y-4">
            <button
              onClick={() => setSkipTargetDate(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b pb-3">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Skip Tiffin on {skipTargetDate}</h3>
                <p className="text-[11px] text-slate-500">Reason is saved in attendance ledger.</p>
              </div>
            </div>

            <form onSubmit={handleSubmitSkipTiffin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] mb-2">
                  Select Reason *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {skipReasonChips.map(chip => (
                    <button
                      key={chip.val}
                      type="button"
                      onClick={() => setSkipReasonChip(chip.val)}
                      className={`p-2 rounded-xl text-left font-bold transition text-[11px] border ${
                        skipReasonChip === chip.val
                          ? 'bg-rose-50 border-rose-500 text-rose-700 ring-1 ring-rose-500 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Fasting today for Vrat..."
                  value={skipCustomNotes}
                  onChange={(e) => setSkipCustomNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSkipTargetDate(null)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSkip}
                  className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-lg shadow-rose-500/20 transition disabled:opacity-50"
                >
                  {submittingSkip ? 'Submitting...' : 'Confirm Skip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 15-Day Paytm Settlement Gateway Modal */}
      {showPaytm15DayModal && payingOrder15Day && (
        <PaytmGatewayModal
          isOpen={true}
          onClose={() => {
            setShowPaytm15DayModal(false);
            setPayingOrder15Day(null);
          }}
          totalAmount={payingOrder15Day.dueAmount15Day > 0 ? payingOrder15Day.dueAmount15Day : ((payingOrder15Day.deliveredDaysCount || 0) * (payingOrder15Day.pricePerDayRate || 100))}
          onPaymentSuccess={(txnId) => handlePay15DayBillSuccess(txnId)}
        />
      )}

      {/* Tax Invoice Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          isOpen={true}
          onClose={() => setSelectedInvoiceOrder(null)}
          order={selectedInvoiceOrder}
        />
      )}
    </div>
  );
}
