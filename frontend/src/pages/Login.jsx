import React, { useState } from 'react';
import axios from 'axios';
import { LogIn, Key, Mail, ShieldCheck, Loader2, X, CheckCircle2, Lock } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import notify from '../utils/notify';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: Enter email, 2: Enter code & new pass
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [resetError, setResetError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/login', { email: email.trim(), password });
      const userData = res.data;
      login(userData);
      notify.success(`Welcome back, ${userData.name}!`, 'Login Successful');

      // Automatic Role-Based Dashboard Detection & Routing
      if (userData.role === 'ADMIN') {
        navigate('/admin');
      } else if (userData.role === 'VENDOR') {
        navigate('/vendor');
      } else {
        // Customer/User lands directly on redirected checkout page or All Tiffins Explore page
        if (redirectUrl) {
          navigate(redirectUrl);
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid email or password. Please check your credentials.';
      setError(msg);
      notify.error(msg, 'Authentication Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResetCode = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetMsg('');
    setResetLoading(true);

    try {
      const res = await axios.post('/api/auth/forgot-password', { email: resetEmail.trim() });
      const msg = res.data.message || 'Password reset code dispatched to email!';
      setResetMsg(msg);
      notify.success(msg, 'OTP Dispatched');
      setResetStep(2);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send reset code.';
      setResetError(msg);
      notify.error(msg, 'Reset Request Failed');
    } finally {
      setResetLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetMsg('');
    setResetLoading(true);

    try {
      const res = await axios.post('/api/auth/reset-password', {
        email: resetEmail.trim(),
        code: resetCode.trim(),
        newPassword: newPassword
      });
      const msg = res.data.message || 'Password updated successfully!';
      notify.success(msg, 'Password Changed');
      setShowForgotModal(false);
      setEmail(resetEmail);
      setPassword(newPassword);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to reset password.';
      setResetError(msg);
      notify.error(msg, 'Reset Failed');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 px-3 sm:px-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl border border-slate-100 space-y-5 sm:space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <LogIn className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">Sign In to APKA Tiffine</h2>
          <p className="text-xs text-slate-500">Enter your credentials to access your dashboard</p>
        </div>

        {redirectUrl && (
          <div className="p-3.5 bg-orange-50 text-orange-900 text-xs rounded-xl border border-orange-200 font-semibold flex items-center gap-2.5 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-orange-950">Login Required to Complete Order</p>
              <p className="text-[11px] text-orange-700 font-medium">Please sign in to proceed directly to your meal checkout and payment.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-orange-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">Password</label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setResetStep(1);
                  setResetMsg('');
                  setResetError('');
                  setShowForgotModal(true);
                }}
                className="text-[11px] font-bold text-orange-600 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-orange-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition shadow-lg shadow-orange-500/20 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In & Continue'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100 space-y-2">
          <p>
            Don't have an account?{' '}
            <Link to={`/register-customer${location.search}`} className="text-orange-600 font-bold hover:underline">
              Register as Customer
            </Link>
          </p>
          <p>
            Are you a Tiffin Center owner?{' '}
            <Link to="/register-vendor" className="text-amber-600 font-bold hover:underline">
              List Your Center
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative space-y-4 text-slate-800">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b pb-3">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Email Password Reset</h3>
                <p className="text-xs text-slate-500">Send reset code via SMTP email server</p>
              </div>
            </div>

            {resetMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> {resetMsg}
              </div>
            )}

            {resetError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 font-semibold">
                {resetError}
              </div>
            )}

            {resetStep === 1 ? (
              <form onSubmit={handleRequestResetCode} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-700 uppercase mb-1">Registered Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 border rounded-xl text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-5 py-2 bg-orange-600 text-white font-bold rounded-xl shadow-md flex items-center gap-1"
                  >
                    {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-700 uppercase mb-1">Email Reset Code (OTP) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter 6-digit code sent to email"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl font-mono text-center font-bold tracking-widest text-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 uppercase mb-1">New Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new strong password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="text-xs text-slate-500 underline"
                  >
                    ← Change Email
                  </button>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-5 py-2.5 bg-emerald-600 text-white font-extrabold rounded-xl shadow-md flex items-center gap-1"
                  >
                    {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
