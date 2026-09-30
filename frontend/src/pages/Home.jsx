import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, ShieldCheck, Utensils, Award, Filter, Sparkles, AlertCircle, CheckCircle2, ChevronRight, X, Clock, ShoppingBag, Printer, CreditCard, Navigation, Loader2, RefreshCw } from 'lucide-react';
import TiffinCard from '../components/TiffinCard';
import PaytmGatewayModal from '../components/PaytmGatewayModal';
import InvoiceModal from '../components/InvoiceModal';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import notify from '../utils/notify';

export default function Home({ selectedArea, setSelectedArea, onOpenLocationModal }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [centers, setCenters] = useState([]);
  const [tiffins, setTiffins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL'); // ALL, VEG, NON_VEG
  const [activeTiming, setActiveTiming] = useState('ALL'); // ALL, LUNCH, DINNER, FULL_DAY
  const [selectedCenter, setSelectedCenter] = useState(null);

  // Order & Payment Modal State
  const [selectedTiffin, setSelectedTiffin] = useState(null);
  const [orderPlanType, setOrderPlanType] = useState('MONTHLY'); // 1_DAY, 15_DAYS, MONTHLY
  const [paymentOption, setPaymentOption] = useState('FULL_UPFRONT'); // FULL_UPFRONT, HALF_15DAY_POSTPAID
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMode, setPaymentMode] = useState('PAYTM_UPI'); // PAYTM_UPI, COD, CARD
  const [showMonthlyNoticeModal, setShowMonthlyNoticeModal] = useState(false);
  
  // GPS Location & Reverse Geocoding State
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [autoDetectedInfo, setAutoDetectedInfo] = useState(null);
  
  // Paytm Gateway State
  const [showPaytmModal, setShowPaytmModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    fetchAllApprovedCentersAndTiffins();
  }, [selectedArea]);

  const fetchAllApprovedCentersAndTiffins = async () => {
    setLoading(true);
    try {
      // Fetch all centers regardless of initial area so ALL tiffins display by default!
      const resp = await axios.get('/api/customer/centers');
      const approvedCenters = resp.data || [];
      setCenters(approvedCenters);

      let allItems = [];
      for (const center of approvedCenters) {
        try {
          const itemsResp = await axios.get(`/api/customer/centers/${center.id}/tiffins`);
          const itemsWithCenter = (itemsResp.data || []).map(item => ({
            ...item,
            center: center
          }));
          allItems = [...allItems, ...itemsWithCenter];
        } catch (e) {
          console.error(e);
        }
      }
      setTiffins(allItems);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const popularAreas = ['Laxmi Nagar', 'Mukherjee Nagar', 'Kothrud', 'Koramangala', 'Malviya Nagar'];

  // Filtered Tiffins based on Search & Selected Area & Timing
  const filteredTiffins = tiffins.filter(item => {
    const matchesArea = !selectedArea ||
      item.center?.area?.toLowerCase().includes(selectedArea.toLowerCase()) ||
      item.center?.city?.toLowerCase().includes(selectedArea.toLowerCase());

    const matchesSearch = !searchQuery ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.dishes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.center?.centerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.center?.area?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeCategory === 'ALL' || item.category === activeCategory;

    const matchesTiming =
      activeTiming === 'ALL' || item.mealType === activeTiming;

    return matchesArea && matchesSearch && matchesCategory && matchesTiming;
  });

  // Fallback to all tiffins if area filter returns 0 so subscription plans are NEVER blank!
  const displayTiffins = (filteredTiffins.length > 0)
    ? filteredTiffins
    : tiffins.filter(item => 
        (activeCategory === 'ALL' || item.category === activeCategory) &&
        (activeTiming === 'ALL' || item.mealType === activeTiming)
      );


  const handleAutoFetchLocation = () => {
    if (!navigator.geolocation) {
      notify.warning('Geolocation is not supported by your browser. Please type your address manually.', 'GPS Unavailable');
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
        const { latitude, longitude, accuracy } = position.coords;
        try {
          // OpenStreetMap Nominatim Reverse Geocoding with high precision
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );

          const address = response.data.address || {};
          const building = address.building || address.house_name || address.house_number || address.amenity || '';
          const road = address.road || address.pedestrian || address.street || address.residential || '';
          const area = address.suburb || address.neighbourhood || address.quarter || address.village || address.city_district || 'Local Area';
          const city = address.city || address.town || address.municipality || address.state_district || 'City';
          const pincode = address.postcode || '';
          const state = address.state || '';

          const parts = [building, road, area, city, state, pincode].filter(Boolean);
          const fullAddress = response.data.display_name || parts.join(', ');

          setDeliveryAddress(fullAddress);
          setAutoDetectedInfo({
            fullAddress,
            area,
            city,
            pincode,
            accuracy: Math.round(accuracy)
          });
          notify.success(`GPS Location Auto-Detected! (${area}, ${city})`, 'Address Auto-Fetched');
        } catch (err) {
          const fallback = `GPS Location Coordinates: Lat ${latitude.toFixed(5)}, Long ${longitude.toFixed(5)}`;
          setDeliveryAddress(prev => (prev ? `${prev} (${fallback})` : fallback));
          notify.info('GPS Coordinates fetched. You can add your PG/Room name.', 'Location Detected');
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        setDetectingLocation(false);
        let errorMsg = 'Could not access GPS location. Please allow location permission in your browser or type address manually.';
        if (err.code === 1) errorMsg = 'Location permission was denied. Please allow location permission or type address manually.';
        else if (err.code === 2) errorMsg = 'GPS location position unavailable. Please type your address manually.';
        else if (err.code === 3) errorMsg = 'GPS detection timed out. Please type your address manually.';
        notify.warning(errorMsg, 'GPS Notice');
      },
      geoOptions
    );
  };

  const handleOpenOrderModal = (item, center) => {
    const targetCenter = center || item.center || {
      id: item.tiffinCenterId || 1,
      centerName: item.center?.centerName || 'Verified Tiffin Center',
      area: item.center?.area || 'Local Area',
      pincode: item.center?.pincode || '110092'
    };
    setSelectedTiffin(item);
    setSelectedCenter(targetCenter);
    setOrderSuccess(null);

    // Auto-fetch current live GPS location if address is empty
    if (!deliveryAddress) {
      handleAutoFetchLocation();
    }
  };

  const calculateTotalAmount = () => {
    if (!selectedTiffin) return 0;
    let basePrice = 0;
    if (orderPlanType === 'MONTHLY') {
      basePrice = paymentOption === 'HALF_15DAY_POSTPAID' ? selectedTiffin.pricePerDay * 15 : selectedTiffin.pricePerMonth;
    } else if (orderPlanType === '15_DAYS') {
      basePrice = Math.round(selectedTiffin.pricePerMonth / 2);
      if (basePrice <= 0) basePrice = selectedTiffin.pricePerDay * 15;
    } else {
      basePrice = selectedTiffin.pricePerDay;
    }
    const subtotal = basePrice * orderQuantity;
    const gst = Math.round(subtotal * 0.05 * 100) / 100;
    return subtotal + gst;
  };

  const handleInitiatePayment = (e) => {
    e.preventDefault();

    if (!user) {
      if (selectedTiffin) {
        const pendingData = {
          tiffinId: selectedTiffin.id,
          planType: orderPlanType,
          paymentOption: paymentOption,
          quantity: orderQuantity,
          deliveryAddress: deliveryAddress,
          paymentMode: paymentMode
        };
        sessionStorage.setItem('pendingCheckout', JSON.stringify(pendingData));
        notify.warning('Please sign in to proceed with your meal payment.', 'Login Required');
        navigate(`/login?redirect=${encodeURIComponent(`/tiffin/${selectedTiffin.id}?action=checkout`)}`);
      } else {
        navigate('/login');
      }
      return;
    }

    if (!deliveryAddress.trim()) {
      notify.warning('Please enter your complete delivery flat / room and street address.', 'Address Required');
      return;
    }

    if (paymentMode.startsWith('PAYTM')) {
      setShowPaytmModal(true);
    } else {
      executeOrderPlacement('COD-' + Date.now(), 'COD');
    }
  };

  const executeOrderPlacement = async (txnId, pMode) => {
    if (!user || !user.id) {
      notify.warning('Please sign in to place your meal order.', 'Login Required');
      navigate('/login');
      return;
    }

    setPlacingOrder(true);
    setShowPaytmModal(false);
    try {
      const finalAmount = calculateTotalAmount();
      const activeUserId = user.id;
      const activeCenterId = selectedCenter?.id || selectedTiffin?.tiffinCenterId || 1;

      const payload = {
        userId: activeUserId,
        tiffinCenterId: activeCenterId,
        tiffinItemId: selectedTiffin.id,
        planType: orderPlanType,
        paymentOption: orderPlanType === 'MONTHLY' ? paymentOption : 'FULL_UPFRONT',
        quantity: orderQuantity,
        deliveryAddress: deliveryAddress,
        area: selectedCenter?.area || 'Local Area',
        pincode: selectedCenter?.pincode || '110092',
        totalAmount: finalAmount,
        paymentMode: pMode || paymentMode,
        paytmTxnId: txnId
      };

      const res = await axios.post('/api/customer/orders', payload);
      notify.success(`Order #${res.data.order.orderNumber} confirmed! Fresh meals dispatched as per schedule.`, 'Order Confirmed');
      setOrderSuccess(res.data.order);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to place order. Please try again.';
      notify.error(msg, 'Order Failed');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-600 via-orange-500 to-amber-500 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-10 lg:p-12 shadow-2xl mx-3 sm:mx-6 lg:mx-8">
        <div className="relative z-10 max-w-3xl space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] sm:text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-200" />
            <span>Best Price Tiffins for Students & Professionals</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Ghar Jaisa Swad <br />
            <span className="text-amber-200">Apke Apne Area Me!</span>
          </h1>

          <p className="text-orange-50 text-xs sm:text-base leading-relaxed max-w-2xl font-medium">
            Browse all verified tiffins across all areas by default, or filter by your locality. Daily thalis & monthly subscription packs starting @ student-friendly rates!
          </p>

          {/* Area & Search Input Bar */}
          <div className="bg-white p-2 sm:p-2.5 rounded-2xl shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-slate-800">
            {/* Auto Detect Location Button */}
            <button
              onClick={onOpenLocationModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2.5 sm:py-3 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs rounded-xl transition border border-orange-200 flex-shrink-0"
            >
              <MapPin className="w-4 h-4 text-orange-600 animate-pulse flex-shrink-0" />
              <span className="truncate">{selectedArea ? `Area: ${selectedArea}` : '📍 Set Delivery Location'}</span>
            </button>

            {/* Search Input */}
            <div className="flex-1 flex items-center gap-2 px-3 py-1 sm:py-0 w-full min-w-0">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search area, tiffin name, dishes (e.g. Laxmi Nagar, Paneer Thali)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-slate-800 placeholder-slate-400 font-medium py-1.5"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Popular Area Chips (Touch-Friendly Carousel) */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar scroll-smooth">
            <span className="text-xs font-bold text-orange-100 mr-1 flex-shrink-0">Top Hubs:</span>
            {popularAreas.map(area => (
              <button
                key={area}
                onClick={() => {
                  setSelectedArea(area);
                }}
                className={`text-xs px-3 py-1 rounded-full font-bold transition whitespace-nowrap flex-shrink-0 ${
                  selectedArea === area
                    ? 'bg-white text-orange-600 shadow-md'
                    : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
              >
                {area}
              </button>
            ))}
            {selectedArea && (
              <button
                onClick={() => setSelectedArea('')}
                className="text-xs px-2.5 py-1 bg-amber-200 text-amber-900 rounded-full font-bold hover:bg-amber-300 transition whitespace-nowrap flex-shrink-0"
              >
                Show All Areas ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Trust Badges Bar */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl flex-shrink-0">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h4 className="font-black text-slate-900 text-xs sm:text-sm">Verified Tiffin Centers</h4>
            <p className="text-[11px] sm:text-xs text-slate-500">Aadhaar, PAN & Legal Undertaking Verified</p>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 sm:p-3 bg-orange-50 text-orange-600 rounded-xl flex-shrink-0">
            <Utensils className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h4 className="font-black text-slate-900 text-xs sm:text-sm">Daily & Monthly Plans</h4>
            <p className="text-[11px] sm:text-xs text-slate-500">Flexibility to order single day or monthly pack</p>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 sm:p-3 bg-amber-50 text-amber-600 rounded-xl flex-shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h4 className="font-black text-slate-900 text-xs sm:text-sm">On-Time Daily Delivery</h4>
            <p className="text-[11px] sm:text-xs text-slate-500">Fresh hot meals delivered on schedule</p>
          </div>
        </div>
      </section>

      {/* Main Catalog & Filter Section */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-5 sm:space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {selectedArea ? `Tiffins Available in ${selectedArea}` : 'All Available Tiffins (All Areas)'}
            </h2>
            <p className="text-xs text-slate-500">
              Showing {displayTiffins.length} fresh menu options from verified partner centers
            </p>
          </div>

          {/* Combined Filters (Timing + Dietary Category) */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Meal Timing Filters */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar scroll-smooth max-w-full">
              {[
                { id: 'ALL', label: '🍱 All Timings' },
                { id: 'LUNCH', label: '☀️ Lunch (12:00 PM)' },
                { id: 'DINNER', label: '🌙 Dinner (7:00 PM)' },
                { id: 'FULL_DAY', label: '📦 Full Day' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTiming(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex-shrink-0 ${
                    activeTiming === t.id
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Category Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
              {['ALL', 'VEG', 'NON_VEG'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex-shrink-0 ${
                    activeCategory === cat
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat === 'ALL' ? 'All' : cat === 'VEG' ? '🟢 Veg' : '🔴 Non-Veg'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tiffins Grid */}
        {loading ? (
          <div className="py-16 sm:py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-semibold text-slate-600">Loading delicious tiffin plans...</p>
          </div>
        ) : displayTiffins.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-100 space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto">
              <Utensils className="w-7 h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">No Tiffin Options Found</h3>
            <p className="text-xs text-slate-500">
              No tiffin items match your search criteria.
            </p>
            {selectedArea && (
              <button
                onClick={() => setSelectedArea('')}
                className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md"
              >
                View All Areas
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {displayTiffins.map(item => (
              <TiffinCard
                key={item.id}
                item={item}
                center={item.center}
                onOrder={handleOpenOrderModal}
              />
            ))}
          </div>
        )}
      </main>

      {/* Order & Subscription Checkout Modal */}
      {selectedTiffin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8">
            <button
              onClick={() => {
                setSelectedTiffin(null);
                setOrderSuccess(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {orderSuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Order Placed & Sent to Kitchen!</h3>
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-black rounded-full border border-amber-300 animate-pulse">
                  <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" /> Status: Awaiting Tiffin Center Confirmation
                </div>
                <p className="text-xs text-slate-500">
                  Paytm Txn ID: <span className="font-mono font-bold text-slate-800">{orderSuccess.paytmTxnId}</span>
                </p>
                <div className="bg-slate-50 p-4 rounded-2xl text-left text-xs space-y-2 border border-slate-200">
                  <p><span className="text-slate-400">Order Ref:</span> <strong>{orderSuccess.orderNumber}</strong></p>
                  <p><span className="text-slate-400">Tiffin Package:</span> <strong>{selectedTiffin.title}</strong></p>
                  <p><span className="text-slate-400">Plan Type:</span> <strong>{orderSuccess.planType}</strong></p>
                  <p><span className="text-slate-400">Total Billed:</span> <strong className="text-emerald-600 text-sm">₹{orderSuccess.totalAmount} (GST Included)</strong></p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setShowInvoiceModal(true)}
                    className="py-3 px-4 bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition"
                  >
                    <Printer className="w-4 h-4 text-orange-400" /> Print Tax Invoice
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTiffin(null);
                      setOrderSuccess(null);
                      navigate('/customer');
                    }}
                    className="py-3 px-4 bg-orange-600 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1"
                  >
                    Track Order in Dashboard →
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInitiatePayment} className="space-y-5">
                <div>
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Checkout & Real-Time Billing</span>
                  <h3 className="text-xl font-bold text-slate-900">{selectedTiffin.title}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Utensils className="w-3.5 h-3.5 text-orange-500" /> {selectedCenter?.centerName} ({selectedCenter?.area})
                  </p>
                </div>

                {/* Plan Selection Tabs (1 Day, 15 Days, Monthly) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">Select Plan Duration</label>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Flexible Attendance & 3h Cancel Policy
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {/* 1 Day Option */}
                    <button
                      type="button"
                      onClick={() => setOrderPlanType('1_DAY')}
                      className={`p-3 rounded-2xl border text-left transition ${
                        orderPlanType === '1_DAY' || orderPlanType === 'DAILY'
                          ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20 shadow-sm'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-md inline-block mb-1">
                        1 Day
                      </span>
                      <p className="text-xs font-bold text-slate-800">Single Day</p>
                      <p className="text-base font-black text-orange-600">₹{selectedTiffin.pricePerDay}</p>
                      <p className="text-[9px] text-slate-400">1 meal pack</p>
                    </button>

                    {/* 15 Days Option */}
                    <button
                      type="button"
                      onClick={() => setOrderPlanType('15_DAYS')}
                      className={`p-3 rounded-2xl border text-left transition ${
                        orderPlanType === '15_DAYS'
                          ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20 shadow-sm'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded-md inline-block mb-1">
                        15 Days
                      </span>
                      <p className="text-xs font-bold text-slate-800">Half Month</p>
                      <p className="text-base font-black text-sky-600">₹{Math.round(selectedTiffin.pricePerMonth / 2)}</p>
                      <p className="text-[9px] text-slate-400">15 days pack</p>
                    </button>

                    {/* Monthly Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setOrderPlanType('MONTHLY');
                        setShowMonthlyNoticeModal(true);
                      }}
                      className={`p-3 rounded-2xl border text-left transition relative ${
                        orderPlanType === 'MONTHLY'
                          ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-sm'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-emerald-600 text-white rounded-md inline-block mb-1">
                        30 Days
                      </span>
                      <p className="text-xs font-bold text-slate-800">Monthly</p>
                      <p className="text-base font-black text-emerald-600">₹{selectedTiffin.pricePerMonth}</p>
                      <p className="text-[9px] text-emerald-700 font-semibold">15-day split pay</p>
                    </button>
                  </div>
                </div>

                {orderPlanType === 'MONTHLY' && (
                  <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-emerald-950 uppercase">Monthly Split Payment Option</label>
                      <button
                        type="button"
                        onClick={() => setShowMonthlyNoticeModal(true)}
                        className="text-[10px] text-emerald-700 font-bold underline"
                      >
                        ℹ️ View 15-Day Terms
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setPaymentOption('FULL_UPFRONT')}
                        className={`p-2.5 rounded-xl border text-left font-bold transition ${
                          paymentOption === 'FULL_UPFRONT'
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-[11px] font-bold">Full 30-Day Advance</p>
                        <p className="text-[10px] opacity-90 font-normal">Discounted Bundle (₹{selectedTiffin.pricePerMonth})</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentOption('HALF_15DAY_POSTPAID')}
                        className={`p-2.5 rounded-xl border text-left font-bold transition ${
                          paymentOption === 'HALF_15DAY_POSTPAID'
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-[11px] font-bold">15-Day Split Pay</p>
                        <p className="text-[10px] opacity-90 font-normal">Pay 1st 15 days now + 2nd on attendance</p>
                      </button>
                    </div>
                  </div>
                )}

                {/* Delivery Address with GPS Auto-Fetch & Reverse Geocoding */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Full Delivery Address (PG / Room / Flat No) *
                    </label>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleAutoFetchLocation}
                        disabled={detectingLocation}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 font-extrabold text-[11px] rounded-lg transition border border-orange-200 shadow-sm disabled:opacity-50"
                        title="Auto-detect current GPS location and reverse geocode address"
                      >
                        {detectingLocation ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600" />
                            <span>Detecting GPS...</span>
                          </>
                        ) : (
                          <>
                            <Navigation className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                            <span>📍 Auto-Fetch GPS</span>
                          </>
                        )}
                      </button>

                      {onOpenLocationModal && (
                        <button
                          type="button"
                          onClick={onOpenLocationModal}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition border border-slate-200"
                          title="Search or select area from map"
                        >
                          <MapPin className="w-3 h-3 text-slate-600" />
                          <span>Map Area</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      rows="2"
                      required
                      placeholder="Enter your exact PG name, Room No., Building & Street (or click Auto-Fetch GPS above)..."
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none pr-8"
                    ></textarea>
                    {deliveryAddress && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryAddress('');
                          setAutoDetectedInfo(null);
                        }}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition"
                        title="Clear Address"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {autoDetectedInfo && (
                    <div className="flex items-center justify-between mt-1 text-[11px] text-emerald-800 font-bold bg-emerald-50/90 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <span className="flex items-center gap-1 truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="truncate">Auto-fetched via Reverse Geocoding (Accurate to ~{autoDetectedInfo.accuracy || 10}m)</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 flex-shrink-0 ml-1 font-semibold">Editable above ✏️</span>
                    </div>
                  )}
                </div>

                {/* Payment Option */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Select Payment Gateway</label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('PAYTM_UPI')}
                      className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 transition ${
                        paymentMode === 'PAYTM_UPI'
                          ? 'border-[#00baf2] bg-sky-50 text-[#002e6e] ring-2 ring-sky-300'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="bg-[#00baf2] text-white px-1.5 py-0.5 rounded text-[10px] font-black">Paytm</span> Gateway (UPI/QR)
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode('COD')}
                      className={`py-2.5 px-3 rounded-xl border text-center transition ${
                        paymentMode === 'COD'
                          ? 'border-orange-600 bg-orange-600 text-white'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Cash on Delivery (COD)
                    </button>
                  </div>
                </div>

                {/* Price Breakdown Summary */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total Payable (Inc. 5% GST)</p>
                    <p className="text-2xl font-extrabold text-slate-900">
                      ₹{calculateTotalAmount().toFixed(2)}
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={placingOrder}
                    className="py-3 px-6 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-orange-500/20 disabled:opacity-50"
                  >
                    {placingOrder ? 'Processing...' : 'Proceed to Paytm Pay'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Monthly Plan 15-Day Terms & Cancellation Notice Modal */}
      {showMonthlyNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-emerald-100 relative my-8 space-y-5 text-slate-800">
            <button
              onClick={() => setShowMonthlyNoticeModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider">
                  Monthly Subscription Plan
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">15-Day Payment & Attendance Terms</h3>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-1">
                <h4 className="font-extrabold text-emerald-950 flex items-center gap-1.5 text-sm">
                  💳 1. 15-Day Split Payment Rule
                </h4>
                <p className="text-slate-700">
                  Monthly plan allows 2 installments: Pay for the first <strong>15 days upfront</strong>. The remaining 15 days payment is due on the <strong>15th day / last day of the month</strong>, calculated exactly according to your actual meal attendance.
                </p>
              </div>

              <div className="p-3.5 bg-sky-50/80 rounded-2xl border border-sky-200 space-y-1">
                <h4 className="font-extrabold text-sky-950 flex items-center gap-1.5 text-sm">
                  📅 2. Daily Attendance & Date Maintenance
                </h4>
                <p className="text-slate-700">
                  You can maintain your daily tiffin calendar in your Customer Dashboard. If you do not want a meal on any date, you can mark it as <strong>Skipped</strong> in advance.
                </p>
              </div>

              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-1">
                <h4 className="font-extrabold text-amber-950 flex items-center gap-1.5 text-sm">
                  ⏰ 3. Strict 3-Hour Cut-off Policy
                </h4>
                <p className="text-slate-700">
                  To prevent food wastage, cancellation closes <strong>3 hours before delivery</strong>:
                </p>
                <ul className="list-disc list-inside text-[11px] text-slate-600 pl-1 space-y-0.5 font-medium">
                  <li><strong>Day Lunch (12:00 PM - 1:00 PM)</strong>: Cut-off is <strong>9:00 AM</strong>.</li>
                  <li><strong>Night Dinner (7:00 PM - 8:30 PM)</strong>: Cut-off is <strong>4:00 PM</strong>.</li>
                  <li>After the cut-off time, cancellation is locked for that day.</li>
                </ul>
              </div>

              <div className="p-3.5 bg-purple-50/80 rounded-2xl border border-purple-200 space-y-1">
                <h4 className="font-extrabold text-purple-950 flex items-center gap-1.5 text-sm">
                  📝 4. Mandatory Reason for Skipped Meals
                </h4>
                <p className="text-slate-700">
                  Whenever you skip a day, selecting a reason (e.g. <em>Fasting/Vrat, Out of Station, Sick, Home Food</em>) is mandatory to preserve a transparent ledger for both you and the tiffin center.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowMonthlyNoticeModal(false)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> I Understand & Accept 15-Day Terms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paytm Payment Gateway Modal */}
      <PaytmGatewayModal
        isOpen={showPaytmModal}
        onClose={() => setShowPaytmModal(false)}
        totalAmount={calculateTotalAmount()}
        onPaymentSuccess={(txnId, mode) => executeOrderPlacement(txnId, mode)}
      />

      {/* Invoice Modal */}
      {orderSuccess && (
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          order={orderSuccess}
        />
      )}
    </div>
  );
}
