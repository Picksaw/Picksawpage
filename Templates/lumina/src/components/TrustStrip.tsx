import React from 'react';
import { TRUST_DOMAINS } from '../data/content';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export const TrustStrip: React.FC = () => {
  return (
    <div className="relative border-y border-white/10 bg-[#07111F]/70 backdrop-blur-md py-6 overflow-hidden">
      {/* Subtle glowing bar */}
      <div className="absolute top-0 right-1/4 left-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#5DB8FF]/40 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Label */}
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[#7FE7FF]" />
            <span>حوزه‌های خدمات تخصصی لومینا دنتال:</span>
          </div>

          {/* Domains Grid / Row */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-3">
            {TRUST_DOMAINS.map((domain, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-300 hover:text-[#7FE7FF] transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#5DB8FF]" />
                <span>{domain}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};
