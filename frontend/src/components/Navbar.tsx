"use client";

import React from "react";
import { Shield, BookOpen, Globe, PieChart, User, Zap, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface NavbarProps {
  activeTab: "policy" | "underwriting" | "stress";
  setActiveTab: (tab: "policy" | "underwriting" | "stress") => void;
  onOpenWelcome: () => void;
  onOpenGlossary: () => void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  onOpenWelcome,
  onOpenGlossary,
}: NavbarProps) {
  const { lang, toggleLang, t } = useLanguage();

  return (
    <header className="border-b border-slate-200 bg-white/95 sticky top-0 z-40 backdrop-blur-md shadow-xs">
      {/* Top Header Row */}
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-600 shadow-md shadow-blue-500/20 text-white">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              {t.appTitle}
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                {t.liveEngine}
              </span>
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Onboarding Guide Button */}
          <button
            onClick={onOpenWelcome}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="hidden md:inline">{t.guideBtn}</span>
          </button>

          {/* Glossary Button */}
          <button
            onClick={onOpenGlossary}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-xs"
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span className="hidden md:inline">{t.glossaryBtn}</span>
          </button>

          {/* TH / EN Language Toggle Pill */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-2 px-3.5 py-2.5 text-sm font-extrabold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all shadow-xs"
          >
            <Globe className="w-4 h-4 text-blue-600" />
            <span>{lang === "th" ? "🇹🇭 TH" : "🇬🇧 EN"}</span>
          </button>
        </div>
      </div>

      {/* 3 Main Tabs Switcher */}
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-8 flex space-x-3 border-t border-slate-100">
        <button
          onClick={() => setActiveTab("policy")}
          className={`flex items-center gap-2 py-3.5 px-5 font-bold text-base border-b-2 transition-all ${
            activeTab === "policy"
              ? "border-blue-600 text-blue-600 bg-blue-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>{t.tab1}</span>
        </button>

        <button
          onClick={() => setActiveTab("underwriting")}
          className={`flex items-center gap-2 py-3.5 px-5 font-bold text-base border-b-2 transition-all ${
            activeTab === "underwriting"
              ? "border-blue-600 text-blue-600 bg-blue-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
          }`}
        >
          <User className="w-4 h-4" />
          <span>{t.tab2}</span>
        </button>

        <button
          onClick={() => setActiveTab("stress")}
          className={`flex items-center gap-2 py-3.5 px-5 font-bold text-base border-b-2 transition-all ${
            activeTab === "stress"
              ? "border-blue-600 text-blue-600 bg-blue-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>{t.tab3}</span>
        </button>
      </div>
    </header>
  );
}
