import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Lock,
  Trash2,
  FileText,
  Phone,
  MapPin,
  Store,
  UserCheck,
  RefreshCw,
  Key,
  Receipt,
  TrendingUp,
  Clock,
  Printer,
  Search,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  PlusCircle,
  BarChart3,
  PieChart,
  ChevronRight,
  Sparkles,
  Building2,
  Filter
} from 'lucide-react';
import DeclarationModal from '../components/DeclarationModal';
import InvoiceModal from '../components/InvoiceModal';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import notify from '../utils/notify';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('CENTERS'); // 'CENTERS', 'INVOICES', 'MONITORING'

  // Centers State
  const [centers, setCenters] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL', 'PENDING', 'APPROVED', 'DISABLED'
  const [selectedCityFilter, setSelectedCityFilter] = useState('ALL');
  const [centerSearchQuery, setCenterSearchQuery] = useState('');
  const [selectedCenterForDocs, setSelectedCenterForDocs] = useState(null);
  const [showDeclModal, setShowDeclModal] = useState(false);

  // Password reset state
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Invoices State
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Monitoring Metrics State
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  useEffect(() => {
    fetchCenters();
    fetchMonitoringMetrics();
  }, []);

  useEffect(() => {
    if (activeTab === 'INVOICES') {
      fetchInvoices();
    } else if (activeTab === 'MONITORING') {
      fetchMonitoringMetrics();
    }
  }, [activeTab]);

  const fetchCenters = async () => {
    setLoadingCenters(true);
    try {
      const res = await axios.get('/api/admin/centers');
      setCenters(res.data || []);
    } catch (err) {
      console.error('Failed to fetch centers:', err);
    } finally {
      setLoadingCenters(false);
    }
  };

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const res = await axios.get('/api/admin/invoices');
      setInvoices(res.data || []);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const fetchMonitoringMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const res = await axios.get('/api/admin/monitoring');
      setMetrics(res.data || null);
    } catch (err) {
      console.error('Failed to fetch monitoring metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleUpdateStatus = async (centerId, newStatus) => {
    try {
      await axios.put(`/api/admin/centers/${centerId}/status`, { status: newStatus });
      notify.success(`Tiffin Center status updated to ${newStatus}`, 'Status Updated');
      fetchCenters();
      fetchMonitoringMetrics();
    } catch (err) {
      notify.error('Failed to update center status.', 'Action Failed');
    }
  };

  const handleUpdateLicense = async (centerId, payload) => {
    try {
      await axios.put(`/api/admin/centers/${centerId}/license`, payload);
      notify.success('Tiffin Center license & expiry updated successfully!', 'License Updated');
      fetchCenters();
      fetchMonitoringMetrics();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to update license.', 'License Error');
    }
  };

  const handleUpdatePassword = async (userId) => {
    if (!newPassword.trim()) {
      notify.warning('Please enter a new password.', 'Password Missing');
      return;
    }
    try {
      await axios.put(`/api/admin/vendors/${userId}/credential`, { password: newPassword });
      notify.success('Vendor login password updated successfully!', 'Credentials Reset');
      setEditingVendorId(null);
      setNewPassword('');
    } catch (err) {
      notify.error('Failed to update vendor password.', 'Reset Failed');
    }
  };

  const handleDeleteCenter = async (centerId) => {
    if (window.confirm('Are you sure you want to permanently delete this Tiffin Center?')) {
      try {
        await axios.delete(`/api/admin/centers/${centerId}`);
        notify.success('Tiffin Center record permanently deleted.', 'Deleted');
        fetchCenters();
        fetchMonitoringMetrics();
      } catch (err) {
        notify.error('Failed to delete center.', 'Delete Failed');
      }
    }
  };

  // Filter Centers by Status, City, and Search Query
  const filteredCenters = centers.filter(c => {
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    const matchesCity = selectedCityFilter === 'ALL' || c.city?.toLowerCase() === selectedCityFilter.toLowerCase();
    
    const q = centerSearchQuery.toLowerCase();
    const matchesSearch = !q ||
      c.centerName?.toLowerCase().includes(q) ||
      c.ownerName?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.area?.toLowerCase().includes(q) ||
      c.aadhaarNo?.includes(q) ||
      c.panNo?.toLowerCase().includes(q);

    return matchesStatus && matchesCity && matchesSearch;
  });

  const pendingCount = centers.filter(c => c.status === 'PENDING').length;
  const approvedCount = centers.filter(c => c.status === 'APPROVED').length;
  const disabledCount = centers.filter(c => c.status === 'DISABLED').length;

  const totalPlatformRevenue = metrics?.totalPlatformRevenue || 0;
  const totalOrdersPlaced = metrics?.totalOrdersPlaced || 0;

  // City Breakdown List
  const cityStats = Array.from(new Set(centers.map(c => c.city).filter(Boolean))).map(city => {
    const cityCenters = centers.filter(c => c.city === city);
    return {
      city,
      count: cityCenters.length
    };
  });

  const filteredInvoices = invoices.filter(inv => {
    const q = invoiceSearch.toLowerCase();
    return (
      inv.orderNumber?.toLowerCase().includes(q) ||
      inv.user?.name?.toLowerCase().includes(q) ||
      inv.user?.phone?.includes(q) ||
      inv.tiffinCenter?.centerName?.toLowerCase().includes(q)
    );
  });

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white p-8 rounded-3xl max-w-md w-full border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Administrator Access Required</h2>
          <p className="text-xs text-slate-500">
            You must be authenticated as an authorized System Administrator to access this control panel.
          </p>
          <Link
            to="/admin/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs transition shadow-md shadow-purple-600/20"
          >
            <Key className="w-4 h-4" /> Authenticate at Admin Portal
          </Link>
          <div>
            <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 underline">
              Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header & Navigation Tabs */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Super Admin Command & Analytics Control</h1>
            <p className="text-xs text-slate-500">Interactive Graphical Metrics, Shop Approvals, License Renewals & Tax Invoices</p>
          </div>
        </div>

        {/* Tab Navigation Pill Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => setActiveTab('CENTERS')}
            className={`flex-shrink-0 sm:flex-1 px-3.5 py-2 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'CENTERS'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-slate-600 hover:text-purple-700'
            }`}
          >
            <Store className="w-4 h-4 flex-shrink-0" /> Centers & Licenses ({centers.length})
          </button>
          <button
            onClick={() => setActiveTab('INVOICES')}
            className={`flex-shrink-0 sm:flex-1 px-3.5 py-2 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'INVOICES'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-slate-600 hover:text-purple-700'
            }`}
          >
            <Receipt className="w-4 h-4 flex-shrink-0" /> End-User Invoices
          </button>
          <button
            onClick={() => setActiveTab('MONITORING')}
            className={`flex-shrink-0 sm:flex-1 px-3.5 py-2 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'MONITORING'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-slate-600 hover:text-purple-700'
            }`}
          >
            <TrendingUp className="w-4 h-4 flex-shrink-0" /> Financial Monitoring
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 📊 INTERACTIVE GRAPHICAL ANALYTICS & METRIC CARDS (CLICK TO JUMP) */}
      {/* =================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* Card 1: Gross Platform Revenue */}
        <button
          onClick={() => setActiveTab('MONITORING')}
          className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-left group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-emerald-100 truncate">Gross Sales</span>
            <div className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-md rounded-xl flex-shrink-0">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black mt-1 sm:mt-2 truncate">₹{totalPlatformRevenue.toFixed(0)}</p>
          <p className="text-[9px] sm:text-[10px] text-emerald-100 font-bold mt-1 flex items-center gap-0.5 truncate">
            Earnings <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </p>
        </button>

        {/* Card 2: Total Partner Centers */}
        <button
          onClick={() => {
            setActiveTab('CENTERS');
            setFilterStatus('ALL');
            setSelectedCityFilter('ALL');
          }}
          className="bg-gradient-to-br from-purple-700 to-indigo-800 text-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-left group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-purple-100 truncate">Partner Shops</span>
            <div className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-md rounded-xl flex-shrink-0">
              <Store className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black mt-1 sm:mt-2 truncate">{centers.length}</p>
          <p className="text-[9px] sm:text-[10px] text-purple-100 font-bold mt-1 flex items-center gap-0.5 truncate">
            All shops <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </p>
        </button>

        {/* Card 3: Pending Verification */}
        <button
          onClick={() => {
            setActiveTab('CENTERS');
            setFilterStatus('PENDING');
          }}
          className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-left group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-amber-100 truncate">Pending</span>
            <div className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-md rounded-xl flex-shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black mt-1 sm:mt-2 truncate">{pendingCount}</p>
          <p className="text-[9px] sm:text-[10px] text-amber-100 font-bold mt-1 flex items-center gap-0.5 truncate">
            Review <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </p>
        </button>

        {/* Card 4: Approved Active Centers */}
        <button
          onClick={() => {
            setActiveTab('CENTERS');
            setFilterStatus('APPROVED');
          }}
          className="bg-gradient-to-br from-teal-600 to-emerald-700 text-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-left group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-teal-100 truncate">Verified</span>
            <div className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-md rounded-xl flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black mt-1 sm:mt-2 truncate">{approvedCount}</p>
          <p className="text-[9px] sm:text-[10px] text-teal-100 font-bold mt-1 flex items-center gap-0.5 truncate">
            Approved <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </p>
        </button>

        {/* Card 5: Expired / Disabled Licenses */}
        <button
          onClick={() => {
            setActiveTab('CENTERS');
            setFilterStatus('DISABLED');
          }}
          className="bg-gradient-to-br from-rose-600 to-pink-700 text-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-left group relative overflow-hidden col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-rose-100 truncate">Disabled</span>
            <div className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-md rounded-xl flex-shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black mt-1 sm:mt-2 truncate">{disabledCount}</p>
          <p className="text-[9px] sm:text-[10px] text-rose-100 font-bold mt-1 flex items-center gap-0.5 truncate">
            Expired <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </p>
        </button>
      </div>

      {/* =================================================================== */}
      {/* 📈 INTERACTIVE VISUAL STATUS DISTRIBUTION GRAPH BAR */}
      {/* =================================================================== */}
      {centers.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-700" /> Interactive Verification Status Distribution Graph
              </h3>
              <p className="text-[11px] text-slate-500">Click on any visual bar segment to filter the dataset instantly below!</p>
            </div>
            <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              Total: {centers.length} Shops Listed
            </span>
          </div>

          {/* Graphical Multi-Segment Progress Bar */}
          <div className="h-6 w-full bg-slate-100 rounded-2xl overflow-hidden flex shadow-inner border border-slate-200">
            {/* Approved Segment */}
            <button
              style={{ width: `${(approvedCount / centers.length) * 100}%` }}
              onClick={() => {
                setActiveTab('CENTERS');
                setFilterStatus('APPROVED');
              }}
              title={`Approved: ${approvedCount} (${Math.round((approvedCount / centers.length) * 100)}%) - Click to Filter`}
              className="bg-emerald-500 hover:bg-emerald-600 transition h-full flex items-center justify-center text-[10px] font-black text-white px-2 truncate cursor-pointer"
            >
              Approved ({Math.round((approvedCount / centers.length) * 100)}%)
            </button>

            {/* Pending Segment */}
            <button
              style={{ width: `${(pendingCount / centers.length) * 100}%` }}
              onClick={() => {
                setActiveTab('CENTERS');
                setFilterStatus('PENDING');
              }}
              title={`Pending: ${pendingCount} (${Math.round((pendingCount / centers.length) * 100)}%) - Click to Filter`}
              className="bg-amber-500 hover:bg-amber-600 transition h-full flex items-center justify-center text-[10px] font-black text-white px-2 truncate cursor-pointer"
            >
              Pending ({Math.round((pendingCount / centers.length) * 100)}%)
            </button>

            {/* Disabled Segment */}
            <button
              style={{ width: `${(disabledCount / centers.length) * 100}%` }}
              onClick={() => {
                setActiveTab('CENTERS');
                setFilterStatus('DISABLED');
              }}
              title={`Disabled: ${disabledCount} (${Math.round((disabledCount / centers.length) * 100)}%) - Click to Filter`}
              className="bg-rose-500 hover:bg-rose-600 transition h-full flex items-center justify-center text-[10px] font-black text-white px-2 truncate cursor-pointer"
            >
              Disabled ({Math.round((disabledCount / centers.length) * 100)}%)
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 1: TIFFIN CENTERS & LICENSE MANAGEMENT */}
      {/* =================================================================== */}
      {activeTab === 'CENTERS' && (
        <div className="space-y-6">
          {/* Filtering & Search Controls */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search Shop Name, Owner, Phone, City, Aadhaar, PAN..."
                  value={centerSearchQuery}
                  onChange={(e) => setCenterSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto">
                {['ALL', 'PENDING', 'APPROVED', 'DISABLED'].map(st => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                      filterStatus === st
                        ? 'bg-purple-700 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'ALL' ? 'All Status' : st}
                  </button>
                ))}

                <button
                  onClick={fetchCenters}
                  className="p-2 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition ml-auto"
                  title="Refresh Dataset"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* City Distribution Filter Badges */}
            {cityStats.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto text-xs">
                <span className="font-bold text-slate-400 flex items-center gap-1 uppercase text-[10px]">
                  <Building2 className="w-3.5 h-3.5" /> Filter By City:
                </span>
                <button
                  onClick={() => setSelectedCityFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-bold ${
                    selectedCityFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All Cities
                </button>
                {cityStats.map(cs => (
                  <button
                    key={cs.city}
                    onClick={() => setSelectedCityFilter(cs.city)}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 ${
                      selectedCityFilter.toLowerCase() === cs.city.toLowerCase()
                        ? 'bg-purple-700 text-white'
                        : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    📍 {cs.city} <span className="bg-white/20 px-1 rounded text-[10px]">{cs.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Centers Table */}
          {loadingCenters ? (
            <div className="py-12 text-center text-slate-500 text-sm">Loading partner records...</div>
          ) : filteredCenters.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center text-slate-500 text-sm border">
              No tiffin centers found matching your filter criteria.
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                      <th className="py-3.5 px-4">Center & Owner</th>
                      <th className="py-3.5 px-4">Contact & Location</th>
                      <th className="py-3.5 px-4">Verification Docs</th>
                      <th className="py-3.5 px-4">License & Expiry Status</th>
                      <th className="py-3.5 px-4">Account Status</th>
                      <th className="py-3.5 px-4 text-right">Actions & License Extend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCenters.map(center => {
                      const isExpired = center.licenseExpiryDate && new Date(center.licenseExpiryDate) < new Date();
                      return (
                        <tr key={center.id} className="hover:bg-slate-50/80 transition">
                          {/* Center & Owner Info */}
                          <td className="py-4 px-4">
                            <p className="font-extrabold text-slate-900 text-sm">{center.centerName}</p>
                            <p className="text-slate-500 flex items-center gap-1 mt-0.5">
                              <Store className="w-3.5 h-3.5 text-orange-500" /> Owner: <strong>{center.ownerName}</strong>
                            </p>
                          </td>

                          {/* Contact & Location */}
                          <td className="py-4 px-4 space-y-1">
                            <p className="font-semibold text-slate-800 flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-slate-400" /> {center.phone}
                            </p>
                            <p className="text-slate-500 flex items-center gap-1 text-[11px]">
                              <MapPin className="w-3.5 h-3.5 text-rose-500" /> {center.area}, {center.city} ({center.pincode})
                            </p>
                          </td>

                          {/* Documents */}
                          <td className="py-4 px-4 space-y-1">
                            <p>
                              <span className="text-slate-400">Aadhaar:</span> <strong>{center.aadhaarNo}</strong>{' '}
                              {center.aadhaarDocUrl && (
                                <a href={center.aadhaarDocUrl} target="_blank" rel="noreferrer" className="text-purple-600 underline font-bold ml-1">
                                  [View Doc]
                                </a>
                              )}
                            </p>
                            <p>
                              <span className="text-slate-400">PAN:</span> <strong>{center.panNo}</strong>{' '}
                              {center.panDocUrl && (
                                <a href={center.panDocUrl} target="_blank" rel="noreferrer" className="text-purple-600 underline font-bold ml-1">
                                  [View Doc]
                                </a>
                              )}
                            </p>
                            <button
                              onClick={() => {
                                setSelectedCenterForDocs(center);
                                setShowDeclModal(true);
                              }}
                              className="text-[11px] text-purple-600 underline font-semibold block"
                            >
                              Inspect Legal Declaration
                            </button>
                          </td>

                          {/* License & Plan Expiry */}
                          <td className="py-4 px-4 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                  center.licenseActive && !isExpired
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {center.licenseActive && !isExpired ? 'ACTIVE LICENSE' : 'EXPIRED / INACTIVE'}
                              </span>
                            </div>
                            <p className="text-slate-600 font-medium text-[11px]">
                              Type: <strong>{center.licenseType || '1 Month Free Trial'}</strong>
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Expires: <strong className={isExpired ? 'text-rose-600 font-extrabold' : 'text-slate-800'}>
                                {center.licenseExpiryDate ? new Date(center.licenseExpiryDate).toLocaleDateString() : 'N/A'}
                              </strong>
                            </p>
                          </td>

                          {/* Account Status Badge */}
                          <td className="py-4 px-4">
                            <span
                              className={`px-3 py-1 rounded-full font-extrabold text-[11px] ${
                                center.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : center.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              ● {center.status}
                            </span>
                          </td>

                          {/* Actions & License Date Increase */}
                          <td className="py-4 px-4 text-right space-y-2">
                            <div className="flex items-center justify-end space-x-1">
                              {center.status !== 'APPROVED' && (
                                <button
                                  onClick={() => handleUpdateStatus(center.id, 'APPROVED')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition"
                                >
                                  Approve
                                </button>
                              )}

                              {center.status === 'APPROVED' && (
                                <button
                                  onClick={() => handleUpdateStatus(center.id, 'DISABLED')}
                                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] transition"
                                >
                                  Disable
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteCenter(center.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Delete Center"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* License Renewal Action Buttons */}
                            <div className="flex items-center justify-end gap-1 flex-wrap">
                              <button
                                onClick={() => handleUpdateLicense(center.id, { active: !center.licenseActive })}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                  center.licenseActive
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {center.licenseActive ? 'Deactivate License' : 'Activate License'}
                              </button>

                              <button
                                onClick={() => handleUpdateLicense(center.id, { extensionMonths: 1, licenseType: 'PAID (1 MONTH)' })}
                                className="px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-800 text-[10px] font-bold rounded border border-purple-300"
                              >
                                +1 Mo Expiry
                              </button>

                              <button
                                onClick={() => handleUpdateLicense(center.id, { extensionMonths: 3, licenseType: 'PAID (3 MONTHS)' })}
                                className="px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-800 text-[10px] font-bold rounded border border-purple-300"
                              >
                                +3 Mo Expiry
                              </button>
                            </div>

                            {/* Password Reset */}
                            <div>
                              {editingVendorId === center.id ? (
                                <div className="flex items-center justify-end gap-1 mt-1">
                                  <input
                                    type="text"
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-28 px-2 py-1 border text-[11px] rounded"
                                  />
                                  <button
                                    onClick={() => handleUpdatePassword(center.user.id)}
                                    className="px-2 py-1 bg-purple-700 text-white text-[10px] font-bold rounded"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingVendorId(null)}
                                    className="text-[10px] text-slate-400"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setEditingVendorId(center.id)}
                                  className="text-[10px] text-purple-700 font-bold hover:underline flex items-center justify-end gap-0.5 ml-auto mt-1"
                                >
                                  <Key className="w-3 h-3" /> Pass Reset
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: END-USER INVOICES MANAGEMENT */}
      {/* =================================================================== */}
      {activeTab === 'INVOICES' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search Invoice #, Customer, Phone, Shop..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={fetchInvoices}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-purple-700 p-2 rounded-xl"
            >
              <RefreshCw className="w-4 h-4" /> Refresh Invoices
            </button>
          </div>

          {loadingInvoices ? (
            <div className="py-12 text-center text-slate-500 text-sm">Loading customer tax invoices...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center text-slate-500 text-sm border">
              No customer invoices found.
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                      <th className="py-3.5 px-4">Invoice # & Date</th>
                      <th className="py-3.5 px-4">Billed Customer</th>
                      <th className="py-3.5 px-4">Tiffin Shop Center</th>
                      <th className="py-3.5 px-4">Item & Plan Type</th>
                      <th className="py-3.5 px-4 text-right">Total Paid Amount</th>
                      <th className="py-3.5 px-4 text-center">Print / View Tax Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-4 px-4 font-mono font-bold text-purple-700">
                          INV-{inv.orderNumber}
                          <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                            {new Date(inv.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-800">{inv.user?.name}</p>
                          <p className="text-slate-500 text-[11px]">{inv.user?.phone}</p>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-700">
                          {inv.tiffinCenter?.centerName}
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-800">{inv.tiffinItem?.title}</p>
                          <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-extrabold rounded-full">
                            {inv.planType} SUBSCRIPTION
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-extrabold text-slate-900 text-sm">
                          ₹{inv.totalAmount?.toFixed(2)}
                          <span className="block text-[10px] font-bold text-emerald-600 uppercase">
                            ✓ PAID VIA {inv.paymentMode}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs rounded-xl transition inline-flex items-center gap-1"
                          >
                            <Printer className="w-3.5 h-3.5" /> View Tax Invoice
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: SHOP FINANCIAL MONITORING & ADVANCED ANALYTICS */}
      {/* =================================================================== */}
      {activeTab === 'MONITORING' && (
        <div className="space-y-6">
          {loadingMetrics || !metrics ? (
            <div className="py-12 text-center text-slate-500 text-sm">Computing shop monitoring metrics...</div>
          ) : (
            <>
              {/* Analytics Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
                  <p className="text-xs text-slate-400 font-bold uppercase">Total Platform Sales</p>
                  <p className="text-2xl font-extrabold text-emerald-600">₹{metrics.totalPlatformRevenue?.toFixed(2)}</p>
                  <p className="text-[11px] text-slate-500">Gross customer billing across all shops</p>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
                  <p className="text-xs text-slate-400 font-bold uppercase">Total Orders Placed</p>
                  <p className="text-2xl font-extrabold text-purple-700">{metrics.totalOrdersPlaced}</p>
                  <p className="text-[11px] text-slate-500">Total customer subscriptions</p>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
                  <p className="text-xs text-slate-400 font-bold uppercase">Active Verified Shops</p>
                  <p className="text-2xl font-extrabold text-sky-600">{metrics.activeCentersCount}</p>
                  <p className="text-[11px] text-slate-500">Out of {metrics.totalTiffinCenters} registered centers</p>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
                  <p className="text-xs text-slate-400 font-bold uppercase">Expired / Inactive Plans</p>
                  <p className="text-2xl font-extrabold text-rose-600">{metrics.expiredCentersCount}</p>
                  <p className="text-[11px] text-slate-500">Needs license renewal date extension</p>
                </div>
              </div>

              {/* Shop-by-Shop Earnings & Monitoring Table */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden space-y-4 p-6">
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-purple-700" /> Individual Shop Financial Monitoring Table
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                        <th className="py-3.5 px-4">Tiffin Shop & Owner</th>
                        <th className="py-3.5 px-4">City</th>
                        <th className="py-3.5 px-4 text-center">Orders Count</th>
                        <th className="py-3.5 px-4 text-right">Shop Revenue Earned</th>
                        <th className="py-3.5 px-4">Plan & Expiry Date</th>
                        <th className="py-3.5 px-4 text-right">License Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {metrics.centerStats?.map(st => (
                        <tr key={st.centerId} className="hover:bg-slate-50/80 transition">
                          <td className="py-4 px-4">
                            <p className="font-extrabold text-slate-900 text-sm">{st.centerName}</p>
                            <p className="text-slate-500 text-[11px]">Owner: {st.ownerName} ({st.phone})</p>
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-700">{st.city}</td>
                          <td className="py-4 px-4 text-center font-bold text-slate-800 text-sm">{st.totalOrdersCount}</td>
                          <td className="py-4 px-4 text-right font-extrabold text-emerald-600 text-sm">₹{st.totalRevenueEarned?.toFixed(2)}</td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${st.isExpired ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                              {st.isExpired ? 'EXPIRED' : 'ACTIVE'}
                            </span>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Expires: <strong>{st.licenseExpiryDate ? new Date(st.licenseExpiryDate).toLocaleDateString() : 'N/A'}</strong>
                            </p>
                          </td>
                          <td className="py-4 px-4 text-right space-x-1">
                            <button
                              onClick={() => handleUpdateLicense(st.centerId, { extensionMonths: 1, licenseType: 'PAID (1 MONTH)' })}
                              className="px-2.5 py-1 bg-purple-600 text-white font-bold text-[10px] rounded-lg shadow-sm hover:bg-purple-700"
                            >
                              +1 Month Expiry
                            </button>
                            <button
                              onClick={() => handleUpdateLicense(st.centerId, { active: !st.licenseActive })}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-lg hover:bg-slate-200"
                            >
                              {st.licenseActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Declaration Inspection Modal */}
      {selectedCenterForDocs && (
        <DeclarationModal
          isOpen={showDeclModal}
          onClose={() => {
            setShowDeclModal(false);
            setSelectedCenterForDocs(null);
          }}
          ownerName={selectedCenterForDocs.ownerName}
          centerName={selectedCenterForDocs.centerName}
          address={selectedCenterForDocs.address}
        />
      )}

      {/* End-User Tax Invoice View / Print Modal */}
      {selectedInvoice && (
        <InvoiceModal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          order={selectedInvoice}
        />
      )}
    </div>
  );
}
