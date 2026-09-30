import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, ShieldAlert, Heart, ShieldCheck, LogIn } from 'lucide-react';

export default function Footer({ onOpenDeclaration }) {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 pt-10 sm:pt-14 pb-8 mt-16 sm:mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10 sm:mb-12">
          {/* Brand Col */}
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 text-white">
              <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center shadow-md">
                <Utensils className="w-4 h-4" />
              </div>
              <span className="text-base sm:text-lg font-black tracking-tight">APKA Tiffine Center</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connecting students, workers, and professionals with verified nearby tiffin providers offering fresh home-cooked meals at student-friendly budgets.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-xs font-black uppercase tracking-wider mb-3">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/" className="hover:text-orange-400 transition block py-0.5">Explore Area Tiffins</Link></li>
              <li><Link to="/register-vendor" className="hover:text-orange-400 transition block py-0.5">Register Tiffin Center</Link></li>
              <li><Link to="/register-customer" className="hover:text-orange-400 transition block py-0.5">Customer Sign Up</Link></li>
              <li><Link to="/login" className="hover:text-orange-400 transition flex items-center gap-1 py-0.5"><LogIn className="w-3 h-3" /> Account Login</Link></li>
              <li><Link to="/admin/login" className="hover:text-purple-400 transition flex items-center gap-1 py-0.5"><ShieldCheck className="w-3 h-3 text-purple-400" /> Admin Security Portal</Link></li>
            </ul>
          </div>

          {/* Top Localities */}
          <div>
            <h4 className="text-white text-xs font-black uppercase tracking-wider mb-3">Popular Hubs</h4>
            <ul className="space-y-2 text-xs">
              <li className="py-0.5">Laxmi Nagar, Delhi</li>
              <li className="py-0.5">Mukherjee Nagar, Delhi</li>
              <li className="py-0.5">Kothrud, Pune</li>
              <li className="py-0.5">Koramangala, Bengaluru</li>
              <li className="py-0.5">Malviya Nagar, Jaipur</li>
            </ul>
          </div>

          {/* Legal Undertaking Box */}
          <div className="bg-slate-800/90 p-4 sm:p-5 rounded-2xl border border-slate-700/80 space-y-2.5 shadow-sm">
            <h4 className="text-amber-400 text-xs font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" /> Food Safety Disclaimer
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              All registered Tiffin Centers submit a legally binding Hindi & English declaration taking 100% legal responsibility for food hygiene and quality.
            </p>
            <button
              onClick={onOpenDeclaration}
              className="text-xs text-orange-400 hover:text-orange-300 font-bold underline block pt-1 active:scale-95"
            >
              View Legal Declaration Terms →
            </button>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} APKA Tiffine Center. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Students & Workers
          </p>
        </div>
      </div>
    </footer>
  );
}
