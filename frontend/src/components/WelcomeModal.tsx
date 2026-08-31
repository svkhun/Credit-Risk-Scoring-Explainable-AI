"use client";

import React from "react";
import { X, Sparkles, PieChart, UserCheck, Zap, ArrowRight, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Banner */}
        <div className="p-6 sm:p-7 border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {t.welcomeTitle}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 mt-1 font-medium leading-relaxed">
                  {t.welcomeSubtitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3 Step Workflow Cards */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-4">
          {/* Step 1 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex gap-4 items-start">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0 mt-0.5">
              <PieChart className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                {t.welcomeStep1Title}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {t.welcomeStep1Desc}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex gap-4 items-start">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 border border-blue-200 shrink-0 mt-0.5">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                {t.welcomeStep2Title}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {t.welcomeStep2Desc}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex gap-4 items-start">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 shrink-0 mt-0.5">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                {t.welcomeStep3Title}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {t.welcomeStep3Desc}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>FCRA / ECOA & Basel III Compliant</span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
          >
            <span>{t.startBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
