import React, { useState } from 'react';
import { FAQ_ITEMS, CLINIC_INFO } from '../data/content';
import { Sparkles, ChevronDown, HelpCircle, PhoneCall, MessageCircle } from 'lucide-react';

interface FAQProps {
  onOpenContact: (topic?: string) => void;
}

export const FAQ: React.FC<FAQProps> = ({ onOpenContact }) => {
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0].id);

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="relative py-24 sm:py-32 overflow-hidden scroll-mt-20">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 right-1/4 w-[38rem] h-[38rem] rounded-full bg-[#5DB8FF]/8 blur-[160px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16 sm:mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-[#5DB8FF]/30 text-xs font-semibold text-[#7FE7FF]">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>پاسخ به پرسش‌های شما</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            سوالات متداول
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            پاسخ به سوالات پرتکرار مراجعان پیرامون مراحل درمان، زمان‌بندی و خدمات لومینا دنتال.
          </p>
        </div>

        {/* Accordion Container */}
        <div className="space-y-4">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? 'bg-gradient-to-b from-white/[0.08] to-white/[0.03] border-[#5DB8FF]/40 shadow-lg shadow-[#5DB8FF]/5'
                    : 'bg-white/[0.03] hover:bg-white/[0.05] border-white/10'
                }`}
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full p-5 sm:p-6 text-right flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-base sm:text-lg font-bold text-white leading-snug">
                    {item.question}
                  </span>
                  
                  <div
                    className={`w-8 h-8 rounded-full border border-white/15 flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-[#5DB8FF]/20 text-[#7FE7FF] border-[#7FE7FF]/40' : 'text-slate-400'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-slate-300 text-sm sm:text-base leading-relaxed border-t border-white/5 animate-fadeIn">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Unresolved question box */}
        <div className="mt-12 p-6 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5DB8FF]/10 border border-[#5DB8FF]/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#7FE7FF]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">سوال دیگری در ذهن دارید؟</h4>
              <p className="text-xs text-slate-400">مشاوران کلینیک در واتس‌اپ و تماس تلفنی آماده پاسخگویی هستند.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <a
              href={`tel:${CLINIC_INFO.phoneRaw}`}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-white/[0.05] hover:bg-white/10 border border-white/10"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#5DB8FF]" />
              <span>تماس مستقیم</span>
            </a>
            <button
              onClick={() => onOpenContact('پاسخ به سوالات')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-[#07111F] bg-[#7FE7FF] hover:bg-[#5DB8FF] transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>پیام در واتس‌اپ</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
