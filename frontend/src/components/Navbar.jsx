import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Utensils, MapPin, User, LogOut, ShieldCheck, Store, ShoppingBag, Menu, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import notify from '../utils/notify';

export default function Navbar({ selectedArea, onOpenLocationModal }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    notify.info('You have safely signed out.', 'Signed Out');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2 group flex-shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
            <Utensils className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="leading-tight">
            <span className="text-base sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-0.5 sm:gap-1">
              APKA <span className="text-orange-600">Tiffine</span>
            </span>
            <span className="block text-[8px] sm:text-[10px] text-slate-500 font-bold tracking-wider uppercase">
              Fresh • Affordable
            </span>
          </div>
        </Link>

        {/* Location Picker Trigger (Adaptive & Compact for Phone / Tab / Desktop) */}
        <button
          onClick={onOpenLocationModal}
          className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-full text-[11px] sm:text-xs font-bold border border-orange-200/80 transition max-w-[120px] xs:max-w-[150px] sm:max-w-[220px] md:max-w-none shadow-sm active:scale-95"
          title="Change Delivery Area"
        >
          <MapPin className="w-3.5 h-3.5 text-orange-600 animate-bounce flex-shrink-0" />
          <span className="truncate">{selectedArea ? selectedArea : 'Select Area'}</span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-3 lg:space-x-4">
          <Link
            to="/"
            className="text-xs lg:text-sm font-bold text-slate-700 hover:text-orange-600 transition px-2 py-1"
          >
            Explore Tiffins
          </Link>

          {!user ? (
            <div className="flex items-center space-x-2">
              <Link
                to="/register-vendor"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-orange-200 bg-orange-50/60 hover:bg-orange-100 text-orange-700 text-xs font-bold rounded-xl transition"
              >
                <Store className="w-4 h-4" /> Partner / List Center
              </Link>
              <Link
                to="/login"
                className="text-xs font-bold text-slate-700 hover:text-orange-600 px-3 py-1.5 rounded-xl transition"
              >
                Sign In
              </Link>
              <Link
                to="/register-customer"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-orange-500/20"
              >
                Get Started
              </Link>
            </div>
          ) : (
            <div className="flex items-center space-x-2 lg:space-x-3">
              {user.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold rounded-xl hover:bg-purple-100 transition"
                >
                  <ShieldCheck className="w-4 h-4" /> Admin Portal
                </Link>
              )}

              {user.role === 'VENDOR' && (
                <Link
                  to="/vendor"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-xl hover:bg-amber-100 transition"
                >
                  <Store className="w-4 h-4" /> Vendor Portal
                </Link>
              )}

              {user.role === 'USER' && (
                <Link
                  to="/customer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl hover:bg-emerald-100 transition"
                >
                  <ShoppingBag className="w-4 h-4" /> My Orders
                </Link>
              )}

              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-xl object-cover border border-orange-200 shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center border border-orange-200 shadow-sm">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-xs font-bold text-slate-700 max-w-[90px] lg:max-w-[120px] truncate">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition touch-target flex items-center justify-center"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu (Smooth & Responsive) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between text-sm font-bold text-slate-800 hover:text-orange-600 py-2.5 border-b border-slate-100"
          >
            <span>🍱 Explore All Tiffins</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>

          {!user ? (
            <div className="space-y-2.5 pt-1">
              <Link
                to="/register-vendor"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-orange-50 text-orange-700 font-bold text-xs rounded-xl border border-orange-200"
              >
                <Store className="w-4 h-4" /> Register Tiffin Center (Vendor)
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center bg-slate-100 text-slate-800 font-bold text-xs rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  to="/register-customer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Get Started
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              {/* User Profile Card */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  {user.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt={user.name}
                      className="w-8 h-8 rounded-lg object-cover border border-slate-300 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center flex-shrink-0">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-slate-900">{user.name}</p>
                    <span className="text-[10px] text-slate-500 uppercase font-extrabold">{user.role}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-rose-600 font-bold text-xs flex items-center gap-1 px-2.5 py-1.5 hover:bg-rose-50 rounded-lg transition"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>

              {user.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  <ShieldCheck className="w-4 h-4" /> Open Admin Portal
                </Link>
              )}

              {user.role === 'VENDOR' && (
                <Link
                  to="/vendor"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  <Store className="w-4 h-4" /> Open Vendor Dashboard
                </Link>
              )}

              {user.role === 'USER' && (
                <Link
                  to="/customer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  <ShoppingBag className="w-4 h-4" /> View My Orders & Invoices
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
