import React, { useState } from 'react';
import axios from 'axios';
import { User, Mail, Phone, Lock, ArrowRight, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import notify from '../utils/notify';

export default function RegisterCustomer() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get('redirect');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post('/api/auth/register-user', formData);
      notify.success('Account created successfully! Please sign in to complete your checkout.', 'Registration Completed');
      navigate(`/login${location.search}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(msg);
      notify.error(msg, 'Registration Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 px-3 sm:px-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl border border-slate-100 space-y-5 sm:space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
            <User className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">Create User Account</h2>
          <p className="text-xs text-slate-500">Order fresh daily & monthly tiffins near your PG / Flat</p>
        </div>

        {redirectUrl && (
          <div className="p-3.5 bg-orange-50 text-orange-900 text-xs rounded-xl border border-orange-200 font-semibold flex items-center gap-2.5 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-orange-950">Quick Registration to Order</p>
              <p className="text-[11px] text-orange-700 font-medium">Create your free account to confirm and pay for your selected meal plan.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Rahul Kumar"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              required
              placeholder="e.g. rahul@gmail.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mobile Number</label>
            <input
              type="tel"
              name="phone"
              required
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              placeholder="Create password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition shadow-lg shadow-orange-500/20 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account & Continue'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Already have an account?{' '}
          <Link to={`/login${location.search}`} className="text-orange-600 font-bold hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
