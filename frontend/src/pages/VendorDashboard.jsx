import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Store,
  Plus,
  Utensils,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Trash2,
  ShoppingBag,
  Image,
  Tag,
  Loader2,
  Calendar,
  MapPin,
  Check,
  X,
  Phone,
  AlertTriangle,
  Eye,
  TrendingUp,
  BellRing,
  Layers,
  ChevronRight,
  UserCheck,
  CreditCard,
  FileText,
  Archive,
  AlertOctagon,
  ChefHat,
  Truck,
  RotateCcw,
  Key,
  Camera,
  Save,
  CheckCheck,
  ShieldCheck,
  Sparkles,
  CalendarDays,
  Leaf,
  Search,
  CheckSquare,
  Square,
  Printer,
  Zap,
  ArrowRight,
  Send,
  Filter,
  XCircle,
  Ban,
  MessageCircle,
  QrCode,
  UploadCloud,
  ExternalLink,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import notify from '../utils/notify';
import Pagination from '../components/Pagination';
import InvoiceModal from '../components/InvoiceModal';

export default function VendorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tiffinCenterId, setTiffinCenterId] = useState(user?.tiffinCenterId || null);
  const [centerStatus, setCenterStatus] = useState(user?.tiffinCenterStatus || 'PENDING');
  const [centerData, setCenterData] = useState(null);
  const [tiffins, setTiffins] = useState([]);
  const [orders, setOrders] = useState([]);
  const [alerts15Day, setAlerts15Day] = useState([]);
  const [loading, setLoading] = useState(true);

  // Main Dashboard View Tabs
  const [activeTab, setActiveTab] = useState('DELIVERIES'); // 'DELIVERIES', 'ORDERS', 'CANCELLED', 'TIFFINS', 'PROFILE'
  const [orderQueueFilter, setOrderQueueFilter] = useState('ACTIVE'); // 'ACTIVE', 'ALL', 'DELIVERED', 'CANCELLED', 'ARCHIVE'
  const [deliverySlotFilter, setDeliverySlotFilter] = useState('ALL'); // 'ALL', 'LUNCH', 'DINNER', 'FULL_DAY'

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveryCurrentPage, setDeliveryCurrentPage] = useState(1);
  const [deliveryPageSize, setDeliveryPageSize] = useState(10);
  const [ordersCurrentPage, setOrdersCurrentPage] = useState(1);
  const [ordersPageSize, setOrdersPageSize] = useState(10);
  const [cancelledCurrentPage, setCancelledCurrentPage] = useState(1);
  const [cancelledPageSize, setCancelledPageSize] = useState(10);
  const [cancelledReasonFilter, setCancelledReasonFilter] = useState('ALL');

  // Invoice Modal State
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  // High-Volume Surge Bulk Actions State
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [showMasterKOTModal, setShowMasterKOTModal] = useState(false);

  // Detailed Order Inspection Modal
  const [selectedDetailOrder, setSelectedDetailOrder] = useState(null);
  const [orderAttendanceLogs, setOrderAttendanceLogs] = useState([]);

  // OTP Delivery Verification Modal State
  const [verifyingOtpOrder, setVerifyingOtpOrder] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Real-Time New Order Popup Alert State
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const previousOrderCount = useRef(0);

  // License Renewal Modal state
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewMonths, setRenewMonths] = useState(1);
  const [renewing, setRenewing] = useState(false);

  // Add Tiffin Modal / Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category: 'VEG',
    mealType: 'FULL_DAY',
    pricePerDay: '',
    pricePerMonth: '',
    dishes: '',
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Kitchen Profile & Branding & Payment Settings State
  const [profileSubTab, setProfileSubTab] = useState('PROFILE'); // 'PROFILE', 'BRANDING', 'PAYMENTS'
  const [profileForm, setProfileForm] = useState({
    centerName: '',
    ownerName: '',
    phone: '',
    altPhone: '',
    address: '',
    area: '',
    city: '',
    pincode: '',
    description: '',
    cuisines: 'North Indian, Gujarati, Homestyle',
    deliveryTimings: 'Lunch: 12:00 PM - 2:00 PM | Dinner: 7:00 PM - 9:30 PM',
    pureVeg: true,
    logoUrl: '',
    bannerUrl: '',
    // Payment Settings
    customQrEnabled: true,
    customQrCodeUrl: '',
    customUpiId: '',
    customUpiName: '',
    customQrInstructions: 'Scan Owner UPI QR code, complete payment on GPay/PhonePe/Paytm, and upload payment screenshot proof.',
    paytmGatewayEnabled: true,
    paytmMerchantId: '',
    paytmMerchantKey: '',
    paytmMerchantVpa: '',
    paytmEnvironment: 'SANDBOX',
    codEnabled: true
  });
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [customQrFile, setCustomQrFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [customQrPreview, setCustomQrPreview] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showMerchantKey, setShowMerchantKey] = useState(false);

  // Payment Proof Screenshot Inspection & Verification Modal State
  const [selectedPaymentProofOrder, setSelectedPaymentProofOrder] = useState(null);
  const [verifyingPaymentProof, setVerifyingPaymentProof] = useState(false);
  const [showRejectProofModal, setShowRejectProofModal] = useState(false);
  const [paymentRejectReason, setPaymentRejectReason] = useState('Payment screenshot not clear or amount mismatch');

  useEffect(() => {
    if (user?.id) {
      fetchCenterDetails();
    }
  }, [user?.id]);

  // Real-Time Polling every 6 seconds for live orders & OTP status
  useEffect(() => {
    if (!tiffinCenterId) return;
    const interval = setInterval(() => {
      fetchTiffinsAndOrders(tiffinCenterId, true);
    }, 6000);
    return () => clearInterval(interval);
  }, [tiffinCenterId]);

  const fetchCenterDetails = async () => {
    setLoading(true);
    try {
      if (user?.role === 'VENDOR' && user?.id) {
        const res = await axios.get('/api/admin/centers');
        const myCenter = res.data.find(c => c.user?.id === user.id);
        if (myCenter) {
          setTiffinCenterId(myCenter.id);
          setCenterStatus(myCenter.status);
          setCenterData(myCenter);
          populateProfileData(myCenter);
          await fetchTiffinsAndOrders(myCenter.id, false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const populateProfileData = (center) => {
    setProfileForm({
      centerName: center.centerName || '',
      ownerName: center.ownerName || '',
      phone: center.phone || '',
      altPhone: center.altPhone || '',
      address: center.address || '',
      area: center.area || '',
      city: center.city || '',
      pincode: center.pincode || '',
      description: center.description || '',
      cuisines: center.cuisines || 'North Indian, Gujarati, Homestyle',
      deliveryTimings: center.deliveryTimings || 'Lunch: 12:00 PM - 2:00 PM | Dinner: 7:00 PM - 9:30 PM',
      pureVeg: center.pureVeg !== undefined ? center.pureVeg : true,
      logoUrl: center.logoUrl || '',
      bannerUrl: center.bannerUrl || '',
      customQrEnabled: center.customQrEnabled !== undefined ? center.customQrEnabled : true,
      customQrCodeUrl: center.customQrCodeUrl || '',
      customUpiId: center.customUpiId || '',
      customUpiName: center.customUpiName || '',
      customQrInstructions: center.customQrInstructions || 'Scan Owner UPI QR code, complete payment on GPay/PhonePe/Paytm, and upload payment screenshot proof.',
      paytmGatewayEnabled: center.paytmGatewayEnabled !== undefined ? center.paytmGatewayEnabled : true,
      paytmMerchantId: center.paytmMerchantId || '',
      paytmMerchantKey: center.paytmMerchantKey || '',
      paytmMerchantVpa: center.paytmMerchantVpa || '',
      paytmEnvironment: center.paytmEnvironment || 'SANDBOX',
      codEnabled: center.codEnabled !== undefined ? center.codEnabled : true
    });
    if (center.logoUrl) setLogoPreview(center.logoUrl);
    if (center.bannerUrl) setBannerPreview(center.bannerUrl);
    if (center.customQrCodeUrl) setCustomQrPreview(center.customQrCodeUrl);
  };

  const fetchTiffinsAndOrders = async (centerId, silent = false) => {
    try {
      const [tiffinRes, orderRes, alertRes] = await Promise.all([
        axios.get(`/api/vendor/centers/${centerId}/tiffins`),
        axios.get(`/api/vendor/centers/${centerId}/orders`),
        axios.get(`/api/vendor/centers/${centerId}/alerts-15day`)
      ]);
      setTiffins(tiffinRes.data || []);
      setAlerts15Day(alertRes.data || []);

      const fetchedOrders = orderRes.data || [];

      // Detect New Real-Time Order
      if (previousOrderCount.current > 0 && fetchedOrders.length > previousOrderCount.current) {
        const latestOrder = fetchedOrders[0];
        setNewOrderAlert(latestOrder);
        playNewOrderAudioNotification();
        notify.orderAlert(latestOrder);
      }

      previousOrderCount.current = fetchedOrders.length;
      setOrders(fetchedOrders);

      if (selectedDetailOrder) {
        const fresh = fetchedOrders.find(o => o.id === selectedDetailOrder.id);
        if (fresh) setSelectedDetailOrder(fresh);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const playNewOrderAudioNotification = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio chime auto-play handled');
    }
  };

  const handleOpenDetailModal = async (order) => {
    setSelectedDetailOrder(order);
    try {
      const res = await axios.get(`/api/vendor/orders/${order.id}/attendance`);
      setOrderAttendanceLogs(res.data || []);
    } catch (e) {
      console.error('Failed to load order attendance:', e);
    }
  };

  const handleOpenOtpModal = (order) => {
    setVerifyingOtpOrder(order);
    setEnteredOtp('');
    setDeliveryNote('');
  };

  const handleSubmitVerifyOtp = async (e) => {
    e.preventDefault();
    if (!verifyingOtpOrder || !enteredOtp.trim()) {
      notify.warning('Please enter the 4-digit Delivery OTP provided by the customer.', 'OTP Required');
      return;
    }

    setVerifyingOtp(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await axios.post(`/api/vendor/orders/${verifyingOtpOrder.id}/verify-delivery-otp`, {
        otp: enteredOtp.trim(),
        notes: deliveryNote.trim() || 'Meal delivered on time via OTP handshake',
        date: today
      });

      notify.success(`✅ OTP Verified! Today's meal marked as DELIVERED for Order #${verifyingOtpOrder.orderNumber}`, 'Delivery Completed');
      playNewOrderAudioNotification();
      setVerifyingOtpOrder(null);
      setEnteredOtp('');
      setDeliveryNote('');

      await fetchTiffinsAndOrders(tiffinCenterId, false);

      if (selectedDetailOrder && selectedDetailOrder.id === verifyingOtpOrder.id) {
        setSelectedDetailOrder(res.data.order || { ...selectedDetailOrder, orderStatus: 'DELIVERED' });
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid Delivery OTP. Please ask customer to check their dashboard.';
      notify.error(msg, 'Verification Failed');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSaveKitchenProfile = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!tiffinCenterId) return;

    setSavingProfile(true);
    try {
      // 1. Update text fields and payment configurations
      const res = await axios.put(`/api/vendor/centers/${tiffinCenterId}/profile`, profileForm);
      let updatedCenter = res.data.center || res.data;

      // 2. Upload media if selected
      if (logoFile || bannerFile) {
        const formData = new FormData();
        if (logoFile) formData.append('logo', logoFile);
        if (bannerFile) formData.append('banner', bannerFile);

        const mediaRes = await axios.post(`/api/vendor/centers/${tiffinCenterId}/media`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (mediaRes.data.center) {
          updatedCenter = mediaRes.data.center;
        }
      }

      // 3. Upload Custom QR Image if selected
      if (customQrFile) {
        const qrFormData = new FormData();
        qrFormData.append('qrImage', customQrFile);
        const qrRes = await axios.post(`/api/vendor/centers/${tiffinCenterId}/qr-image`, qrFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (qrRes.data.center) {
          updatedCenter = qrRes.data.center;
        }
      }

      setCenterData(updatedCenter);
      populateProfileData(updatedCenter);
      notify.success('Kitchen profile, branding & payment gateway configuration saved successfully! 🚀', 'Settings Saved');
      setLogoFile(null);
      setBannerFile(null);
      setCustomQrFile(null);
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to update kitchen settings.', 'Error Saving');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleVerifyPaymentProof = async (orderId, status, notes) => {
    setVerifyingPaymentProof(true);
    try {
      const res = await axios.put(`/api/vendor/orders/${orderId}/verify-payment-proof`, {
        status: status || 'VERIFIED',
        notes: notes || 'Payment screenshot verified by kitchen owner'
      });
      notify.success(
        status === 'VERIFIED'
          ? `✅ Payment Approved & Order #${res.data.order?.orderNumber} Confirmed!`
          : `❌ Payment Proof Rejected for Order #${res.data.order?.orderNumber}`,
        status === 'VERIFIED' ? 'Payment Verified' : 'Payment Rejected'
      );
      setSelectedPaymentProofOrder(null);
      setShowRejectProofModal(false);
      fetchTiffinsAndOrders(tiffinCenterId, false);
      if (selectedDetailOrder && selectedDetailOrder.id === orderId) {
        setSelectedDetailOrder(res.data.order);
      }
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to update payment proof verification status.', 'Error');
    } finally {
      setVerifyingPaymentProof(false);
    }
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      const res = await axios.put(`/api/vendor/orders/${orderId}/confirm`);
      notify.success(`✅ Order #${orderId} accepted and confirmed!`, 'Order Confirmed');
      fetchTiffinsAndOrders(tiffinCenterId, false);
      if (selectedDetailOrder && selectedDetailOrder.id === orderId) {
        setSelectedDetailOrder(res.data.order || { ...selectedDetailOrder, orderStatus: 'CONFIRMED' });
      }
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to confirm order.', 'Confirmation Error');
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      const res = await axios.put(`/api/vendor/orders/${orderId}/status`, { status });
      notify.success(`Order #${orderId} status updated to: ${status}`, 'Order Updated');
      fetchTiffinsAndOrders(tiffinCenterId, false);
      if (selectedDetailOrder && selectedDetailOrder.id === orderId) {
        setSelectedDetailOrder(res.data.order || { ...selectedDetailOrder, orderStatus: status });
      }
    } catch (err) {
      notify.error('Failed to update order status.', 'Update Error');
    }
  };

  const handleToggleSelectOrder = (orderId) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleToggleSelectAll = (orderList) => {
    const listIds = orderList.map(o => o.id);
    const allSelected = listIds.every(id => selectedOrderIds.includes(id));
    if (allSelected) {
      setSelectedOrderIds(prev => prev.filter(id => !listIds.includes(id)));
    } else {
      setSelectedOrderIds(prev => Array.from(new Set([...prev, ...listIds])));
    }
  };

  const handleBulkAction = async (status) => {
    if (selectedOrderIds.length === 0) {
      notify.warning('Please select at least one order to perform batch action.', 'No Orders Selected');
      return;
    }

    setBulkUpdating(true);
    try {
      const res = await axios.post('/api/vendor/orders/bulk-status', {
        orderIds: selectedOrderIds,
        status: status
      });
      notify.success(res.data.message || `Batch updated ${selectedOrderIds.length} orders to ${status}!`, 'Batch Success');
      setSelectedOrderIds([]);
      await fetchTiffinsAndOrders(tiffinCenterId, false);
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to execute batch update.', 'Batch Failed');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleToggleAvailability = async (itemId) => {
    try {
      await axios.put(`/api/vendor/tiffins/${itemId}/toggle`);
      notify.success('Item availability status updated.', 'Status Updated');
      fetchTiffinsAndOrders(tiffinCenterId, false);
    } catch (err) {
      notify.error('Failed to toggle availability.', 'Error');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Delete this tiffin package from menu?')) {
      try {
        await axios.delete(`/api/vendor/tiffins/${itemId}`);
        notify.success('Tiffin package removed from menu.', 'Item Deleted');
        fetchTiffinsAndOrders(tiffinCenterId, false);
      } catch (err) {
        notify.error('Failed to delete item.', 'Error');
      }
    }
  };

  const handleAddTiffin = async (e) => {
    e.preventDefault();
    if (!tiffinCenterId) return;

    setSubmitting(true);
    try {
      const data = new FormData();
      const dto = {
        ...newItem,
        tiffinCenterId,
        pricePerDay: parseFloat(newItem.pricePerDay),
        pricePerMonth: parseFloat(newItem.pricePerMonth)
      };
      data.append('item', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
      if (imageFile) {
        data.append('image', imageFile);
      }

      await axios.post('/api/vendor/tiffins', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      notify.success(`Tiffin package "${newItem.title}" added to active menu!`, 'Package Added');
      setShowAddModal(false);
      setNewItem({
        title: '',
        description: '',
        category: 'VEG',
        mealType: 'FULL_DAY',
        pricePerDay: '',
        pricePerMonth: '',
        dishes: '',
        imageUrl: ''
      });
      setImageFile(null);
      fetchTiffinsAndOrders(tiffinCenterId, false);
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to add tiffin item.', 'Error Adding Item');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter Lists & Advanced Search
  const activeOrdersList = orders.filter(o => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED');
  const deliveredOrdersList = orders.filter(o => o.orderStatus === 'DELIVERED');
  const cancelledOrdersList = orders.filter(o => o.orderStatus === 'CANCELLED');
  const archivedOrdersList = orders.filter(o => o.orderStatus === 'DELIVERED' || o.orderStatus === 'CANCELLED');
  const todayPendingDeliveries = activeOrdersList.filter(o => !o.todayOtpVerified);

  // Search Filter for Deliveries Queue
  const filteredDeliveries = activeOrdersList.filter(o => {
    // 1. Slot Filter
    if (deliverySlotFilter !== 'ALL' && o.tiffinItem?.mealType !== deliverySlotFilter) {
      return false;
    }
    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = o.orderNumber?.toLowerCase().includes(q);
      const matchName = o.user?.name?.toLowerCase().includes(q);
      const matchPhone = o.user?.phone?.toLowerCase().includes(q);
      const matchItem = o.tiffinItem?.title?.toLowerCase().includes(q);
      const matchArea = (o.area || o.deliveryAddress)?.toLowerCase().includes(q);
      return matchNumber || matchName || matchPhone || matchItem || matchArea;
    }
    return true;
  });

  // Paginated Deliveries Queue
  const totalDeliveryPages = Math.ceil(filteredDeliveries.length / deliveryPageSize) || 1;
  const paginatedDeliveries = filteredDeliveries.slice(
    (deliveryCurrentPage - 1) * deliveryPageSize,
    deliveryCurrentPage * deliveryPageSize
  );

  // Chef's Live Prep Sheet Aggregate Totals
  const totalLunchMeals = activeOrdersList
    .filter(o => o.tiffinItem?.mealType === 'LUNCH' || o.tiffinItem?.mealType === 'FULL_DAY')
    .reduce((sum, o) => sum + (o.quantity || 1), 0);
  const totalDinnerMeals = activeOrdersList
    .filter(o => o.tiffinItem?.mealType === 'DINNER' || o.tiffinItem?.mealType === 'FULL_DAY')
    .reduce((sum, o) => sum + (o.quantity || 1), 0);
  const totalActiveMeals = activeOrdersList.reduce((sum, o) => sum + (o.quantity || 1), 0);
  const estimatedPhulkes = totalActiveMeals * 4;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
        <p className="font-bold text-slate-600 text-sm">Loading Vendor Kitchen Portal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-8">
      {/* Top Kitchen Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white p-4 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 sm:gap-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 z-10 min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo"
                className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-white/80 shadow-md bg-white"
              />
            ) : (
              <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-2xl sm:text-3xl font-black border-2 border-white/40 shadow-md">
                <Store className="w-7 h-7 sm:w-9 sm:h-9" />
              </div>
            )}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider">
                🏪 Kitchen Partner Portal
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500 text-white font-black text-[10px] rounded-full">
                {centerStatus}
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight break-words leading-tight">
              {centerData?.centerName || 'My Tiffin Center'}
            </h1>
            <p className="text-xs text-amber-100 font-medium break-words">
              Owner: {centerData?.ownerName || user?.name} • {centerData?.area || 'Area'}, {centerData?.city || 'City'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 z-10 w-full md:w-auto flex-shrink-0">
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`px-3.5 py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
              activeTab === 'PROFILE'
                ? 'bg-white text-amber-700 shadow-md'
                : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md'
            }`}
          >
            <Camera className="w-4 h-4" /> Kitchen Profile & Settings
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2.5 bg-white hover:bg-amber-50 text-amber-700 font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl transition shadow-md flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-amber-600" /> Add Tiffin Package
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-black overflow-x-auto no-scrollbar scroll-smooth">
        <button
          onClick={() => {
            setActiveTab('DELIVERIES');
            setDeliveryCurrentPage(1);
          }}
          className={`flex-shrink-0 sm:flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${
            activeTab === 'DELIVERIES'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 hover:text-amber-600'
          }`}
        >
          <Truck className="w-4 h-4 flex-shrink-0" />
          <span>Live Deliveries & OTP ({todayPendingDeliveries.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('ORDERS');
            setOrdersCurrentPage(1);
          }}
          className={`flex-shrink-0 sm:flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${
            activeTab === 'ORDERS'
              ? 'bg-orange-600 text-white shadow-md'
              : 'text-slate-600 hover:text-orange-600'
          }`}
        >
          <ShoppingBag className="w-4 h-4 flex-shrink-0" />
          <span>All Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('CANCELLED');
            setCancelledCurrentPage(1);
          }}
          className={`flex-shrink-0 sm:flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${
            activeTab === 'CANCELLED'
              ? 'bg-rose-600 text-white shadow-md'
              : cancelledOrdersList.length > 0
              ? 'text-rose-600 hover:bg-rose-50'
              : 'text-slate-600 hover:text-rose-600'
          }`}
        >
          <XCircle className="w-4 h-4 flex-shrink-0" />
          <span>Cancelled Orders ({cancelledOrdersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('TIFFINS')}
          className={`flex-shrink-0 sm:flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${
            activeTab === 'TIFFINS'
              ? 'bg-purple-700 text-white shadow-md'
              : 'text-slate-600 hover:text-purple-700'
          }`}
        >
          <Utensils className="w-4 h-4 flex-shrink-0" />
          <span>Menu Packages ({tiffins.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`flex-shrink-0 sm:flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${
            activeTab === 'PROFILE'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'text-slate-600 hover:text-emerald-700'
          }`}
        >
          <Store className="w-4 h-4 flex-shrink-0" />
          <span>Kitchen Profile & 💳 Gateways</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* 🚀 TAB 1: LIVE DELIVERIES & OTP HANDSHAKE VERIFICATION */}
      {/* =================================================================== */}
      {activeTab === 'DELIVERIES' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
            {/* Box 1: Awaiting OTP */}
            <div
              onClick={() => {
                setActiveTab('DELIVERIES');
                setDeliverySlotFilter('ALL');
                setSearchQuery('');
                setDeliveryCurrentPage(1);
              }}
              className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between gap-1.5 sm:gap-2 min-w-0 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-amber-300 active:scale-95 group"
            >
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate group-hover:text-amber-600 transition">Awaiting OTP</p>
                <p className="text-lg sm:text-2xl font-black text-amber-600 mt-0.5 sm:mt-1 truncate">{todayPendingDeliveries.length}</p>
                <p className="text-[9px] sm:text-[11px] text-slate-500 font-medium truncate">Pending Handshake →</p>
              </div>
              <div className="p-2 sm:p-3 bg-amber-100 text-amber-600 rounded-xl sm:rounded-2xl flex-shrink-0 group-hover:scale-110 transition">
                <Key className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </div>
            </div>

            {/* Box 2: Active Subs */}
            <div
              onClick={() => {
                setActiveTab('ORDERS');
                setOrderQueueFilter('ACTIVE');
                setSearchQuery('');
                setOrdersCurrentPage(1);
              }}
              className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between gap-1.5 sm:gap-2 min-w-0 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-orange-300 active:scale-95 group"
            >
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate group-hover:text-orange-600 transition">Active Subs</p>
                <p className="text-lg sm:text-2xl font-black text-orange-600 mt-0.5 sm:mt-1 truncate">{activeOrdersList.length}</p>
                <p className="text-[9px] sm:text-[11px] text-slate-500 font-medium truncate">Total Active →</p>
              </div>
              <div className="p-2 sm:p-3 bg-orange-100 text-orange-600 rounded-xl sm:rounded-2xl flex-shrink-0 group-hover:scale-110 transition">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </div>
            </div>

            {/* Box 3: Chef's Prep Sheet */}
            <div
              onClick={() => setShowMasterKOTModal(true)}
              className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm flex items-center justify-between gap-1.5 sm:gap-2 min-w-0 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 group"
            >
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-black text-amber-100 uppercase tracking-wider truncate">KOT Sheet</p>
                <p className="text-lg sm:text-2xl font-black text-white mt-0.5 sm:mt-1 truncate">{totalActiveMeals} Thalis</p>
                <p className="text-[9px] sm:text-[11px] text-amber-100 font-medium truncate">~{estimatedPhulkes} Rotis</p>
              </div>
              <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl flex-shrink-0 group-hover:scale-110 transition">
                <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
            </div>

            {/* Box 4: Total Orders */}
            <div
              onClick={() => {
                setActiveTab('ORDERS');
                setOrderQueueFilter('ALL');
                setOrdersCurrentPage(1);
              }}
              className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between gap-1.5 sm:gap-2 min-w-0 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-purple-300 active:scale-95 group"
            >
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate group-hover:text-purple-600 transition">All Orders</p>
                <p className="text-lg sm:text-2xl font-black text-purple-700 mt-0.5 sm:mt-1 truncate">{orders.length}</p>
                <p className="text-[9px] sm:text-[11px] text-slate-500 font-medium truncate">Lifetime Tally →</p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-100 text-purple-700 rounded-xl sm:rounded-2xl flex-shrink-0 group-hover:scale-110 transition">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </div>
            </div>

            {/* Box 5: Cancelled Orders */}
            <div
              onClick={() => {
                setActiveTab('CANCELLED');
                setCancelledCurrentPage(1);
              }}
              className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between gap-1.5 sm:gap-2 min-w-0 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-rose-300 active:scale-95 group col-span-2 sm:col-span-1"
            >
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate group-hover:text-rose-600 transition">Cancelled</p>
                <p className="text-lg sm:text-2xl font-black text-rose-600 mt-0.5 sm:mt-1 truncate">{cancelledOrdersList.length}</p>
                <p className="text-[9px] sm:text-[11px] text-slate-500 font-medium truncate">Audit Archive →</p>
              </div>
              <div className="p-2 sm:p-3 bg-rose-100 text-rose-600 rounded-xl sm:rounded-2xl flex-shrink-0 group-hover:scale-110 transition">
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </div>
            </div>
          </div>

          {/* Deliveries Queue Header Toolbar */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-600" />
                  <span>Live Deliveries & OTP Handshake Queue ({filteredDeliveries.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Search active customer subscriptions, meal slots, and enter customer delivery OTPs upon handover.
                </p>
              </div>

              {/* Slot Filter Chips */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
                {['ALL', 'LUNCH', 'DINNER', 'FULL_DAY'].map(slot => (
                  <button
                    key={slot}
                    onClick={() => {
                      setDeliverySlotFilter(slot);
                      setDeliveryCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      deliverySlotFilter === slot
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {slot === 'ALL' ? 'All Slots' : slot === 'LUNCH' ? '☀️ Lunch' : slot === 'DINNER' ? '🌙 Dinner' : '🍱 Full Day'}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar & Multi-Select Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Order #, Customer, Phone, or Locality..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setDeliveryCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Bulk Batch Actions */}
              {selectedOrderIds.length > 0 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs">
                  <span className="font-bold text-amber-900">{selectedOrderIds.length} Selected:</span>
                  <button
                    onClick={() => handleBulkAction('PREPARING')}
                    disabled={bulkUpdating}
                    className="px-2.5 py-1 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700"
                  >
                    Mark Cooking
                  </button>
                  <button
                    onClick={() => handleBulkAction('DISPATCHED')}
                    disabled={bulkUpdating}
                    className="px-2.5 py-1 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700"
                  >
                    Mark Out For Delivery
                  </button>
                </div>
              )}
            </div>

            {/* Deliveries Cards Grid */}
            {paginatedDeliveries.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active deliveries match your filter or search query.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedDeliveries.map(order => {
                  const isDeliveredToday = order.todayOtpVerified;
                  const mealSlot = order.tiffinItem?.mealType || 'FULL_DAY';
                  const isSelected = selectedOrderIds.includes(order.id);

                  return (
                    <div
                      key={order.id}
                      className={`bg-white rounded-3xl p-5 border shadow-sm space-y-4 transition relative ${
                        isSelected ? 'ring-2 ring-orange-500 border-orange-300' : isDeliveredToday ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-start gap-2.5">
                          {/* Multi-Select Checkbox */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSelectOrder(order.id);
                            }}
                            className="mt-0.5 p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-orange-600 transition"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-orange-600" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>

                          <div className="space-y-0.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* Clickable Order Number */}
                              <button
                                onClick={() => handleOpenDetailModal(order)}
                                className="font-mono font-black text-orange-600 hover:text-orange-700 hover:underline text-sm flex items-center gap-1"
                              >
                                #{order.orderNumber}
                                <ArrowRight className="w-3 h-3" />
                              </button>
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-800 font-extrabold text-[10px] rounded-full">
                                {order.planType}
                              </span>
                              {/* Meal Timing Slot Badge */}
                              <span className={`px-2 py-0.5 font-extrabold text-[10px] rounded-full ${
                                mealSlot === 'LUNCH'
                                  ? 'bg-amber-100 text-amber-800'
                                  : mealSlot === 'DINNER'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {mealSlot === 'LUNCH'
                                  ? '☀️ Lunch (12:00 - 1:30 PM)'
                                  : mealSlot === 'DINNER'
                                  ? '🌙 Dinner (7:00 - 8:30 PM)'
                                  : '🍱 Full Day'}
                              </span>
                            </div>
                            <h4 className="font-black text-slate-900 text-sm truncate">{order.user?.name}</h4>
                            <p className="text-xs text-slate-600 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" /> {order.user?.phone}
                            </p>
                          </div>
                        </div>

                        <div>
                          {isDeliveredToday ? (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-full border border-emerald-300 flex items-center gap-1">
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> Delivered Today
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-amber-100 text-amber-800 font-extrabold text-xs rounded-full border border-amber-300 flex items-center gap-1 animate-pulse">
                              <Clock className="w-3.5 h-3.5 text-amber-600" /> Ready to Deliver
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Package & Address */}
                      <div 
                        onClick={() => handleOpenDetailModal(order)}
                        className="text-xs space-y-1.5 text-slate-700 cursor-pointer group/desc"
                      >
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-900 group-hover/desc:text-orange-600 transition">
                            {order.tiffinItem?.title} (Qty: {order.quantity})
                          </span>
                          <span className="font-bold text-emerald-600">Day {order.deliveredDaysCount || 0} Done</span>
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                          <span className="truncate">{order.deliveryAddress}, {order.area}</span>
                        </p>
                      </div>

                      {/* Payment Proof Badge if Custom QR */}
                      {order.paymentMode === 'CUSTOM_QR' && (
                        <div className="p-2.5 bg-amber-50/80 rounded-2xl border border-amber-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-amber-950">QR Proof:</span>
                            {order.paymentProofStatus === 'VERIFIED' ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-black text-[10px] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                              </span>
                            ) : order.paymentProofStatus === 'REJECTED' ? (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-black text-[10px] flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-rose-600" /> Rejected
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full font-black text-[10px] flex items-center gap-1 animate-pulse">
                                <Clock className="w-3 h-3 text-amber-700" /> Awaiting Review
                              </span>
                            )}
                          </div>
                          {order.paymentScreenshotUrl && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPaymentProofOrder(order);
                              }}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black shadow-xs flex items-center gap-1 transition"
                            >
                              <Camera className="w-3 h-3" /> View Proof 📸
                            </button>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleOpenDetailModal(order)}
                          className="px-3 py-2 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>

                        {isDeliveredToday ? (
                          <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                            <Check className="w-4 h-4" /> Attendance Verified
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenOtpModal(order)}
                            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                          >
                            <Key className="w-4 h-4 text-amber-200" /> Deliver & Enter OTP
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination for Deliveries */}
            {filteredDeliveries.length > deliveryPageSize && (
              <Pagination
                currentPage={deliveryCurrentPage}
                totalItems={filteredDeliveries.length}
                pageSize={deliveryPageSize}
                onPageChange={setDeliveryCurrentPage}
                onPageSizeChange={(size) => {
                  setDeliveryPageSize(size);
                  setDeliveryCurrentPage(1);
                }}
                pageSizeOptions={[6, 10, 20, 50]}
              />
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 📋 TAB 2: ALL ORDERS QUEUE */}
      {/* =================================================================== */}
      {activeTab === 'ORDERS' && (() => {
        const baseOrders = orderQueueFilter === 'ACTIVE'
          ? activeOrdersList
          : orderQueueFilter === 'ALL'
          ? orders
          : orderQueueFilter === 'DELIVERED'
          ? deliveredOrdersList
          : orderQueueFilter === 'CANCELLED'
          ? cancelledOrdersList
          : archivedOrdersList;

        const searchFiltered = baseOrders.filter(o => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          return (
            o.orderNumber?.toLowerCase().includes(q) ||
            o.user?.name?.toLowerCase().includes(q) ||
            o.user?.phone?.toLowerCase().includes(q) ||
            o.tiffinItem?.title?.toLowerCase().includes(q) ||
            (o.area || o.deliveryAddress)?.toLowerCase().includes(q)
          );
        });

        const paginated = searchFiltered.slice(
          (ordersCurrentPage - 1) * ordersPageSize,
          ordersCurrentPage * ordersPageSize
        );

        return (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                <button
                  onClick={() => {
                    setOrderQueueFilter('ALL');
                    setOrdersCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    orderQueueFilter === 'ALL' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All ({orders.length})
                </button>
                <button
                  onClick={() => {
                    setOrderQueueFilter('ACTIVE');
                    setOrdersCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    orderQueueFilter === 'ACTIVE' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Active ({activeOrdersList.length})
                </button>
                <button
                  onClick={() => {
                    setOrderQueueFilter('DELIVERED');
                    setOrdersCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    orderQueueFilter === 'DELIVERED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Delivered ({deliveredOrdersList.length})
                </button>
                <button
                  onClick={() => {
                    setOrderQueueFilter('CANCELLED');
                    setOrdersCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    orderQueueFilter === 'CANCELLED' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Cancelled ({cancelledOrdersList.length})
                </button>
              </div>

              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search orders, customers, phone..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setOrdersCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="p-4">Order #</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Package</th>
                      <th className="p-4">Meal Timing</th>
                      <th className="p-4">Plan</th>
                      <th className="p-4">Delivered</th>
                      <th className="p-4">Total</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400">
                          No orders found matching your filter / search keyword.
                        </td>
                      </tr>
                    ) : (
                      paginated.map(order => {
                        const mealSlot = order.tiffinItem?.mealType || 'FULL_DAY';
                        return (
                          <tr key={order.id} className="hover:bg-orange-50/40 transition">
                            <td className="p-4 font-mono font-black">
                              <button
                                onClick={() => handleOpenDetailModal(order)}
                                className="text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1"
                              >
                                #{order.orderNumber}
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-slate-900">{order.user?.name}</div>
                              <div className="text-[10px] text-slate-500">{order.user?.phone}</div>
                            </td>
                            <td className="p-4 font-bold text-slate-900">{order.tiffinItem?.title}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] whitespace-nowrap ${
                                mealSlot === 'LUNCH'
                                  ? 'bg-amber-100 text-amber-800'
                                  : mealSlot === 'DINNER'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {mealSlot === 'LUNCH'
                                  ? '☀️ Lunch (12-1:30 PM)'
                                  : mealSlot === 'DINNER'
                                  ? '🌙 Dinner (7-8:30 PM)'
                                  : '🍱 Full Day'}
                              </span>
                            </td>
                            <td className="p-4">{order.planType}</td>
                            <td className="p-4 font-bold text-emerald-600">{order.deliveredDaysCount || 0} Meals</td>
                            <td className="p-4 font-bold text-slate-900">₹{order.totalAmount?.toFixed(2)}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                order.orderStatus === 'DELIVERED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : order.orderStatus === 'CANCELLED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {order.orderStatus.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                              {order.paymentMode === 'CUSTOM_QR' && order.paymentScreenshotUrl && (
                                <button
                                  onClick={() => setSelectedPaymentProofOrder(order)}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[10px] shadow-xs inline-flex items-center gap-1 transition"
                                  title="View & Verify Payment Proof"
                                >
                                  <Camera className="w-3 h-3" /> Proof 📸
                                </button>
                              )}
                              {order.orderStatus === 'PENDING_CONFIRMATION' && (
                                <button
                                  onClick={() => handleConfirmOrder(order.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] shadow-xs"
                                >
                                  Accept
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedInvoiceOrder(order)}
                                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg text-[10px] border border-purple-200 transition"
                              >
                                Invoice
                              </button>
                              <button
                                onClick={() => handleOpenDetailModal(order)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-700 font-bold rounded-lg text-[10px] transition"
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination for Orders */}
              {searchFiltered.length > ordersPageSize && (
                <div className="p-4 border-t border-slate-100">
                  <Pagination
                    currentPage={ordersCurrentPage}
                    totalItems={searchFiltered.length}
                    pageSize={ordersPageSize}
                    onPageChange={setOrdersCurrentPage}
                    onPageSizeChange={(size) => {
                      setOrdersPageSize(size);
                      setOrdersCurrentPage(1);
                    }}
                    pageSizeOptions={[10, 25, 50, 100]}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* =================================================================== */}
      {/* 🛑 TAB: CANCELLED ORDERS & REFUNDS ARCHIVE */}
      {/* =================================================================== */}
      {activeTab === 'CANCELLED' && (() => {
        const searchFiltered = cancelledOrdersList.filter(o => {
          // Reason filter
          if (cancelledReasonFilter !== 'ALL' && !o.cancellationReason?.toLowerCase().includes(cancelledReasonFilter.toLowerCase())) {
            return false;
          }
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          return (
            o.orderNumber?.toLowerCase().includes(q) ||
            o.user?.name?.toLowerCase().includes(q) ||
            o.user?.phone?.toLowerCase().includes(q) ||
            o.tiffinItem?.title?.toLowerCase().includes(q) ||
            o.cancellationReason?.toLowerCase().includes(q) ||
            o.cancelledBy?.toLowerCase().includes(q) ||
            (o.area || o.deliveryAddress)?.toLowerCase().includes(q)
          );
        });

        const paginated = searchFiltered.slice(
          (cancelledCurrentPage - 1) * cancelledPageSize,
          cancelledCurrentPage * cancelledPageSize
        );

        const totalCancelledValue = cancelledOrdersList.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const totalDeliveredBeforeCancel = cancelledOrdersList.reduce((sum, o) => sum + (o.deliveredDaysCount || 0), 0);

        return (
          <div className="space-y-5">
            {/* Cancelled Orders Top Summary Banner */}
            <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 text-white p-5 sm:p-6 rounded-3xl shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-400/40 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                    <XCircle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black">Cancelled Subscriptions & Orders Archive</h3>
                    <p className="text-xs text-rose-100">
                      Audit all cancelled orders, customer reasons, delivered meals tally, and financial adjustments.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black self-start sm:self-auto">
                  {cancelledOrdersList.length} Total Cancelled
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
                  <span className="text-[10px] font-bold text-rose-200 uppercase block">Cancelled Orders</span>
                  <span className="text-xl sm:text-2xl font-black text-white">{cancelledOrdersList.length}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
                  <span className="text-[10px] font-bold text-rose-200 uppercase block">Meals Served Prior</span>
                  <span className="text-xl sm:text-2xl font-black text-white">{totalDeliveredBeforeCancel} Meals</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-rose-200 uppercase block">Total Plan Value</span>
                  <span className="text-xl sm:text-2xl font-black text-white">₹{totalCancelledValue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                <span className="text-slate-400 mr-1 text-[11px]">Reason:</span>
                {[
                  { label: 'All Reasons', val: 'ALL' },
                  { label: 'Schedule Changed', val: 'Schedule' },
                  { label: 'Traveling', val: 'Traveling' },
                  { label: 'Mistake', val: 'Mistake' },
                  { label: 'Diet', val: 'Diet' }
                ].map(r => (
                  <button
                    key={r.val}
                    onClick={() => {
                      setCancelledReasonFilter(r.val);
                      setCancelledCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl transition ${
                      cancelledReasonFilter === r.val
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search cancelled by order #, customer, reason, phone..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCancelledCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Cancelled Orders List */}
            {cancelledOrdersList.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3 shadow-sm">
                <div className="w-16 h-16 mx-auto bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h4 className="font-black text-slate-900 text-lg">No Cancelled Orders!</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Excellent performance! All of your customer tiffin orders are actively progressing or fulfilled without cancellations.
                </p>
              </div>
            ) : paginated.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-2 text-slate-500 text-xs">
                No cancelled orders match your search keyword "{searchQuery}".
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-4">Order #</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Package</th>
                        <th className="p-4">Plan & Dates</th>
                        <th className="p-4">Cancellation Reason</th>
                        <th className="p-4">Delivered</th>
                        <th className="p-4">Total Bill</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {paginated.map(order => {
                        const mealSlot = order.tiffinItem?.mealType || 'FULL_DAY';
                        return (
                          <tr key={order.id} className="hover:bg-rose-50/40 transition">
                            <td className="p-4 font-mono font-black">
                              <button
                                onClick={() => handleOpenDetailModal(order)}
                                className="text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
                              >
                                #{order.orderNumber}
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-slate-900">{order.user?.name || 'Customer'}</div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <span>{order.user?.phone}</span>
                                {order.user?.phone && (
                                  <a
                                    href={`tel:${order.user.phone}`}
                                    className="p-1 text-slate-400 hover:text-emerald-600 rounded transition"
                                    title="Call Customer"
                                  >
                                    <Phone className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-slate-900">{order.tiffinItem?.title}</div>
                              <span className={`inline-block mt-0.5 px-2 py-0.2 rounded font-bold text-[9px] ${
                                mealSlot === 'LUNCH'
                                  ? 'bg-amber-100 text-amber-800'
                                  : mealSlot === 'DINNER'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {mealSlot === 'LUNCH' ? '☀️ Lunch' : mealSlot === 'DINNER' ? '🌙 Dinner' : '🍱 Full Day'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-slate-800">{order.planType} Plan</div>
                              <div className="text-[10px] text-slate-400">
                                {order.startDate} → {order.endDate || order.startDate}
                              </div>
                            </td>
                            <td className="p-4 max-w-xs">
                              <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                                <div className="flex items-center gap-1 text-rose-700 font-bold text-[11px]">
                                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>{order.cancellationReason || 'Cancelled by Customer'}</span>
                                </div>
                                <div className="text-[9px] text-rose-500 font-semibold">
                                  By: {order.cancelledBy || 'CUSTOMER'} • {order.cancelledAt ? new Date(order.cancelledAt).toLocaleDateString('en-IN') : 'Recent'}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="font-extrabold text-slate-800">{order.deliveredDaysCount || 0}</span>
                              <span className="text-slate-400 text-[10px]"> Days Served</span>
                            </td>
                            <td className="p-4">
                              <div className="font-black text-slate-900">₹{order.totalAmount?.toFixed(2)}</div>
                              <div className="text-[10px] text-slate-500">{order.paymentMode} ({order.paymentStatus})</div>
                            </td>
                            <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => setSelectedInvoiceOrder(order)}
                                className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg text-[11px] border border-purple-200 transition inline-flex items-center gap-1"
                              >
                                <Printer className="w-3 h-3" /> Invoice
                              </button>
                              <button
                                onClick={() => handleOpenDetailModal(order)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition inline-flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" /> Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination for Cancelled Orders */}
                {searchFiltered.length > cancelledPageSize && (
                  <div className="p-4 border-t border-slate-100">
                    <Pagination
                      currentPage={cancelledCurrentPage}
                      totalItems={searchFiltered.length}
                      pageSize={cancelledPageSize}
                      onPageChange={setCancelledCurrentPage}
                      onPageSizeChange={(size) => {
                        setCancelledPageSize(size);
                        setCancelledCurrentPage(1);
                      }}
                      pageSizeOptions={[5, 10, 25, 50]}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* =================================================================== */}
      {/* 🍱 TAB 3: MENU PACKAGES */}
      {/* =================================================================== */}
      {activeTab === 'TIFFINS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-slate-900 text-base sm:text-lg">Active Tiffin Packages ({tiffins.length})</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Package
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tiffins.map(item => (
              <div key={item.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="relative h-40 rounded-2xl overflow-hidden bg-slate-100">
                  <img
                    src={item.imageUrl || '/uploads/default-tiffin.jpg'}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 right-2 px-2.5 py-1 bg-slate-900/80 text-white backdrop-blur-md rounded-full font-bold text-[10px]">
                    {item.category}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 text-base">{item.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{item.dishes || item.description}</p>
                </div>

                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-900 text-sm">₹{item.pricePerDay}</span>
                    <span className="text-slate-400 text-[10px]"> /day</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 text-sm">₹{item.pricePerMonth}</span>
                    <span className="text-slate-400 text-[10px]"> /mo</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleToggleAvailability(item.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                      item.available
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {item.available ? 'Available' : 'Unavailable'}
                  </button>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 🏪 TAB 5: KITCHEN PROFILE & PAYMENT GATEWAY CONFIGURATION */}
      {/* =================================================================== */}
      {activeTab === 'PROFILE' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Header Card */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-black uppercase tracking-wider">
                  ⚙️ Settings & Configuration
                </span>
                <span className="px-2.5 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-full">
                  {centerStatus}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black mt-2">Kitchen Profile & Payment Gateways</h2>
              <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-xl">
                Configure your tiffin center profile, brand imagery, direct UPI QR code, and real-time Paytm payment gateway credentials.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveKitchenProfile}
              disabled={savingProfile}
              className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-500/30 transition flex items-center gap-2 self-start md:self-auto disabled:opacity-50"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save All Settings
                </>
              )}
            </button>
          </div>

          {/* Sub-Tabs Navigation */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-black overflow-x-auto">
            <button
              type="button"
              onClick={() => setProfileSubTab('PROFILE')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                profileSubTab === 'PROFILE'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-4 h-4 text-emerald-600" />
              <span>1. Kitchen & Location Info</span>
            </button>

            <button
              type="button"
              onClick={() => setProfileSubTab('BRANDING')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                profileSubTab === 'BRANDING'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4 text-amber-600" />
              <span>2. Logo & Media Branding</span>
            </button>

            <button
              type="button"
              onClick={() => setProfileSubTab('PAYMENTS')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                profileSubTab === 'PAYMENTS'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>3. 💳 Payment Gateways & Custom QR</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>
          </div>

          <form onSubmit={handleSaveKitchenProfile} className="space-y-6">
            {/* SUB-TAB 1: KITCHEN PROFILE & CONTACT DETAILS */}
            {profileSubTab === 'PROFILE' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b pb-4">
                  <h3 className="font-black text-slate-900 text-lg sm:text-xl">Basic Kitchen & Business Details</h3>
                  <p className="text-xs text-slate-500">Manage public details displayed to customers on your store page</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                  <div>
                    <label className="block text-slate-800 mb-1.5 uppercase tracking-wider">Tiffin Center / Kitchen Name *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.centerName}
                      onChange={(e) => setProfileForm({ ...profileForm, centerName: e.target.value })}
                      placeholder="e.g. Maa Ki Rasoi Tiffin Center"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-800 mb-1.5 uppercase tracking-wider">Kitchen Owner Name *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.ownerName}
                      onChange={(e) => setProfileForm({ ...profileForm, ownerName: e.target.value })}
                      placeholder="e.g. Sunita Sharma"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-800 mb-1.5 uppercase tracking-wider">Primary Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="e.g. 9811223344"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-800 mb-1.5 uppercase tracking-wider">Alternative / WhatsApp Phone</label>
                    <input
                      type="text"
                      value={profileForm.altPhone}
                      onChange={(e) => setProfileForm({ ...profileForm, altPhone: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-800 mb-1.5 uppercase tracking-wider">Full Kitchen / Physical Preparation Address *</label>
                    <textarea
                      rows="2"
                      required
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      placeholder="House No, Floor, Building Name, Street & Landmark"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-slate-800 mb-1.5 uppercase tracking-wider">Locality / Area Name *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.area}
                      onChange={(e) => setProfileForm({ ...profileForm, area: e.target.value })}
                      placeholder="e.g. Laxmi Nagar, Kothrud"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-800 mb-1.5 uppercase tracking-wider">City *</label>
                      <input
                        type="text"
                        required
                        value={profileForm.city}
                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                        placeholder="e.g. Delhi, Pune"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-800 mb-1.5 uppercase tracking-wider">Pincode *</label>
                      <input
                        type="text"
                        required
                        value={profileForm.pincode}
                        onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                        placeholder="110092"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-800 mb-1.5 uppercase tracking-wider">Cuisines / Food Specialities</label>
                    <input
                      type="text"
                      value={profileForm.cuisines}
                      onChange={(e) => setProfileForm({ ...profileForm, cuisines: e.target.value })}
                      placeholder="e.g. North Indian, Gujarati, Homestyle"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-800 mb-1.5 uppercase tracking-wider">Daily Delivery Timings</label>
                    <input
                      type="text"
                      value={profileForm.deliveryTimings}
                      onChange={(e) => setProfileForm({ ...profileForm, deliveryTimings: e.target.value })}
                      placeholder="Lunch: 12:00 PM - 2:00 PM | Dinner: 7:00 PM - 9:30 PM"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-800 mb-1.5 uppercase tracking-wider">About Kitchen / Description</label>
                    <textarea
                      rows="3"
                      value={profileForm.description}
                      onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                      placeholder="Describe the hygiene practices, freshness of ingredients, and homestyle cooking..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    ></textarea>
                  </div>

                  <div className="sm:col-span-2 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:bg-slate-100 transition">
                      <input
                        type="checkbox"
                        checked={profileForm.pureVeg}
                        onChange={(e) => setProfileForm({ ...profileForm, pureVeg: e.target.checked })}
                        className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <div>
                        <span className="font-black text-slate-900 text-sm block">100% Pure Vegetarian Kitchen (Strict Veg/Jain)</span>
                        <span className="text-[11px] text-slate-500">Show pure-veg green certified seal on search results and dish cards.</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: BRANDING & MEDIA */}
            {profileSubTab === 'BRANDING' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b pb-4">
                  <h3 className="font-black text-slate-900 text-lg sm:text-xl">Kitchen Branding & Cover Media</h3>
                  <p className="text-xs text-slate-500">Upload your storefront logo and high-resolution kitchen banner</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Logo Upload Box */}
                  <div className="space-y-3">
                    <label className="block font-black text-slate-800 text-xs uppercase tracking-wider">
                      Storefront Logo / Kitchen Avatar
                    </label>
                    <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
                      {logoPreview ? (
                        <div className="relative group">
                          <img
                            src={logoPreview}
                            alt="Kitchen Logo Preview"
                            className="w-28 h-28 object-cover rounded-2xl shadow-md border-2 border-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setLogoPreview(null);
                              setLogoFile(null);
                            }}
                            className="absolute -top-2 -right-2 bg-rose-600 text-white p-1 rounded-full shadow-md hover:bg-rose-700"
                            title="Remove Logo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-28 h-28 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center">
                          <Store className="w-12 h-12" />
                        </div>
                      )}

                      <label className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 shadow-xs cursor-pointer transition">
                        Select Logo File
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setLogoFile(f);
                              setLogoPreview(URL.createObjectURL(f));
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-400">PNG or JPG, Recommended 400x400 px</p>
                    </div>
                  </div>

                  {/* Banner Upload Box */}
                  <div className="space-y-3">
                    <label className="block font-black text-slate-800 text-xs uppercase tracking-wider">
                      Kitchen Cover / Banner Image
                    </label>
                    <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
                      {bannerPreview ? (
                        <div className="relative group w-full">
                          <img
                            src={bannerPreview}
                            alt="Banner Preview"
                            className="w-full h-28 object-cover rounded-2xl shadow-md border-2 border-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setBannerPreview(null);
                              setBannerFile(null);
                            }}
                            className="absolute -top-2 -right-2 bg-rose-600 text-white p-1 rounded-full shadow-md hover:bg-rose-700"
                            title="Remove Banner"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-28 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
                          <Image className="w-10 h-10" />
                        </div>
                      )}

                      <label className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 shadow-xs cursor-pointer transition">
                        Select Banner Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setBannerFile(f);
                              setBannerPreview(URL.createObjectURL(f));
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-400">Wide JPG / PNG (1200x400 px recommended)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: 💳 PAYMENT GATEWAY & CUSTOM QR CODE SETTINGS */}
            {profileSubTab === 'PAYMENTS' && (
              <div className="space-y-6">
                {/* Section Overview Card */}
                <div className="bg-gradient-to-r from-sky-900 via-blue-900 to-indigo-900 text-white p-6 sm:p-7 rounded-3xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner">
                      <CreditCard className="w-7 h-7 text-sky-200" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg sm:text-xl">Payment Gateway & Direct Bank QR Setup</h3>
                      <p className="text-xs text-sky-200/90">
                        Give customers freedom to pay directly via your Custom UPI QR or automated Paytm Payment Gateway.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 1. CUSTOM UPI QR CODE CONFIGURATION (OWNER'S DIRECT ACCOUNT) */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-orange-100 text-orange-700 rounded-2xl">
                        <QrCode className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-base sm:text-lg">
                          Option 1: Custom UPI QR Code (Direct Bank Account)
                        </h4>
                        <p className="text-xs text-slate-500">
                          Money deposits directly into your bank / UPI account without gateway deductions.
                        </p>
                      </div>
                    </div>

                    {/* Enable Toggle Switch */}
                    <label className="flex items-center gap-2.5 cursor-pointer self-start sm:self-auto bg-orange-50 px-3.5 py-1.5 rounded-xl border border-orange-200">
                      <input
                        type="checkbox"
                        checked={profileForm.customQrEnabled}
                        onChange={(e) => setProfileForm({ ...profileForm, customQrEnabled: e.target.checked })}
                        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                      />
                      <span className="font-black text-xs text-orange-950">
                        {profileForm.customQrEnabled ? '✓ Enabled on Checkout' : 'Disabled'}
                      </span>
                    </label>
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Form Inputs */}
                    <div className="lg:col-span-7 space-y-4 text-xs font-bold text-slate-700">
                      <div>
                        <label className="block text-slate-800 mb-1.5 uppercase tracking-wider">
                          Owner UPI ID (VPA) *
                        </label>
                        <input
                          type="text"
                          required={profileForm.customQrEnabled}
                          value={profileForm.customUpiId}
                          onChange={(e) => setProfileForm({ ...profileForm, customUpiId: e.target.value })}
                          placeholder="e.g. 9811223344@paytm, sharma@okhdfcbank, maarasoi@upi"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-mono font-semibold"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Customers will send UPI payments to this Virtual Payment Address.
                        </p>
                      </div>

                      <div>
                        <label className="block text-slate-800 mb-1.5 uppercase tracking-wider">
                          UPI Payee / Account Holder Name *
                        </label>
                        <input
                          type="text"
                          required={profileForm.customQrEnabled}
                          value={profileForm.customUpiName}
                          onChange={(e) => setProfileForm({ ...profileForm, customUpiName: e.target.value })}
                          placeholder="e.g. Maa Ki Rasoi Tiffin Services / Sunita Sharma"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-800 mb-1.5 uppercase tracking-wider">
                          Custom Instructions for Customers
                        </label>
                        <textarea
                          rows="2"
                          value={profileForm.customQrInstructions}
                          onChange={(e) => setProfileForm({ ...profileForm, customQrInstructions: e.target.value })}
                          placeholder="Instructions shown to customer when scanning your QR..."
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                        ></textarea>
                      </div>

                      {/* QR Image File Upload */}
                      <div>
                        <label className="block text-slate-800 mb-1.5 uppercase tracking-wider">
                          Upload Your Official Bank / PhonePe / Paytm Standee QR Image
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="px-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-800 font-black text-xs rounded-xl border border-orange-200 cursor-pointer transition shadow-xs flex items-center gap-1.5">
                            <UploadCloud className="w-4 h-4 text-orange-600" />
                            <span>Select QR Image File</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) {
                                  setCustomQrFile(f);
                                  setCustomQrPreview(URL.createObjectURL(f));
                                }
                              }}
                              className="hidden"
                            />
                          </label>

                          {customQrPreview && (
                            <button
                              type="button"
                              onClick={() => {
                                setCustomQrPreview(null);
                                setCustomQrFile(null);
                                setProfileForm({ ...profileForm, customQrCodeUrl: '' });
                              }}
                              className="text-xs text-rose-600 font-bold hover:underline"
                            >
                              Reset to Auto QR
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Upload your shop's official printed QR sticker photo, or leave empty to auto-generate from UPI ID!
                        </p>
                      </div>
                    </div>

                    {/* Live Customer Preview Box */}
                    <div className="lg:col-span-5 bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border-2 border-orange-300 shadow-sm text-center space-y-3">
                      <span className="text-[10px] font-black text-orange-800 uppercase tracking-wider bg-orange-100 px-2.5 py-0.5 rounded-full border border-orange-300">
                        📱 Live Customer Scanner Mockup
                      </span>

                      <div className="w-40 h-40 bg-white p-2.5 rounded-2xl mx-auto border-2 border-orange-400 shadow-md flex items-center justify-center">
                        <img
                          src={
                            customQrPreview ||
                            `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                              `upi://pay?pa=${profileForm.customUpiId || 'sunita.sharma@paytm'}&pn=${encodeURIComponent(
                                profileForm.customUpiName || profileForm.centerName || 'APKA Tiffine'
                              )}&cu=INR`
                            )}`
                          }
                          alt="Live Preview QR"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>

                      <div className="space-y-0.5 text-xs">
                        <p className="font-black text-slate-900">{profileForm.customUpiName || 'Kitchen Name'}</p>
                        <p className="font-mono text-[11px] text-slate-600 font-bold">{profileForm.customUpiId || 'yourname@paytm'}</p>
                      </div>

                      <div className="p-2.5 bg-white/90 rounded-xl border border-orange-200 text-[10px] text-slate-600 text-left font-medium">
                        ✓ <strong>Mandatory Screenshot Rule:</strong> Customers are required by system to upload proof before order is submitted.
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. REAL-TIME PAYTM PAYMENT GATEWAY CONFIGURATION */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-sky-100 text-[#00baf2] rounded-2xl">
                        <CreditCard className="w-6 h-6 text-[#002e6e]" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-base sm:text-lg">
                          Option 2: Paytm Payment Gateway (Automated PG)
                        </h4>
                        <p className="text-xs text-slate-500">
                          Automated 1-click real-time reconciliation with Paytm UPI, Net Banking, and Cards.
                        </p>
                      </div>
                    </div>

                    {/* Enable Toggle Switch */}
                    <label className="flex items-center gap-2.5 cursor-pointer self-start sm:self-auto bg-sky-50 px-3.5 py-1.5 rounded-xl border border-sky-200">
                      <input
                        type="checkbox"
                        checked={profileForm.paytmGatewayEnabled}
                        onChange={(e) => setProfileForm({ ...profileForm, paytmGatewayEnabled: e.target.checked })}
                        className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                      />
                      <span className="font-black text-xs text-sky-950">
                        {profileForm.paytmGatewayEnabled ? '✓ Enabled on Checkout' : 'Disabled'}
                      </span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                    <div>
                      <label className="block text-slate-800 mb-1.5 uppercase tracking-wider">
                        Paytm Merchant ID (MID)
                      </label>
                      <input
                        type="text"
                        value={profileForm.paytmMerchantId}
                        onChange={(e) => setProfileForm({ ...profileForm, paytmMerchantId: e.target.value })}
                        placeholder="e.g. YOUR_PAYTM_MID_HERE or Leave blank for system sandbox"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00baf2] font-mono font-semibold"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Found in your Paytm Business Dashboard Profile</p>
                    </div>

                    <div>
                      <label className="block text-slate-800 mb-1.5 uppercase tracking-wider">
                        Paytm Merchant Secret Key
                      </label>
                      <div className="relative">
                        <input
                          type={showMerchantKey ? 'text' : 'password'}
                          value={profileForm.paytmMerchantKey}
                          onChange={(e) => setProfileForm({ ...profileForm, paytmMerchantKey: e.target.value })}
                          placeholder="e.g. YOUR_MERCHANT_SECRET_KEY"
                          className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00baf2] font-mono font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowMerchantKey(!showMerchantKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">256-bit SHA secret key for authentic HMAC verification</p>
                    </div>

                    <div>
                      <label className="block text-slate-800 mb-1.5 uppercase tracking-wider">
                        Paytm Merchant VPA / UPI Handle
                      </label>
                      <input
                        type="text"
                        value={profileForm.paytmMerchantVpa}
                        onChange={(e) => setProfileForm({ ...profileForm, paytmMerchantVpa: e.target.value })}
                        placeholder="e.g. paytm-yourcenter@paytm"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00baf2] font-mono font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-800 mb-1.5 uppercase tracking-wider">
                        Environment / Mode
                      </label>
                      <select
                        value={profileForm.paytmEnvironment}
                        onChange={(e) => setProfileForm({ ...profileForm, paytmEnvironment: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00baf2] font-bold"
                      >
                        <option value="SANDBOX">Sandbox / Staging (Testing Mode) 🧪</option>
                        <option value="PRODUCTION">Production / Live (Real Money) 💰</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3.5 bg-sky-50 rounded-2xl border border-sky-100 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-sky-900">
                      <ShieldCheck className="w-5 h-5 text-[#00baf2] flex-shrink-0" />
                      <span className="font-bold">Paytm Bank Real-Time Webhook Callback Active:</span>
                      <code className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-sky-200">
                        /api/payment/paytm/callback
                      </code>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-black rounded-full text-[10px]">
                      {profileForm.paytmEnvironment === 'PRODUCTION' ? 'LIVE' : 'TEST MODE'}
                    </span>
                  </div>
                </div>

                {/* 3. CASH ON DELIVERY (COD) */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-base">Option 3: Cash on Delivery (COD)</h4>
                      <p className="text-xs text-slate-500">Allow customers to pay cash when meal is delivered at their door.</p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={profileForm.codEnabled}
                      onChange={(e) => setProfileForm({ ...profileForm, codEnabled: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="font-black text-xs text-slate-800">
                      {profileForm.codEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Bottom Save Action Bar */}
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-8 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/25 transition transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Saving Settings...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Save Kitchen Profile & Payment Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* 📸 MODAL: CUSTOM QR PAYMENT PROOF INSPECTION & VERIFICATION */}
      {/* =================================================================== */}
      {selectedPaymentProofOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative space-y-5 my-6 text-slate-800">
            <button
              onClick={() => {
                setSelectedPaymentProofOrder(null);
                setShowRejectProofModal(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center space-x-3.5 border-b border-slate-100 pb-4">
              <div className="p-3.5 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-lg shadow-orange-500/20">
                <Camera className="w-7 h-7" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full uppercase tracking-wider">
                  📸 Customer Payment Proof Verification
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  Order #{selectedPaymentProofOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Customer: {selectedPaymentProofOrder.user?.name} ({selectedPaymentProofOrder.user?.phone})
                </p>
              </div>
            </div>

            {/* Details Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Billed Amount</span>
                <span className="text-base font-black text-emerald-600">₹{selectedPaymentProofOrder.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Payment Mode</span>
                <span className="font-extrabold text-slate-800">Custom QR</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Bank UTR / Ref</span>
                <span className="font-mono font-bold text-slate-900 truncate block">
                  {selectedPaymentProofOrder.paymentReferenceNumber || 'Not Provided'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Proof Status</span>
                <span className={`font-black text-[11px] ${
                  selectedPaymentProofOrder.paymentProofStatus === 'VERIFIED'
                    ? 'text-emerald-600'
                    : selectedPaymentProofOrder.paymentProofStatus === 'REJECTED'
                    ? 'text-rose-600'
                    : 'text-amber-600'
                }`}>
                  {selectedPaymentProofOrder.paymentProofStatus || 'AWAITING'}
                </span>
              </div>
            </div>

            {/* Screenshot Image Viewer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Uploaded Payment Receipt Screenshot:</span>
                {selectedPaymentProofOrder.paymentScreenshotUrl && (
                  <a
                    href={selectedPaymentProofOrder.paymentScreenshotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-700 font-bold inline-flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open in Full Tab
                  </a>
                )}
              </div>

              <div className="bg-slate-900 rounded-2xl p-2 max-h-[380px] overflow-auto flex items-center justify-center border border-slate-800">
                {selectedPaymentProofOrder.paymentScreenshotUrl ? (
                  <img
                    src={selectedPaymentProofOrder.paymentScreenshotUrl}
                    alt="Customer Payment Receipt"
                    className="max-h-[360px] max-w-full object-contain rounded-xl shadow-md"
                  />
                ) : (
                  <div className="py-16 text-slate-400 text-xs text-center space-y-1">
                    <Camera className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p>No screenshot image URL attached to this order.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Rejection Prompt Form */}
            {showRejectProofModal ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 animate-in fade-in">
                <label className="block text-xs font-black text-rose-900 uppercase">
                  Select or Type Rejection Reason *
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    'Screenshot blurry or unreadable',
                    'Amount mismatch on receipt',
                    'Old / Duplicate transaction ID',
                    'Payment not credited to bank'
                  ].map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setPaymentRejectReason(reason)}
                      className={`p-2 rounded-xl text-[11px] font-bold text-left border transition ${
                        paymentRejectReason === reason
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-100/50'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={paymentRejectReason}
                  onChange={(e) => setPaymentRejectReason(e.target.value)}
                  placeholder="Custom reason note..."
                  className="w-full px-3.5 py-2 bg-white border border-rose-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowRejectProofModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={verifyingPaymentProof || !paymentRejectReason.trim()}
                    onClick={() => handleVerifyPaymentProof(selectedPaymentProofOrder.id, 'REJECTED', paymentRejectReason)}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition disabled:opacity-50"
                  >
                    {verifyingPaymentProof ? 'Rejecting...' : 'Confirm Rejection ✕'}
                  </button>
                </div>
              </div>
            ) : (
              /* Action Buttons */
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRejectProofModal(true)}
                  disabled={verifyingPaymentProof}
                  className="py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs rounded-2xl border border-rose-200 transition flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Reject Proof</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleVerifyPaymentProof(selectedPaymentProofOrder.id, 'VERIFIED', 'Payment approved by vendor')}
                  disabled={verifyingPaymentProof}
                  className="py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-1.5"
                >
                  {verifyingPaymentProof ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Approve Payment & Confirm Order ✓
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 🔑 MODAL: OTP DELIVERY HANDSHAKE VERIFICATION */}
      {/* =================================================================== */}
      {verifyingOtpOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative text-slate-800 space-y-5">
            <button
              onClick={() => setVerifyingOtpOrder(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b pb-4">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                <Key className="w-7 h-7 animate-bounce" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">Enter Customer Delivery OTP</h3>
                <p className="text-xs text-slate-500">
                  Order #{verifyingOtpOrder.orderNumber} • {verifyingOtpOrder.user?.name}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-800">
                Package: <span className="text-amber-700">{verifyingOtpOrder.tiffinItem?.title}</span>
              </p>
              <p className="text-slate-600">
                Destination: {verifyingOtpOrder.deliveryAddress}, {verifyingOtpOrder.area}
              </p>
              <p className="text-slate-600 font-semibold">
                Customer Phone: {verifyingOtpOrder.user?.phone}
              </p>
            </div>

            <form onSubmit={handleSubmitVerifyOtp} className="space-y-4">
              <div>
                <label className="block font-black text-slate-800 text-xs uppercase tracking-wider mb-2">
                  4-Digit Customer OTP Code *
                </label>
                <input
                  type="text"
                  maxLength={4}
                  autoFocus
                  required
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 4829"
                  className="w-full text-center py-4 bg-amber-50 border-2 border-amber-400 rounded-2xl font-mono font-black text-3xl tracking-widest text-amber-950 outline-none focus:ring-4 focus:ring-amber-300"
                />
                <p className="text-[11px] text-slate-500 mt-1.5 text-center">
                  Ask the customer to read the OTP shown on their active order dashboard.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">
                  Delivery Note (Optional)
                </label>
                <input
                  type="text"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="e.g. Delivered hot to customer at door"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyingOtpOrder(null)}
                  className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={verifyingOtp || enteredOtp.length < 4}
                  className="py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-amber-600/20 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {verifyingOtp ? 'Verifying...' : 'Confirm Delivery ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 🍱 MODAL: ADD TIFFIN PACKAGE */}
      {/* =================================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8 space-y-4 text-slate-800">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b pb-3">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                <Utensils className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">Add New Tiffin Package</h3>
                <p className="text-xs text-slate-500">Add a new meal package to your kitchen menu</p>
              </div>
            </div>

            <form onSubmit={handleAddTiffin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Package Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deluxe Gujarati Thali"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price Per Day (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="120"
                    value={newItem.pricePerDay}
                    onChange={(e) => setNewItem({ ...newItem, pricePerDay: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price Per Month (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="3000"
                    value={newItem.pricePerMonth}
                    onChange={(e) => setNewItem({ ...newItem, pricePerMonth: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  >
                    <option value="VEG">Pure Veg 🥗</option>
                    <option value="JAIN">Jain / Swaminarayan 🕉️</option>
                    <option value="NON_VEG">Non-Veg 🍗</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Meal Window *</label>
                  <select
                    value={newItem.mealType}
                    onChange={(e) => setNewItem({ ...newItem, mealType: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  >
                    <option value="LUNCH">Lunch Only ☀️</option>
                    <option value="DINNER">Dinner Only 🌙</option>
                    <option value="FULL_DAY">Full Day (Lunch + Dinner) 🍱</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dishes & Menu Details *</label>
                <textarea
                  rows="2"
                  required
                  placeholder="e.g. 4 Phulka Rotis, Paneer Sabji, Dal Tadka, Jeera Rice, Salad, Pickle"
                  value={newItem.dishes}
                  onChange={(e) => setNewItem({ ...newItem, dishes: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiffin Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 🔍 MODAL: ORDER DETAILS INSPECTION */}
      {/* =================================================================== */}
      {selectedDetailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-6 space-y-5 text-slate-800">
            <button
              onClick={() => setSelectedDetailOrder(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b pb-3">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">Order #{selectedDetailOrder.orderNumber}</h3>
                <p className="text-xs text-slate-500">Customer: {selectedDetailOrder.user?.name} ({selectedDetailOrder.user?.phone})</p>
              </div>
            </div>

            {/* Cancellation Notice if Order is Cancelled */}
            {selectedDetailOrder.orderStatus === 'CANCELLED' && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-rose-800 font-black">
                  <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  <span>Subscription / Order Cancelled</span>
                </div>
                <div className="text-rose-700 bg-white/70 p-2.5 rounded-xl border border-rose-200">
                  <span className="font-bold text-rose-900 block mb-0.5">Cancellation Reason:</span>
                  <span>{selectedDetailOrder.cancellationReason || 'Cancelled by Customer'}</span>
                </div>
              </div>
            )}

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span>Plan Type:</span>
                <span className="font-bold">{selectedDetailOrder.planType}</span>
              </div>
              <div className="flex justify-between">
                <span>Meals Delivered:</span>
                <span className="font-bold text-emerald-600">{selectedDetailOrder.deliveredDaysCount || 0} Meals</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold text-slate-900">₹{selectedDetailOrder.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Mode & Status:</span>
                <span className="font-bold">{selectedDetailOrder.paymentMode} ({selectedDetailOrder.paymentStatus})</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Address:</span>
                <span className="font-medium text-slate-700 max-w-xs text-right">{selectedDetailOrder.deliveryAddress}, {selectedDetailOrder.area}</span>
              </div>
            </div>

            {/* Custom QR Payment Proof Section if Applicable */}
            {selectedDetailOrder.paymentMode === 'CUSTOM_QR' && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-amber-950">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    <span>Custom UPI QR Payment Proof</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                    selectedDetailOrder.paymentProofStatus === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedDetailOrder.paymentProofStatus === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-200 text-amber-900'
                  }`}>
                    {selectedDetailOrder.paymentProofStatus || 'AWAITING_VERIFICATION'}
                  </span>
                </div>

                {selectedDetailOrder.paymentReferenceNumber && (
                  <div className="text-[11px] text-slate-700">
                    <strong>Bank / UPI Ref (UTR):</strong> <span className="font-mono font-bold">{selectedDetailOrder.paymentReferenceNumber}</span>
                  </div>
                )}

                {selectedDetailOrder.paymentScreenshotUrl && (
                  <div className="flex items-center gap-3 pt-1">
                    <img
                      src={selectedDetailOrder.paymentScreenshotUrl}
                      alt="Payment Receipt"
                      className="w-16 h-16 object-cover rounded-xl border border-amber-300 shadow-sm cursor-pointer hover:opacity-90"
                      onClick={() => setSelectedPaymentProofOrder(selectedDetailOrder)}
                    />
                    <div className="space-y-1 flex-1">
                      <p className="text-[11px] text-slate-600">Customer attached receipt at checkout.</p>
                      <button
                        type="button"
                        onClick={() => setSelectedPaymentProofOrder(selectedDetailOrder)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] shadow-xs flex items-center gap-1"
                      >
                        <Camera className="w-3 h-3" /> Inspect Full Proof 🔍
                      </button>
                    </div>
                  </div>
                )}

                {/* Fast Action Buttons if Awaiting Verification */}
                {selectedDetailOrder.paymentProofStatus !== 'VERIFIED' && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/60">
                    <button
                      type="button"
                      onClick={() => handleVerifyPaymentProof(selectedDetailOrder.id, 'VERIFIED', 'Verified by Owner')}
                      disabled={verifyingPaymentProof}
                      className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve Proof ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPaymentProofOrder(selectedDetailOrder);
                        setShowRejectProofModal(true);
                      }}
                      disabled={verifyingPaymentProof}
                      className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject Proof ✕
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Attendance Logs */}
            <div className="space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase">Attendance History</h4>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {orderAttendanceLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No attendance records logged yet.</p>
                ) : (
                  orderAttendanceLogs.map(log => (
                    <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border flex justify-between text-xs">
                      <div>
                        <span className="font-bold">{log.attendanceDate}</span>: <span className="text-slate-600">{log.notes || log.status}</span>
                      </div>
                      <span className="font-bold text-emerald-600">{log.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedInvoiceOrder(selectedDetailOrder)}
                  className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> View Tax Invoice
                </button>

                {selectedDetailOrder.orderStatus !== 'CANCELLED' && !selectedDetailOrder.todayOtpVerified && (
                  <button
                    onClick={() => {
                      const target = selectedDetailOrder;
                      setSelectedDetailOrder(null);
                      handleOpenOtpModal(target);
                    }}
                    className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-200" /> Verify Delivery OTP
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedDetailOrder(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 📜 MASTER KOT / LIVE KITCHEN PREP SHEET MODAL */}
      {/* =================================================================== */}
      {showMasterKOTModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6 my-6 text-slate-800">
            <button
              onClick={() => setShowMasterKOTModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b pb-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                <ChefHat className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg sm:text-xl">
                  Chef's Master Production & Packing Sheet
                </h3>
                <p className="text-xs text-slate-500">
                  {centerData?.centerName || 'Kitchen'} • Live Roti & Thali Batch Breakdown
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Total Meals</span>
                <span className="text-2xl font-black text-amber-900">{totalActiveMeals}</span>
              </div>
              <div className="p-3 bg-orange-50 rounded-2xl border border-orange-200 text-center">
                <span className="text-[10px] font-bold text-orange-800 uppercase block">Fresh Phulkes</span>
                <span className="text-2xl font-black text-orange-900">~{estimatedPhulkes}</span>
              </div>
              <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 text-center">
                <span className="text-[10px] font-bold text-sky-800 uppercase block">☀️ Lunch Pack</span>
                <span className="text-2xl font-black text-sky-900">{totalLunchMeals}</span>
              </div>
              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200 text-center">
                <span className="text-[10px] font-bold text-indigo-800 uppercase block">🌙 Dinner Pack</span>
                <span className="text-2xl font-black text-indigo-900">{totalDinnerMeals}</span>
              </div>
            </div>

            {/* Active Orders List Breakdown */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">
                Live Packing Checklist ({activeOrdersList.length} Subscriptions)
              </h4>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
                {activeOrdersList.length === 0 ? (
                  <p className="p-4 text-xs text-slate-400 text-center">No active orders to prepare right now.</p>
                ) : (
                  activeOrdersList.map((order, idx) => (
                    <div key={order.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                      <div className="space-y-0.5">
                        <div className="font-black text-slate-900 flex items-center gap-1.5">
                          <span>#{idx + 1} • #{order.orderNumber}</span>
                          <span className="px-2 py-0.2 bg-slate-100 text-slate-700 font-bold rounded text-[10px]">{order.planType}</span>
                        </div>
                        <p className="text-slate-600 font-medium">
                          {order.tiffinItem?.title} • Qty: <strong>{order.quantity}</strong> (~{(order.quantity || 1) * 4} Rotis)
                        </p>
                        <p className="text-[11px] text-slate-500">
                          📍 {order.user?.name} ({order.user?.phone}) • {order.deliveryAddress}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          order.todayOtpVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {order.todayOtpVerified ? 'Delivered' : 'Packing Pending'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Production Sheet
              </button>
              <button
                onClick={() => setShowMasterKOTModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Invoice Modal */}
      <InvoiceModal
        isOpen={!!selectedInvoiceOrder}
        onClose={() => setSelectedInvoiceOrder(null)}
        order={selectedInvoiceOrder}
      />

      {/* =================================================================== */}
      {/* 🚨 MODAL: REAL-TIME NEW ORDER POP-UP ALERT MODAL */}
      {/* =================================================================== */}
      {newOrderAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-amber-500 relative text-slate-800 space-y-5 animate-pulse-glow">
            <button
              onClick={() => setNewOrderAlert(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Alert Header */}
            <div className="flex items-center space-x-3.5 border-b border-amber-100 pb-4">
              <div className="p-3.5 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-lg shadow-orange-500/30 animate-bounce">
                <BellRing className="w-7 h-7" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black rounded-full uppercase tracking-wider animate-pulse">
                  ⚡ Real-Time New Order!
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  New Meal Order Received!
                </h3>
                <p className="text-xs text-slate-500">
                  Order #{newOrderAlert.orderNumber}
                </p>
              </div>
            </div>

            {/* Order Details Body */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-amber-950 text-sm">{newOrderAlert.tiffinItem?.title || 'Tiffin Package'}</span>
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold rounded-md text-[10px]">
                    Qty: {newOrderAlert.quantity || 1}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded text-[10px]">
                    {newOrderAlert.planType} Plan
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600">
                    {newOrderAlert.tiffinItem?.mealType === 'LUNCH'
                      ? '☀️ Lunch (12:00 - 1:30 PM)'
                      : newOrderAlert.tiffinItem?.mealType === 'DINNER'
                      ? '🌙 Dinner (7:00 - 8:30 PM)'
                      : '🍱 Full Day Delivery'}
                  </span>
                </div>
              </div>

              {/* Customer & Location */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm">{newOrderAlert.user?.name}</p>
                    <a
                      href={`tel:${newOrderAlert.user?.phone}`}
                      className="text-orange-600 font-bold hover:underline inline-flex items-center gap-1 text-xs mt-0.5"
                    >
                      <Phone className="w-3 h-3" /> {newOrderAlert.user?.phone}
                    </a>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Bill Amount</span>
                    <span className="text-base font-black text-emerald-600">₹{newOrderAlert.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 text-slate-600 text-[11px] flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Delivery:</strong> {newOrderAlert.deliveryAddress}, {newOrderAlert.area}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setNewOrderAlert(null);
                  setActiveTab('DELIVERIES');
                }}
                className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                View in Queue
              </button>

              <button
                type="button"
                onClick={async () => {
                  await handleConfirmOrder(newOrderAlert.id);
                  setNewOrderAlert(null);
                  setActiveTab('DELIVERIES');
                }}
                className="py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Accept & Confirm ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
