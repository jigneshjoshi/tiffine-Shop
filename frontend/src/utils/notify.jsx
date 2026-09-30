import toast from 'react-hot-toast';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, BellRing, Utensils } from 'lucide-react';
import React from 'react';

/**
 * Enterprise Grade Notification Manager for APKA Tiffine Center
 * Powered by react-hot-toast with custom Tailwind UI designs.
 */
export const notify = {
  success: (message, title = 'Success') => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-emerald-500/20 border border-emerald-100 p-4 transform transition-all duration-300`}
        >
          <div className="flex items-start space-x-3 w-full">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-xs font-extrabold text-slate-900">{title}</p>
              <p className="mt-0.5 text-xs text-slate-600 font-medium leading-relaxed">{message}</p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      ),
      { duration: 4000 }
    );
  },

  error: (message, title = 'Error') => {
    const errorText = typeof message === 'string' ? message : message?.message || 'An unexpected error occurred.';
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-rose-500/20 border border-rose-200 p-4 transform transition-all duration-300`}
        >
          <div className="flex items-start space-x-3 w-full">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-xs font-extrabold text-rose-900">{title}</p>
              <p className="mt-0.5 text-xs text-rose-700 font-medium leading-relaxed">{errorText}</p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  },

  warning: (message, title = 'Attention') => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-amber-500/20 border border-amber-200 p-4 transform transition-all duration-300`}
        >
          <div className="flex items-start space-x-3 w-full">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-xs font-extrabold text-amber-900">{title}</p>
              <p className="mt-0.5 text-xs text-amber-800 font-medium leading-relaxed">{message}</p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  },

  info: (message, title = 'Notice') => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-blue-500/20 border border-blue-200 p-4 transform transition-all duration-300`}
        >
          <div className="flex items-start space-x-3 w-full">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Info className="w-5 h-5" />
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-xs font-extrabold text-slate-900">{title}</p>
              <p className="mt-0.5 text-xs text-slate-600 font-medium leading-relaxed">{message}</p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      ),
      { duration: 4000 }
    );
  },

  orderAlert: (order) => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-bounce' : 'animate-leave'
          } max-w-md w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-2xl rounded-2xl pointer-events-auto p-4 border border-orange-400 flex items-center justify-between transform transition-all duration-300`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <BellRing className="w-5 h-5 animate-wiggle" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-orange-100">🎉 New Order Placed!</p>
              <p className="text-xs font-bold">Order #{order.orderNumber} • ₹{order.totalAmount}</p>
              <p className="text-[10px] text-orange-200">{order.user?.name || 'Customer'} • {order.planType} Plan</p>
            </div>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition text-xs font-bold"
          >
            ✕
          </button>
        </div>
      ),
      { duration: 7000 }
    );
  }
};

export default notify;
