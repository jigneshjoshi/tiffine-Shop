import React, { useState } from 'react';
import axios from 'axios';
import { Store, MapPin, Upload, ShieldAlert, CheckCircle2, Navigation, AlertCircle, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DeclarationModal from '../components/DeclarationModal';
import LocationPickerModal from '../components/LocationPickerModal';
import notify from '../utils/notify';

export default function RegisterVendor() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    centerName: '',
    ownerName: '',
    email: '',
    phone: '',
    altPhone: '',
    password: '',
    address: '',
    area: '',
    city: '',
    pincode: '',
    latitude: null,
    longitude: null,
    aadhaarNo: '',
    panNo: '',
    fssaiNo: '',
    declarationAccepted: false
  });

  const [aadhaarDoc, setAadhaarDoc] = useState(null);
  const [panDoc, setPanDoc] = useState(null);
  const [fssaiDoc, setFssaiDoc] = useState(null);
  const [declarationDoc, setDeclarationDoc] = useState(null);

  const [showDeclarationModal, setShowDeclarationModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLocationSelected = (loc) => {
    setFormData(prev => ({
      ...prev,
      address: loc.fullAddress,
      area: loc.area,
      city: loc.city,
      pincode: loc.pincode,
      latitude: loc.latitude,
      longitude: loc.longitude
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.aadhaarNo || formData.aadhaarNo.length < 12) {
      setError('Please enter a valid 12-digit Aadhaar Card number.');
      return;
    }
    if (!formData.panNo || formData.panNo.length < 10) {
      setError('Please enter a valid 10-character PAN Card number.');
      return;
    }
    if (!formData.declarationAccepted) {
      setError('You must accept the Legal Food Safety Declaration to proceed.');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      const vendorBlob = new Blob([JSON.stringify(formData)], { type: 'application/json' });
      data.append('vendor', vendorBlob);

      if (aadhaarDoc) data.append('aadhaarDoc', aadhaarDoc);
      if (panDoc) data.append('panDoc', panDoc);
      if (fssaiDoc) data.append('fssaiDoc', fssaiDoc);
      if (declarationDoc) data.append('declarationDoc', declarationDoc);

      const response = await axios.post('/api/auth/register-vendor', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      notify.success('Tiffin Center registered successfully! Awaiting Admin verification.', 'Application Submitted');
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please check details and try again.';
      setError(msg);
      notify.error(msg, 'Registration Failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 text-center space-y-5">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Registration Submitted!</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your Tiffin Center <strong>"{formData.centerName}"</strong> has been successfully registered. Our admin team will verify your uploaded Aadhaar, PAN, and Legal Declaration documents shortly.
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-500 border border-slate-200 text-left space-y-1">
            <p><strong>Status:</strong> <span className="text-amber-600 font-bold">PENDING APPROVAL</span></p>
            <p><strong>Registered Phone:</strong> {formData.phone}</p>
            <p><strong>Email:</strong> {formData.email}</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 text-sm transition"
          >
            Go to Login Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-3 sm:px-6">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-4 sm:p-7 md:p-8 text-white">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 sm:p-2.5 bg-white/20 backdrop-blur-md rounded-xl flex-shrink-0">
              <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black">Register Your Tiffin Center</h1>
              <p className="text-xs sm:text-sm text-orange-100 font-medium">Grow your business & reach hundreds of local students & workers</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-7 md:p-8 space-y-6 sm:space-y-8">
          {error && (
            <div className="p-4 bg-rose-50 text-rose-700 text-sm rounded-2xl border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Personal & Center Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-orange-600 border-b border-slate-100 pb-2">
              1. Center & Owner Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tiffin Center Name *</label>
                <input
                  type="text"
                  name="centerName"
                  required
                  placeholder="e.g. Maa Ki Rasoi Tiffin Services"
                  value={formData.centerName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Owner Full Name *</label>
                <input
                  type="text"
                  name="ownerName"
                  required
                  placeholder="e.g. Sunita Sharma"
                  value={formData.ownerName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mobile Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="e.g. 9811223344"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Alternate Phone (Optional)</label>
                <input
                  type="tel"
                  name="altPhone"
                  placeholder="e.g. 9876543210"
                  value={formData.altPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address (Login ID) *</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="e.g. sunita@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Account Password *</label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Create strong password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Address & Reverse Geocoding Location */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-orange-600">
                2. Location & Address Details
              </h3>
              <button
                type="button"
                onClick={() => setShowLocationModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold rounded-xl border border-orange-200 transition"
              >
                <Navigation className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                <span>📍 Set My Shop Location Automatically</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Area / Locality *</label>
                <input
                  type="text"
                  name="area"
                  required
                  placeholder="e.g. Laxmi Nagar"
                  value={formData.area}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  required
                  placeholder="e.g. Delhi"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pincode *</label>
                <input
                  type="text"
                  name="pincode"
                  required
                  placeholder="e.g. 110092"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Street Address *</label>
              <textarea
                name="address"
                rows="2"
                required
                placeholder="House No, Landmark, Street Name..."
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500"
              ></textarea>
            </div>
          </div>

          {/* Section 3: Identity & KYC Verification Documents */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-orange-600 border-b border-slate-100 pb-2">
              3. Government ID & Verification Documents
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Aadhaar Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase">
                  Aadhaar Card Number * <span className="text-rose-600">(Mandatory)</span>
                </label>
                <input
                  type="text"
                  name="aadhaarNo"
                  required
                  maxLength="12"
                  placeholder="12 Digit Aadhaar Number"
                  value={formData.aadhaarNo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                />
                <div>
                  <span className="block text-[11px] text-slate-500 mb-1">Upload Aadhaar Photo/PDF</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setAadhaarDoc(e.target.files[0])}
                    className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 cursor-pointer"
                  />
                </div>
              </div>

              {/* PAN Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase">
                  PAN Card Number * <span className="text-rose-600">(Mandatory)</span>
                </label>
                <input
                  type="text"
                  name="panNo"
                  required
                  maxLength="10"
                  placeholder="10 Character PAN Number"
                  value={formData.panNo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold uppercase"
                />
                <div>
                  <span className="block text-[11px] text-slate-500 mb-1">Upload PAN Photo/PDF</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setPanDoc(e.target.files[0])}
                    className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Optional Food License FSSAI */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase">
                  Food License Certificate / FSSAI No. <span className="text-slate-400 font-normal">(Optional - Not Mandatory)</span>
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="fssaiNo"
                  placeholder="FSSAI Registration No. (If available)"
                  value={formData.fssaiNo}
                  onChange={handleChange}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                />
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFssaiDoc(e.target.files[0])}
                  className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Legal Food Quality Declaration (Hindi & English) */}
          <div className="space-y-4 bg-amber-50/70 p-6 rounded-2xl border border-amber-200">
            <div className="flex items-start space-x-3">
              <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-900 text-base">
                  Legal Undertaking & Sole Quality Liability (Hindi & English)
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  The tiffin center owner agrees that food safety and quality are 100% their own legal & criminal responsibility. Any food contamination, illness, or legal penalty (up to imprisonment) is strictly born by the vendor. The website owner holds zero liability.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDeclarationModal(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 hover:underline"
                >
                  <FileText className="w-4 h-4" /> View Full Legal Declaration Form (Hindi/English) →
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-amber-200/80 space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="declarationAccepted"
                  checked={formData.declarationAccepted}
                  onChange={handleChange}
                  className="w-5 h-5 text-orange-600 rounded border-slate-300 focus:ring-orange-500 mt-0.5"
                />
                <span className="text-xs font-bold text-slate-900 leading-normal">
                  I solemnly declare that I have read, signed, and accept the food quality legal undertaking in both Hindi & English, accepting full legal responsibility.
                </span>
              </label>

              <div>
                <span className="block text-[11px] font-bold text-slate-700 mb-1">
                  Upload Signed Declaration Form / Digital Signature Copy (Optional)
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setDeclarationDoc(e.target.files[0])}
                  className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-200 file:text-amber-900 hover:file:bg-amber-300 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-base rounded-2xl transition shadow-xl shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Submitting Partner Registration...
                </>
              ) : (
                <>
                  <span>Submit Tiffin Center Registration</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modals */}
      <DeclarationModal
        isOpen={showDeclarationModal}
        onClose={() => setShowDeclarationModal(false)}
        ownerName={formData.ownerName}
        centerName={formData.centerName}
        address={formData.address}
      />

      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelectLocation={handleLocationSelected}
      />
    </div>
  );
}
