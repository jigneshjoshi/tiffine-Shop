import React, { useState } from 'react';
import axios from 'axios';
import { ShieldCheck, Lock, Mail, Loader2, ArrowLeft, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import notify from '../utils/notify';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/login', { email: email.trim(), password });
      const userData = res.data;

      // Strict role verification for Admin portal
      if (userData.role !== 'ADMIN') {
        const denyMsg = 'Access Denied: This portal is strictly restricted to System Administrators. Please use the standard login.';
        setError(denyMsg);
        notify.error(denyMsg, 'Admin Access Denied');
        return;
      }

      login(userData);
      notify.success(`Super Admin session authenticated. Welcome, ${userData.name}!`, 'Admin Verified');
      navigate('/admin');
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Authentication failed. Please verify admin credentials.';
      setError(errMsg);
      notify.error(errMsg, 'Authentication Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 sm:py-12 px-3 sm:px-4 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100">
      <div className="max-w-md w-full space-y-5 sm:space-y-6">
        {/* Back Link */}
        <div className="flex justify-between items-center text-xs">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-slate-400 hover:text-orange-400 font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Website
          </Link>
          <Link
            to="/login"
            className="text-slate-400 hover:text-white font-semibold transition"
          >
            User Login →
          </Link>
        </div>

        {/* Admin Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-800 space-y-5 sm:space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-600 via-indigo-500 to-orange-500"></div>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-950/80 text-purple-400 border border-purple-800/50 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-purple-900/30">
              <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Admin Security Portal</h2>
            <p className="text-xs text-slate-400">Restricted access control for APKA Tiffine Administrators</p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-400" /> Admin Email ID
              </label>
              <input
                type="email"
                required
                placeholder="admin@apkatiffine.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 focus:border-purple-500 rounded-xl text-sm font-semibold text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/20 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-400" /> Security Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 focus:border-purple-500 rounded-xl text-sm font-semibold text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/20 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold rounded-xl transition shadow-xl shadow-purple-600/30 text-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Verifying Credentials...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" /> Authenticate & Open Dashboard
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800/80 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800/50 rounded-full text-[10px] text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 256-bit Encrypted Session
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
