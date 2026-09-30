import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Utensils,
  MapPin,
  Star,
  ShieldCheck,
  Clock,
  Tag,
  CheckCircle2,
  Calendar,
  Phone,
  Store,
  ChefHat,
  Leaf,
  Flame,
  Award,
  CreditCard,
  Truck,
  Sparkles,
  Navigation,
  Loader2,
  Share2,
  Heart,
  MessageCircle,
  FileText,
  AlertCircle,
  Check,
  QrCode,
  UploadCloud,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Zap,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PaytmGatewayModal from '../components/PaytmGatewayModal';
import InvoiceModal from '../components/InvoiceModal';
import TiffinCard from '../components/TiffinCard';
import notify from '../utils/notify';

export default function TiffinDetails({ onOpenLocationModal }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [tiffin, setTiffin] = useState(null);
  const [center, setCenter] = useState(null);
  const [relatedTiffins, setRelatedTiffins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Subscription Order State
  const [planType, setPlanType] = useState('MONTHLY'); // '1_DAY', '15_DAYS', 'MONTHLY'
  const [paymentOption, setPaymentOption] = useState('FULL_UPFRONT'); // 'FULL_UPFRONT', 'HALF_15DAY_POSTPAID'
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [paymentMode, setPaymentMode] = useState('PAYTM_UPI'); // 'PAYTM_UPI', 'CUSTOM_QR', 'COD'

  // Custom Owner QR Payment & Screenshot Proof State
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState('');
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState('');
  const [paymentReferenceNumber, setPaymentReferenceNumber] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  
  // GPS Detection State
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [detectedLocInfo, setDetectedLocInfo] = useState(null);

  // Paytm Checkout & Invoice Modals
  const [showPaytmModal, setShowPaytmModal] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    fetchTiffinDetails();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  // Autofill user address when user logs in or profile changes
  useEffect(() => {
    if (user?.address && !deliveryAddress) {
      setDeliveryAddress(user.address);
    }
  }, [user]);

  // Restore pending checkout state and handle post-login redirection
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const isCheckoutAction = searchParams.get('action') === 'checkout';
    const savedPendingStr = sessionStorage.getItem('pendingCheckout');

    if (savedPendingStr) {
      try {
        const saved = JSON.parse(savedPendingStr);
        if (saved && (!saved.tiffinId || String(saved.tiffinId) === String(id))) {
          if (saved.planType) setPlanType(saved.planType);
          if (saved.paymentOption) setPaymentOption(saved.paymentOption);
          if (saved.quantity) setQuantity(saved.quantity);
          if (saved.paymentMode) setPaymentMode(saved.paymentMode);
          if (saved.deliveryAddress) {
            setDeliveryAddress(saved.deliveryAddress);
          } else if (user?.address) {
            setDeliveryAddress(user.address);
          }
        }
      } catch (e) {
        console.error('Error restoring pendingCheckout:', e);
      }
    }

    if (user && (isCheckoutAction || savedPendingStr)) {
      sessionStorage.removeItem('pendingCheckout');
      notify.info(`Welcome back, ${user.name}! Your meal plan selection is restored.`, 'Checkout Resumed');
      
      // Auto open Paytm modal if address is available and mode is PAYTM_UPI
      setTimeout(() => {
        const addr = deliveryAddress || user.address;
        if (addr && addr.trim().length > 0) {
          setShowPaytmModal(true);
        } else {
          const checkoutPanel = document.getElementById('checkout-panel');
          if (checkoutPanel) {
            checkoutPanel.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }, 400);
    }
  }, [id, user, location.search]);

  const fetchTiffinDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/customer/tiffins/${id}`);
      const itemData = res.data;
      setTiffin(itemData);
      setCenter(itemData.tiffinCenter || null);

      if (itemData.tiffinCenter?.id) {
        try {
          const relatedRes = await axios.get(`/api/customer/centers/${itemData.tiffinCenter.id}/tiffins`);
          const otherItems = (relatedRes.data || [])
            .filter(item => item.id !== itemData.id)
            .map(item => ({ ...item, center: itemData.tiffinCenter }));
          setRelatedTiffins(otherItems);
        } catch (e) {
          console.error('Failed to load related items:', e);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Tiffin package details not found or unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      notify.warning('Geolocation not supported. Please type your delivery address.', 'GPS Unavailable');
      return;
    }

    setDetectingLocation(true);
    const geoOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 12000
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const address = response.data.address || {};
          const building = address.building || address.house_name || address.house_number || address.amenity || '';
          const road = address.road || address.pedestrian || address.residential || '';
          const area = address.suburb || address.neighbourhood || address.quarter || address.village || address.city_district || 'Local Area';
          const city = address.city || address.town || address.municipality || 'City';
          const pincode = address.postcode || '';

          const parts = [building, road, area, city, pincode].filter(Boolean);
          const fullAddress = response.data.display_name || parts.join(', ');

          setDeliveryAddress(fullAddress);
          setDetectedLocInfo({ area, city, pincode });
          notify.success(`Delivery address detected! (${area}, ${city})`, 'GPS Detected');
        } catch (err) {
          setDeliveryAddress(`GPS Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          notify.info('GPS coordinates acquired.', 'Location Updated');
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setDetectingLocation(false);
        notify.warning('Location permission denied. Please enter address manually.', 'GPS Denied');
      },
      geoOptions
    );
  };

  const calculateSubtotal = () => {
    if (!tiffin) return 0;
    if (planType === '1_DAY') {
      return (tiffin.pricePerDay || 0) * quantity;
    } else if (planType === '15_DAYS') {
      const dailyVal = tiffin.pricePerDay || (tiffin.pricePerMonth ? tiffin.pricePerMonth / 30 : 100);
      return Math.round(dailyVal * 15 * 0.95 * quantity);
    } else {
      // Monthly
      let base = (tiffin.pricePerMonth || 0) * quantity;
      if (paymentOption === 'HALF_15DAY_POSTPAID') {
        base = Math.round(base / 2);
      }
      return base;
    }
  };

  const calculateTotal = () => {
    const sub = calculateSubtotal();
    const gst = Math.round(sub * 0.05);
    return sub + gst;
  };

  const handleUploadScreenshot = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const previewUrl = URL.createObjectURL(file);
    setPaymentScreenshotPreview(previewUrl);
    setUploadingProof(true);

    try {
      const formData = new FormData();
      formData.append('screenshot', file);
      const res = await axios.post('/api/customer/upload-payment-proof', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPaymentScreenshotUrl(res.data.screenshotUrl);
      notify.success('Payment proof screenshot uploaded successfully! ✅', 'Screenshot Attached');
    } catch (err) {
      console.error('Screenshot upload error:', err);
      notify.error('Failed to upload screenshot. Please try selecting the image again.', 'Upload Failed');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleCopyUpiId = (upi) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(upi);
      setCopiedUpi(true);
      notify.success(`Copied UPI ID: ${upi}`, 'Copied to Clipboard');
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  const handleOrderSubmit = (e) => {
    e.preventDefault();

    // Guard: Authentication required before proceeding with payment
    if (!user) {
      const pendingData = {
        tiffinId: id,
        planType,
        paymentOption,
        quantity,
        deliveryAddress,
        paymentMode
      };
      sessionStorage.setItem('pendingCheckout', JSON.stringify(pendingData));
      notify.warning('Please log in to confirm your tiffin package and complete payment.', 'Login Required');
      navigate(`/login?redirect=${encodeURIComponent(`/tiffin/${id}?action=checkout`)}`);
      return;
    }

    if (!deliveryAddress.trim()) {
      notify.warning('Please enter your complete flat/room number and street address.', 'Address Required');
      return;
    }

    if (paymentMode === 'CUSTOM_QR') {
      if (!paymentScreenshotUrl || paymentScreenshotUrl.trim().length === 0) {
        notify.error('Mandatory Requirement: Please attach/upload your payment confirmation screenshot before placing order.', 'Payment Proof Mandatory');
        const uploadBox = document.getElementById('qr-screenshot-upload-box');
        if (uploadBox) {
          uploadBox.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }
      const generatedRef = paymentReferenceNumber.trim() ? paymentReferenceNumber.trim() : 'UPI-' + Date.now();
      executeOrderPlacement(generatedRef, 'CUSTOM_QR');
    } else if (paymentMode.startsWith('PAYTM')) {
      setShowPaytmModal(true);
    } else {
      executeOrderPlacement('COD-' + Date.now(), 'COD');
    }
  };

  const executeOrderPlacement = async (txnId, pMode) => {
    if (!user || !user.id) {
      notify.warning('Please sign in to place your meal order.', 'Login Required');
      navigate(`/login?redirect=${encodeURIComponent(`/tiffin/${id}?action=checkout`)}`);
      return;
    }

    setPlacingOrder(true);
    setShowPaytmModal(false);
    try {
      const finalAmount = calculateTotal();
      const activeUserId = user.id;
      const activeCenterId = center?.id || tiffin?.tiffinCenter?.id || 1;

      const payload = {
        userId: activeUserId,
        tiffinCenterId: activeCenterId,
        tiffinItemId: tiffin.id,
        planType: planType,
        paymentOption: planType === 'MONTHLY' ? paymentOption : 'FULL_UPFRONT',
        quantity: quantity,
        deliveryAddress: deliveryAddress,
        area: center?.area || detectedLocInfo?.area || 'Local Area',
        pincode: center?.pincode || detectedLocInfo?.pincode || '110092',
        totalAmount: finalAmount,
        paymentMode: pMode || paymentMode,
        paytmTxnId: txnId,
        paymentScreenshotUrl: pMode === 'CUSTOM_QR' ? paymentScreenshotUrl : null,
        paymentReferenceNumber: pMode === 'CUSTOM_QR' ? paymentReferenceNumber : null
      };

      const res = await axios.post('/api/customer/orders', payload);
      const placedOrder = res.data.order;
      notify.success(`🎉 Order #${placedOrder.orderNumber} placed! ${pMode === 'CUSTOM_QR' ? 'Payment screenshot submitted for kitchen verification.' : 'Fresh meals will be delivered as scheduled.'}`, 'Order Placed');
      setOrderSuccess(placedOrder);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to place order. Please try again.';
      notify.error(msg, 'Order Failed');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 px-4">
        <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
        <p className="font-bold text-slate-600 text-sm">Loading delicious tiffin package details...</p>
      </div>
    );
  }

  if (error || !tiffin) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-5">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-md">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Tiffin Not Found</h2>
        <p className="text-xs sm:text-sm text-slate-500">{error || 'The requested meal plan is currently not available.'}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-lg shadow-orange-500/20"
        >
          <ArrowLeft className="w-4 h-4" /> Explore All Available Tiffins
        </Link>
      </div>
    );
  }

  const isVeg = tiffin.category === 'VEG' || tiffin.category === 'JAIN';
  const dishList = tiffin.dishes ? tiffin.dishes.split(',').map(d => d.trim()).filter(Boolean) : [];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Breadcrumb Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 font-bold text-slate-700 hover:text-orange-600 transition py-1 px-2 hover:bg-slate-100 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span>/</span>
          <Link to="/" className="hover:text-orange-600 transition font-medium">Home</Link>
          <span>/</span>
          <span className="font-bold text-slate-700">{center?.area || 'Local Area'}</span>
          <span>/</span>
          <span className="font-bold text-orange-600 truncate max-w-[180px] sm:max-w-none">{tiffin.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setLiked(!liked);
              notify.success(liked ? 'Removed from favorites' : 'Saved to favorite tiffins!', 'Favorites');
            }}
            className={`p-2 rounded-xl border transition ${
              liked ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-white text-slate-400 hover:text-slate-600 border-slate-200'
            }`}
            title="Save to Favorites"
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-rose-600' : ''}`} />
          </button>
          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                notify.success('Tiffin link copied to clipboard!', 'Share');
              }
            }}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 transition"
            title="Share Meal"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Showcase Layout: 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* =================================================================== */}
        {/* 🍱 LEFT COLUMN: VISUAL GALLERY, DISHES BREAKDOWN, CHEF & REVIEWS */}
        {/* =================================================================== */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Hero Food Image Card */}
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-md relative group">
            <div className="relative h-64 sm:h-96 w-full bg-slate-100 overflow-hidden">
              <img
                src={tiffin.imageUrl || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=900'}
                alt={tiffin.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=900';
                }}
              />
              
              {/* Top Badges */}
              <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                <span className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md border border-white/60">
                  <span className={`w-2.5 h-2.5 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                  <span className={isVeg ? 'text-emerald-700' : 'text-rose-700'}>{tiffin.category}</span>
                </span>

                <span className="bg-orange-600/95 text-white backdrop-blur-md px-3 py-1 rounded-full text-xs font-black shadow-md tracking-wider uppercase">
                  {tiffin.mealType.replace('_', ' ')}
                </span>
              </div>

              {/* Legal Hygiene Seal */}
              <div className="absolute bottom-4 right-4 bg-slate-900/85 text-white backdrop-blur-md px-3 py-1.5 rounded-2xl text-[11px] font-bold flex items-center gap-1.5 shadow-lg border border-white/20">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Legal Food Safety Verified</span>
              </div>
            </div>

            {/* Title & Core Overview */}
            <div className="p-5 sm:p-7 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-bold text-orange-600">
                    <Store className="w-4 h-4" /> {center?.centerName || 'Verified Tiffin Kitchen'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" /> {center?.area || 'Local Area'}, {center?.city || 'Delhi'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                  {tiffin.title}
                </h1>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                {tiffin.description || 'Authentic home-cooked meals prepared with high-grade ingredients and low oil. Freshly delivered hot in insulated packaging to your doorstep.'}
              </p>

              {/* Delivery Window Info Bar */}
              <div className="p-4 bg-amber-50/90 rounded-2xl border border-amber-200 text-xs text-amber-950 font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <span className="block text-slate-900 font-extrabold text-xs sm:text-sm">Daily Delivery Schedule:</span>
                    <span className="text-slate-600 text-[11px] font-medium">
                      {tiffin.mealType === 'LUNCH'
                        ? '☀️ Lunch Delivery Window: 12:00 PM – 1:30 PM'
                        : tiffin.mealType === 'DINNER'
                        ? '🌙 Dinner Delivery Window: 7:00 PM – 8:30 PM'
                        : '🍱 Full Day: Lunch (12:00 PM - 1:30 PM) + Dinner (7:00 PM - 8:30 PM)'}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-amber-200/80 text-amber-900 text-[10px] rounded-lg font-black uppercase">
                  Daily On-Time
                </span>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* 🍲 WHAT'S IN THE THALI / MEAL BOX (DISHES BREAKDOWN) */}
          {/* =================================================================== */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-orange-600" /> What's Included in This Thali Box
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Freshly cooked balanced diet portioned for single person meal
                </p>
              </div>
              <span className="px-3 py-1 bg-orange-50 text-orange-700 font-extrabold text-xs rounded-full border border-orange-200">
                {dishList.length} Items
              </span>
            </div>

            {dishList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dishList.map((dish, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center space-x-3 hover:bg-orange-50/50 hover:border-orange-200 transition"
                  >
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </div>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm">{dish}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-600 italic">Standard nutritious home thali with Phulka Rotis, Dal Tadka, Sabzi, Rice, Salad & Pickle.</p>
            )}

            {/* Hygiene & Preparation Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-1">
                <Leaf className="w-5 h-5 text-emerald-600 mx-auto" />
                <p className="font-black text-emerald-900 text-xs">Low-Oil Cooking</p>
                <p className="text-[10px] text-emerald-700">Healthy & light on stomach</p>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-1">
                <Sparkles className="w-5 h-5 text-amber-600 mx-auto" />
                <p className="font-black text-amber-900 text-xs">Fresh Daily Ingredients</p>
                <p className="text-[10px] text-amber-700">No frozen or day-old food</p>
              </div>

              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200 text-center space-y-1">
                <Truck className="w-5 h-5 text-indigo-600 mx-auto" />
                <p className="font-black text-indigo-900 text-xs">Sealed Thermal Box</p>
                <p className="text-[10px] text-indigo-700">Delivered piping hot</p>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* 🏪 KITCHEN PARTNER & CHEF DETAILS */}
          {/* =================================================================== */}
          {center && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xl border border-amber-200">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base sm:text-lg">{center.centerName}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Managed by {center.ownerName || 'Verified Partner'} • {center.area}, {center.city}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-xl font-black text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{center.rating || 4.9}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{center.totalReviews || 240}+ Reviews</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
                <div className="space-y-2">
                  <p className="flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Kitchen Address:</strong> {center.address || center.area} (Pincode: {center.pincode})</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>
                      <strong>Partner Phone:</strong>{' '}
                      <a href={`tel:${center.phone}`} className="text-orange-600 font-bold hover:underline">
                        {center.phone}
                      </a>
                    </span>
                  </p>
                </div>

                <div className="space-y-2">
                  {center.cuisines && (
                    <p className="flex items-center gap-1.5">
                      <ChefHat className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span><strong>Speciality:</strong> {center.cuisines}</span>
                    </p>
                  )}
                  {center.fssaiNo && (
                    <p className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <span><strong>FSSAI Lic:</strong> <code className="font-mono text-[11px] font-bold">{center.fssaiNo}</code></span>
                    </p>
                  )}
                </div>
              </div>

              {center.description && (
                <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 italic">
                  "{center.description}"
                </p>
              )}
            </div>
          )}

          {/* =================================================================== */}
          {/* ⭐ CUSTOMER REVIEWS & TESTIMONIALS */}
          {/* =================================================================== */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Customer Ratings & Reviews
              </h3>
              <span className="text-xs font-bold text-slate-500">Based on verified subscriptions</span>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Amit Verma (PG Student, Laxmi Nagar)', rating: 5, time: '2 days ago', comment: 'Khana bilkul ghar jaisa hai! Phulke ekdum soft aate hain aur dal tadka me low oil rehta hai. Daily attendance system is very convenient.' },
                { name: 'Pooja Deshmukh (Working Professional)', rating: 5, time: '1 week ago', comment: 'Packaging is top notch. Delivery is always on time before 1:00 PM for lunch. Highly recommended monthly subscription.' }
              ].map((rev, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{rev.name}</span>
                    <div className="flex items-center gap-1">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">"{rev.comment}"</p>
                  <span className="text-[10px] text-slate-400 block">{rev.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Related Tiffins from Same Center */}
          {relatedTiffins.length > 0 && (
            <div className="space-y-4 pt-2">
              <h3 className="font-black text-slate-900 text-lg">More Tiffin Options From This Center</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedTiffins.map(item => (
                  <TiffinCard key={item.id} item={item} center={center} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* 💳 RIGHT COLUMN: INTERACTIVE SUBSCRIPTION & CHECKOUT PANEL (STICKY) */}
        {/* =================================================================== */}
        <div id="checkout-panel" className="lg:col-span-5 lg:sticky lg:top-20 space-y-5">
          <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-orange-500/30 shadow-xl space-y-5">
            {/* Header Pricing Tag */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                  Select Subscription Plan
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">Book Your Meal Package</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-bold block">Starting @</span>
                <span className="text-2xl font-black text-slate-900">₹{tiffin.pricePerDay}</span>
                <span className="text-xs text-slate-500 font-normal"> /day</span>
              </div>
            </div>

            <form onSubmit={handleOrderSubmit} className="space-y-4 text-xs sm:text-sm">
              {/* Plan Type Selector (3 Options) */}
              <div className="space-y-2">
                <label className="block font-black text-slate-800 text-xs uppercase tracking-wider">
                  1. Choose Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '1_DAY', label: '1 Day Trial', price: `₹${tiffin.pricePerDay}`, note: 'Single Meal' },
                    { id: '15_DAYS', label: '15-Day Pass', price: `₹${Math.round((tiffin.pricePerDay || 100) * 15 * 0.95)}`, note: 'Flexi Days' },
                    { id: 'MONTHLY', label: 'Monthly (30 D)', price: `₹${tiffin.pricePerMonth}`, note: 'Best Value ⭐' }
                  ].map(plan => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setPlanType(plan.id)}
                      className={`p-3 rounded-2xl border-2 text-center transition flex flex-col justify-between ${
                        planType === plan.id
                          ? 'border-orange-600 bg-orange-50/70 text-orange-950 shadow-md ring-2 ring-orange-500/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="font-extrabold text-xs">{plan.label}</span>
                      <span className="font-black text-sm my-1 text-slate-900">{plan.price}</span>
                      <span className="text-[10px] font-bold text-emerald-600">{plan.note}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Monthly Payment Scheme Option */}
              {planType === 'MONTHLY' && (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                  <label className="block font-bold text-amber-950 text-xs">
                    Monthly Payment Scheme
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPaymentOption('FULL_UPFRONT')}
                      className={`p-2.5 rounded-xl font-bold border transition text-center ${
                        paymentOption === 'FULL_UPFRONT'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-white text-slate-700 border-amber-200'
                      }`}
                    >
                      Full Upfront (₹{tiffin.pricePerMonth})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentOption('HALF_15DAY_POSTPAID')}
                      className={`p-2.5 rounded-xl font-bold border transition text-center ${
                        paymentOption === 'HALF_15DAY_POSTPAID'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-white text-slate-700 border-amber-200'
                      }`}
                    >
                      15-Day Split (₹{Math.round((tiffin.pricePerMonth || 0) / 2)})
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-800">
                    {paymentOption === 'HALF_15DAY_POSTPAID'
                      ? '✓ Pay 50% now, balance after 15 days of attendance tracking.'
                      : '✓ 30-day complete meal security with daily OTP validation.'}
                  </p>
                </div>
              )}

              {/* Quantity Counter */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-700 text-xs">Number of Daily Thalis:</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-black text-slate-700 hover:bg-slate-100 flex items-center justify-center transition shadow-sm"
                  >
                    -
                  </button>
                  <span className="font-black text-slate-900 w-6 text-center text-sm">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-black text-slate-700 hover:bg-slate-100 flex items-center justify-center transition shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Delivery Address & GPS Trigger */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-black text-slate-800 text-xs uppercase tracking-wider">
                    2. Delivery Address *
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoDetectLocation}
                    disabled={detectingLocation}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline"
                  >
                    {detectingLocation ? (
                      <Loader2 className="w-3 h-3 animate-spin text-orange-600" />
                    ) : (
                      <Navigation className="w-3 h-3 text-orange-600" />
                    )}
                    <span>{detectingLocation ? 'Detecting GPS...' : 'Auto-Detect GPS'}</span>
                  </button>
                </div>
                <textarea
                  rows="2"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Flat No, Room No, PG Name, Street & Landmark..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-medium text-xs text-slate-800"
                ></textarea>
              </div>

              {/* Payment Mode Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-black text-slate-800 text-xs uppercase tracking-wider">
                    3. Select Payment Method
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    100% Secure Checkout
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Option 1: Paytm Payment Gateway */}
                  {(center?.paytmGatewayEnabled !== false) && (
                    <button
                      type="button"
                      onClick={() => setPaymentMode('PAYTM_UPI')}
                      className={`p-3 rounded-2xl border-2 transition flex flex-col items-center text-center gap-1.5 ${
                        paymentMode === 'PAYTM_UPI'
                          ? 'border-[#00baf2] bg-sky-50/90 text-[#002e6e] shadow-md ring-2 ring-sky-300'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="font-black text-xs text-[#00baf2] bg-[#002e6e] px-1.5 py-0.5 rounded text-[10px]">Paytm</span>
                        <span className="font-extrabold text-xs">Gateway</span>
                      </div>
                      <span className="text-[10px] text-sky-800 font-semibold">Real-Time Fast PG</span>
                    </button>
                  )}

                  {/* Option 2: Owner's Custom QR Code */}
                  {(center?.customQrEnabled !== false) && (
                    <button
                      type="button"
                      onClick={() => setPaymentMode('CUSTOM_QR')}
                      className={`p-3 rounded-2xl border-2 transition flex flex-col items-center text-center gap-1.5 ${
                        paymentMode === 'CUSTOM_QR'
                          ? 'border-orange-600 bg-orange-50/90 text-orange-950 shadow-md ring-2 ring-orange-300'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <QrCode className="w-3.5 h-3.5 text-orange-600" />
                        <span className="font-extrabold text-xs">Owner's QR</span>
                      </div>
                      <span className="text-[10px] text-orange-700 font-semibold">Direct Bank UPI</span>
                    </button>
                  )}

                  {/* Option 3: COD */}
                  {(center?.codEnabled !== false) && (
                    <button
                      type="button"
                      onClick={() => setPaymentMode('COD')}
                      className={`p-3 rounded-2xl border-2 transition flex flex-col items-center text-center gap-1.5 ${
                        paymentMode === 'COD'
                          ? 'border-emerald-600 bg-emerald-50/90 text-emerald-950 shadow-md ring-2 ring-emerald-300'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-extrabold text-xs">Cash on Delivery</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-semibold">Pay on Delivery</span>
                    </button>
                  )}
                </div>

                {/* ============================================================== */}
                {/* 📱 DETAILED CUSTOM QR CODE PAYMENT & MANDATORY SCREENSHOT PROOF */}
                {/* ============================================================== */}
                {paymentMode === 'CUSTOM_QR' && (
                  <div
                    id="qr-screenshot-upload-box"
                    className="p-4 sm:p-5 bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-amber-50/90 rounded-2xl border-2 border-orange-400 shadow-sm space-y-4 animate-in fade-in duration-200"
                  >
                    <div className="flex items-center justify-between border-b border-orange-200/80 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 bg-orange-600 text-white rounded-xl flex items-center justify-center font-black shadow-sm">
                          <QrCode className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                            {center?.centerName || 'Kitchen Owner'}'s UPI QR
                          </h4>
                          <p className="text-[10px] text-slate-500 font-medium">Scan to pay directly into Owner's account</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-orange-700 bg-orange-100/90 px-2 py-0.5 rounded-full border border-orange-300">
                        Direct Transfer
                      </span>
                    </div>

                    {/* QR Display Card */}
                    <div className="bg-white p-3.5 rounded-2xl border border-orange-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-36 h-36 bg-slate-50 p-2 rounded-2xl border-2 border-orange-300 flex items-center justify-center flex-shrink-0 relative group">
                        <img
                          src={
                            center?.customQrCodeUrl ||
                            `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                              `upi://pay?pa=${center?.customUpiId || 'sunita.sharma@paytm'}&pn=${encodeURIComponent(
                                center?.customUpiName || center?.centerName || 'APKA Tiffine'
                              )}&am=${calculateTotal()}&cu=INR&tn=TiffinOrder_${tiffin.id}`
                            )}`
                          }
                          alt="Tiffin Owner UPI QR Code"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>

                      <div className="space-y-2 flex-1 text-center sm:text-left min-w-0">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payee UPI ID:</span>
                          <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                            <code className="text-xs sm:text-sm font-black text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 truncate">
                              {center?.customUpiId || 'sunita.sharma@paytm'}
                            </code>
                            <button
                              type="button"
                              onClick={() => handleCopyUpiId(center?.customUpiId || 'sunita.sharma@paytm')}
                              className={`p-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
                                copiedUpi ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                              }`}
                              title="Copy UPI ID"
                            >
                              {copiedUpi ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payee Name:</span>
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {center?.customUpiName || center?.ownerName || center?.centerName || 'Maa Ki Rasoi Tiffin'}
                          </p>
                        </div>

                        {/* Direct App Deep Links */}
                        <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                          <a
                            href={`upi://pay?pa=${center?.customUpiId || 'sunita.sharma@paytm'}&pn=${encodeURIComponent(
                              center?.customUpiName || center?.centerName || 'Tiffin'
                            )}&am=${calculateTotal()}&cu=INR&tn=TiffinOrder_${tiffin.id}`}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-black text-white text-[10px] font-bold rounded-lg shadow-sm transition inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Open UPI App on Phone
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Instructions Banner */}
                    <div className="p-2.5 bg-amber-100/70 border border-amber-300/80 rounded-xl text-[11px] text-amber-950 space-y-1">
                      <p className="font-bold flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" /> How to Pay via Owner QR:
                      </p>
                      <p className="text-[10px] text-amber-900 leading-relaxed">
                        1. Scan QR or copy UPI ID → 2. Pay exact <strong>₹{calculateTotal()}</strong> on GPay / PhonePe / Paytm → 3. Take screenshot & upload below.
                      </p>
                    </div>

                    {/* MANDATORY PAYMENT PROOF SCREENSHOT UPLOAD BOX */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-orange-600" />
                          <span>Attach Payment Screenshot Proof</span>
                          <span className="text-rose-600 text-xs font-black">* (MANDATORY)</span>
                        </label>
                        {paymentScreenshotUrl && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <Check className="w-3 h-3" /> Uploaded
                          </span>
                        )}
                      </div>

                      {paymentScreenshotPreview ? (
                        <div className="relative rounded-2xl border-2 border-emerald-500 bg-white p-2 flex items-center justify-between shadow-md">
                          <div className="flex items-center space-x-3 min-w-0">
                            <img
                              src={paymentScreenshotPreview}
                              alt="Payment proof screenshot"
                              className="w-14 h-14 object-cover rounded-xl border border-slate-200 shadow-sm"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-900 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Screenshot Attached
                              </p>
                              <p className="text-[10px] text-slate-500">Ready for kitchen verification</p>
                            </div>
                          </div>

                          <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition">
                            Change
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleUploadScreenshot}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-orange-400 hover:border-orange-600 bg-white/80 hover:bg-white rounded-2xl cursor-pointer transition group shadow-sm">
                          {uploadingProof ? (
                            <div className="flex items-center gap-2 text-orange-600 font-bold text-xs py-2">
                              <Loader2 className="w-5 h-5 animate-spin" /> Uploading Screenshot...
                            </div>
                          ) : (
                            <>
                              <UploadCloud className="w-8 h-8 text-orange-500 group-hover:scale-110 transition-transform mb-1" />
                              <span className="text-xs font-extrabold text-slate-800">
                                Click to Upload Payment Screenshot *
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5">
                                JPG, PNG, WEBP receipt from GPay/PhonePe/Paytm
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingProof}
                            onChange={handleUploadScreenshot}
                            className="hidden"
                          />
                        </label>
                      )}

                      {/* Optional UTR / Reference Input */}
                      <div className="pt-1">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          UPI Ref No. / UTR Number (Optional but recommended)
                        </label>
                        <input
                          type="text"
                          value={paymentReferenceNumber}
                          onChange={(e) => setPaymentReferenceNumber(e.target.value)}
                          placeholder="e.g. 423589123456 (12-digit transaction UTR)"
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Price Calculation Summary */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Meal Plan Subtotal ({planType.replace('_', ' ')} x {quantity}):</span>
                  <span className="font-bold text-slate-900">₹{calculateSubtotal()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Doorstep Delivery:</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>5% GST & Food Safety Assurance:</span>
                  <span className="font-bold text-slate-900">₹{Math.round(calculateSubtotal() * 0.05)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                  <span>Total Payable:</span>
                  <span className="text-xl text-orange-600">₹{calculateTotal()}</span>
                </div>
              </div>

              {!user && (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-amber-900 text-xs font-semibold flex items-center gap-2 shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>You'll be prompted to sign in before completing payment. Selection will be saved!</span>
                </div>
              )}

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={placingOrder}
                className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-orange-500/25 transition transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {placingOrder ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing Subscription...
                  </>
                ) : !user ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> Sign In & Pay (₹{calculateTotal()})
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> Subscribe & Confirm Order (₹{calculateTotal()})
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-400 font-medium">
                🔒 Safe & Verified Checkout with Daily OTP Handshake Security
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 🚀 MODAL: ORDER SUCCESS POPUP */}
      {/* =================================================================== */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-emerald-300 relative text-slate-800 space-y-5 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-md animate-bounce">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider">
                🎉 Meal Order Confirmed!
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                Order #{orderSuccess.orderNumber}
              </h3>
              <p className="text-xs text-slate-500">
                Fresh hot meals scheduled with {center?.centerName}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Plan Type:</span>
                <span className="font-bold text-slate-900">{orderSuccess.planType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-black text-emerald-600">₹{orderSuccess.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Address:</span>
                <span className="font-bold text-slate-800 truncate max-w-[200px]">{orderSuccess.deliveryAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Daily Security OTP:</span>
                <span className="font-mono font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                  {orderSuccess.currentDeliveryOtp || '4829'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
              >
                <FileText className="w-4 h-4" /> View Invoice
              </button>

              <button
                onClick={() => navigate('/customer')}
                className="py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-1"
              >
                Track in My Orders →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Paytm Modal */}
      <PaytmGatewayModal
        isOpen={showPaytmModal}
        onClose={() => setShowPaytmModal(false)}
        totalAmount={calculateTotal()}
        center={center}
        onPaymentSuccess={(txnId, pMode) => executeOrderPlacement(txnId, pMode)}
      />

      {/* Global Invoice Modal */}
      {showInvoiceModal && orderSuccess && (
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          order={orderSuccess}
        />
      )}
    </div>
  );
}
