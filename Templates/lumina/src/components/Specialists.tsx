import React from 'react';
import { SPECIALISTS_DATA } from '../data/content';
import { Specialist } from '../types';
import { Sparkles, CheckCircle2, Quote, Clock, MessageCircle } from 'lucide-react';

interface SpecialistsProps {
  onOpenContactWithDoctor: (doctor: Specialist) => void;
}

export const Specialists: React.FC<SpecialistsProps> = ({ onOpenContactWithDoctor }) => {
  return (
    <section id="specialists" className="relative py-24 sm:py-32 bg-[#060e1a] overflow-hidden scroll-mt-20">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 right-0 w-96 h-96 rounded-full bg-[#5DB8FF]/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 rounded-full bg-[#7FE7FF]/10 blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-[#5DB8FF]/30 text-xs font-semibold text-[#7FE7FF]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>کادر درمان و بورد تخصصی</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            تخصصی که می‌توانید به آن اعتماد کنید.
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            تیمی متعهد از متخصصان با سال‌ها تجربه بالینی در حوزه‌های تخصصی زیبایی، ایمپلنت و ارتودنسی.
          </p>

          {/* Template Clarification Badge */}
          <div className="inline-block pt-1">
            <span className="text-[11px] font-medium text-slate-400 bg-white/[0.03] border border-white/5 px-3.5 py-1 rounded-full">
              * پزشکان معرفی‌شده در این بخش به عنوان نمونه دمو در قالب لومینا دنتال طراحی شده‌اند.
            </span>
          </div>
        </div>

        {/* 3 Doctor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SPECIALISTS_DATA.map((doctor) => (
            <div
              key={doctor.id}
              className="group relative rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 hover:border-[#5DB8FF]/40 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:-translate-y-2 shadow-xl hover:shadow-[0_20px_50px_rgba(7,17,31,0.9),0_0_30px_rgba(93,184,255,0.2)] flex flex-col justify-between"
            >
              
              {/* Doctor Portrait Container with Aspect Ratio */}
              <div className="relative w-full aspect-[4/4.5] overflow-hidden bg-[#091524]">
                <img
                  src={doctor.image}
                  alt={doctor.name}
                  className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Dark gradient fade over portrait */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#07111F] via-[#07111F]/20 to-transparent" />

                {/* Experience Badge overlay */}
                <div className="absolute top-4 right-4 px-3 py-1 rounded-xl bg-[#07111F]/80 backdrop-blur-md border border-white/15 text-xs font-semibold text-[#7FE7FF]">
                  {doctor.experience}
                </div>

                {/* Floating quote preview on image bottom */}
                <div className="absolute bottom-3 inset-x-4 p-3 rounded-xl bg-[#07111F]/80 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <div className="flex items-start gap-2">
                    <Quote className="w-4 h-4 text-[#7FE7FF] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-200 leading-snug line-clamp-2">
                      {doctor.quote}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                <div>
                  {/* Name & Role */}
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 group-hover:text-[#7FE7FF] transition-colors">
                    {doctor.name}
                  </h3>

                  <p className="text-xs sm:text-sm font-semibold text-[#5DB8FF] mb-2">
                    {doctor.role}
                  </p>

                  <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                    {doctor.degree}
                  </p>

                  {/* Specialty Bullet Points */}
                  <div className="space-y-2 mb-6 pt-3 border-t border-white/10">
                    <span className="text-[11px] font-bold text-slate-300 block mb-1">
                      زمینه‌های تمرکز بالینی:
                    </span>
                    {doctor.specialtyAreas.map((spec, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#7FE7FF] shrink-0" />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>

                  {/* Clinic Presence Days */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-6 bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
                    <Clock className="w-3.5 h-3.5 text-[#5DB8FF] shrink-0" />
                    <span>روزهای حضور: <strong className="text-slate-200 font-semibold">{doctor.days}</strong></span>
                  </div>
                </div>

                {/* Card Action */}
                <button
                  onClick={() => onOpenContactWithDoctor(doctor)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-slate-200 hover:text-[#07111F] bg-white/[0.05] hover:bg-gradient-to-l hover:from-[#5DB8FF] hover:to-[#7FE7FF] border border-white/10 hover:border-transparent transition-all duration-300 shadow-md cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>مشاوره و هماهنگی نوبت با {doctor.name}</span>
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
