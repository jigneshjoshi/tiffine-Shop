import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, CheckCircle, Utensils, Calendar, Tag, ArrowRight, Eye } from 'lucide-react';

export default function TiffinCard({ item, center, onOrder }) {
  const navigate = useNavigate();
  const isVeg = item.category === 'VEG' || item.category === 'JAIN';

  const handleCardClick = () => {
    navigate(`/tiffin/${item.id}`);
  };

  const handleButtonClick = (e) => {
    e.stopPropagation();
    navigate(`/tiffin/${item.id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-2xl hover:border-orange-200 transition-all duration-300 flex flex-col group h-full cursor-pointer"
    >
      {/* Image Banner */}
      <div className="relative h-48 sm:h-52 w-full bg-slate-100 overflow-hidden flex-shrink-0">
        <img
          src={item.imageUrl || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600'}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600';
          }}
        />
        
        {/* Category Indicator */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-sm border border-white/60">
          <span className={`w-2 h-2 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          <span className={isVeg ? 'text-emerald-700' : 'text-rose-700'}>{item.category}</span>
        </div>

        {/* Meal Type Tag */}
        <div className="absolute top-3 right-3 bg-orange-600/95 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-extrabold shadow-sm tracking-wide">
          {item.mealType?.replace('_', ' ')}
        </div>

        {/* Hover Quick View Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <span className="text-white text-xs font-bold flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
            <Eye className="w-3.5 h-3.5" /> Click to view full details
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Center Name & Area */}
          <div className="flex items-center justify-between text-xs text-slate-500 gap-2 mb-1.5 min-w-0">
            <span className="flex items-center gap-1 font-bold text-slate-700 truncate min-w-0">
              {center?.logoUrl ? (
                <img src={center.logoUrl} alt="" className="w-4 h-4 rounded object-cover flex-shrink-0" />
              ) : (
                <Utensils className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
              )}
              <span className="truncate">{center ? center.centerName : 'Certified Center'}</span>
            </span>
            <span className="flex items-center gap-1 text-slate-500 font-medium flex-shrink-0 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
              <span className="truncate max-w-[90px]">{center ? center.area : 'Local'}</span>
            </span>
          </div>

          {/* Title */}
          <h3 className="font-extrabold text-slate-900 text-base sm:text-lg group-hover:text-orange-600 transition leading-snug line-clamp-2">
            {item.title}
          </h3>

          <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
            {item.description}
          </p>

          {/* Dishes Included */}
          {item.dishes && (
            <div className="bg-slate-50 p-2.5 rounded-xl text-xs text-slate-700 mt-2.5 border border-slate-100">
              <span className="font-black text-slate-800 block mb-0.5 text-[10px] uppercase tracking-wider text-orange-600">Dishes Included:</span>
              <p className="text-slate-600 line-clamp-2 text-[11px] leading-snug">{item.dishes}</p>
            </div>
          )}

          {/* Delivery Timing Badge */}
          <div className="p-2 bg-amber-50/90 rounded-xl border border-amber-200/80 text-[11px] font-bold text-amber-900 flex items-center justify-between mt-2.5">
            <span className="flex items-center gap-1.5 min-w-0">
              <Calendar className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span className="truncate">
                {item.mealType === 'LUNCH'
                  ? '☀️ Lunch Delivery: 12:00 PM – 1:30 PM'
                  : item.mealType === 'DINNER'
                  ? '🌙 Dinner Delivery: 7:00 PM – 8:30 PM'
                  : '🍱 Full Day: Lunch (12 PM) + Dinner (7 PM)'}
              </span>
            </span>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase font-extrabold text-slate-400">Daily Price</p>
              <p className="text-base sm:text-lg font-black text-slate-900">
                ₹{item.pricePerDay} <span className="text-xs font-normal text-slate-500">/day</span>
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] uppercase font-extrabold text-emerald-600 flex items-center justify-end gap-0.5">
                <Tag className="w-3 h-3" /> Monthly Pack
              </p>
              <p className="text-base sm:text-lg font-black text-emerald-600">
                ₹{item.pricePerMonth} <span className="text-xs font-normal text-emerald-700">/mo</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleButtonClick}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-md shadow-orange-500/20 active:scale-[0.98] flex items-center justify-center gap-1.5 group/btn"
          >
            <span>View Full Details & Plan</span>
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
