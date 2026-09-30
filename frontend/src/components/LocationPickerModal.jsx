import React, { useState } from 'react';
import { MapPin, Navigation, Check, Loader2, X, Search, Info } from 'lucide-react';
import axios from 'axios';

export default function LocationPickerModal({ isOpen, onClose, onSelectLocation }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detectedData, setDetectedData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  if (!isOpen) return null;

  const handleDetectLocation = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Please search your area manually below.');
      setLoading(false);
      return;
    }

    // High accuracy GPS options for exact satellite/device precision
    const geoOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        try {
          // OpenStreetMap Nominatim Reverse Geocoding API with max zoom level
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );

          const address = response.data.address || {};

          // Extract most granular local shop, landmark, suburb or road name
          const area = address.suburb ||
                       address.neighbourhood ||
                       address.quarter ||
                       address.residential ||
                       address.village ||
                       address.hamlet ||
                       address.shop ||
                       address.amenity ||
                       address.road ||
                       address.subdistrict ||
                       address.city_district ||
                       'Local Area';

          const city = address.city || address.town || address.municipality || address.village || address.state_district || address.county || 'City';
          const pincode = address.postcode || '';

          const streetOrRoad = address.road || address.pedestrian || address.suburb || '';
          const state = address.state || '';

          const fullAddressParts = [area, streetOrRoad, city, state, pincode].filter(Boolean);
          const fullAddress = response.data.display_name || fullAddressParts.join(', ');

          const result = {
            latitude,
            longitude,
            accuracy,
            area,
            city,
            pincode,
            fullAddress
          };

          setDetectedData(result);
          setLoading(false);
        } catch (err) {
          const fallback = {
            latitude,
            longitude,
            accuracy,
            area: 'Detected GPS Region',
            city: 'Local City',
            pincode: '',
            fullAddress: `GPS Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          };
          setDetectedData(fallback);
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        setError('GPS permission denied or low signal. Browsers on Desktop/PC often use IP location which can be approximate. Please search your area manually below.');
      },
      geoOptions
    );
  };

  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&countrycodes=in&limit=5`
      );
      setSearchResults(res.data || []);
    } catch (err) {
      console.error('Search location error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSearchResult = (item) => {
    const address = item.address || {};
    const area = address.suburb || address.neighbourhood || address.quarter || address.residential || address.village || address.road || searchQuery;
    const city = address.city || address.town || address.municipality || address.state_district || 'City';
    const pincode = address.postcode || '';

    const selected = {
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      area,
      city,
      pincode,
      fullAddress: item.display_name
    };

    setDetectedData(selected);
    setSearchResults([]);
  };

  const handleConfirm = () => {
    if (detectedData) {
      onSelectLocation(detectedData);
      onClose();
    }
  };

  const handleFieldChange = (field, val) => {
    setDetectedData(prev => ({
      ...prev,
      [field]: val
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-100 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 sm:p-3 bg-orange-100 text-orange-600 rounded-2xl flex-shrink-0">
            <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">Set Delivery Location</h3>
            <p className="text-xs text-slate-500 font-medium">Auto-detect GPS or search your exact locality</p>
          </div>
        </div>

        {/* Informational Hint about Desktop IP vs GPS */}
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] rounded-2xl space-y-1 mb-4 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Why GPS location might differ:</strong> Desktop & Wi-Fi internet routers use ISP location towers which can sometimes be 2-5 km away. For 100% accurate tiffin delivery, auto-detect or search your exact colony name below!
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-100 font-medium">
            {error}
          </div>
        )}

        {/* Search Locality Bar */}
        <form onSubmit={handleSearchLocation} className="mb-4 space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase">Search Colony / Area / Landmark</label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Type area (e.g. Laxmi Nagar, Harmada, Kothrud)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow disabled:opacity-50"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </div>
        </form>

        {/* Search Results Dropdown List */}
        {searchResults.length > 0 && (
          <div className="mb-4 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden text-xs divide-y divide-slate-200 max-h-40 overflow-y-auto">
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSearchResult(item)}
                className="w-full text-left p-2.5 hover:bg-orange-50 hover:text-orange-700 font-medium transition flex items-start gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">{item.display_name}</span>
              </button>
            ))}
          </div>
        )}

        {detectedData ? (
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 mb-5 text-xs">
            <div className="flex items-center justify-between font-bold text-emerald-700">
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-emerald-600" /> Location Selected!</span>
              {detectedData.accuracy && (
                <span className="text-[10px] text-slate-500 font-mono font-normal">GPS ±{Math.round(detectedData.accuracy)}m</span>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Local Area / Suburb / Colony *</label>
              <input
                type="text"
                value={detectedData.area}
                onChange={(e) => handleFieldChange('area', e.target.value)}
                placeholder="e.g. Laxmi Nagar / Harmada / Kothrud"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">City *</label>
                <input
                  type="text"
                  value={detectedData.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Pincode *</label>
                <input
                  type="text"
                  value={detectedData.pincode}
                  onChange={(e) => handleFieldChange('pincode', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Complete House / PG / Street Address *</label>
              <textarea
                rows="2"
                value={detectedData.fullAddress}
                onChange={(e) => handleFieldChange('fullAddress', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-orange-500 outline-none"
              ></textarea>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <button
              onClick={handleDetectLocation}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-xl transition shadow-lg shadow-orange-500/20 disabled:opacity-50 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Detecting Satellite GPS Location...
                </>
              ) : (
                <>
                  <Navigation className="w-5 h-5" /> 📍 Auto-Detect GPS Location
                </>
              )}
            </button>
          </div>
        )}

        {detectedData && (
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={() => setDetectedData(null)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
            >
              Re-Detect
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition shadow-md shadow-emerald-600/20"
            >
              Confirm Delivery Area
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
