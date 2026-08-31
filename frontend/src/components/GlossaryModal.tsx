"use client";

import React, { useState } from "react";
import { X, BookOpen, Search, ShieldCheck, Cpu, Database } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlossaryModal({ isOpen, onClose }: GlossaryModalProps) {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<"guide" | "dictionary">("guide");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const terms = [
    {
      category: "financial",
      term: "Probability of Default (PD)",
      desc_th:
        "ความน่าจะเป็นที่ผู้กู้จะไม่สามารถชำระหนี้ได้ตามสัญญาภายในระยะเวลาที่กำหนด (0% - 100%) ค่ายิ่งต่ำยิ่งปลอดภัย เกณฑ์มาตรฐานอนุมัติคือ <= 18.0%",
      desc_en:
        "Probability that a borrower will fail to meet debt contractual obligations within a given timeframe (0% - 100%). Default policy cut-off threshold is <= 18.0%.",
    },
    {
      category: "financial",
      term: "Loss Given Default (LGD)",
      desc_th:
        "สัดส่วนความเสียหายจริงเมื่อเกิดหนี้เสียหลังจากหักการติดตามหนี้และหลักประกันแล้ว (มาตรฐาน 45% ของวงเงินกู้)",
      desc_en:
        "Percentage of total loan exposure lost after default, accounting for collateral recovery and collection costs (industry standard ~45%).",
    },
    {
      category: "financial",
      term: "Point Scorecard (300 - 850)",
      desc_th:
        "คะแนนเครดิตมาตรฐาน FICO แปลงจากค่า Odds ทางคณิตศาสตร์: Score = 487.12 + 28.8539 * ln(Odds). คะแนน 750+ จัดเป็น Super Prime",
      desc_en:
        "FICO-standard scaled credit score converted from odds: Score = 487.12 + 28.8539 * ln(Odds). Scores 750+ represent Super Prime tier.",
    },
    {
      category: "variables",
      term: "EXT_SOURCES_MEAN",
      desc_th:
        "คะแนนประวัติเครดิตเฉลี่ยรวม 3 แหล่งจากสถาบันภายนอก/เครดิตบูโร (ตัวแปรที่มีพลังทำนายความเสี่ยงสูงสุดในโมเดล)",
      desc_en:
        "Composite average score from external credit bureau sources (top protective predictor in Champion LightGBM).",
    },
    {
      category: "variables",
      term: "cash_flow_volatility",
      desc_th:
        "ความผันผวนของกระแสเงินสดหมุนเวียนในบัญชีย้อนหลัง ยิ่งต่ำยิ่งแสดงถึงความสม่ำเสมอของรายได้",
      desc_en:
        "Historical coefficient of variation of monthly cash flows. Lower values indicate stable repayment capacity.",
    },
    {
      category: "governance",
      term: "Population Stability Index (PSI)",
      desc_th:
        "ดัชนีตรวจจับการเปลี่ยนขั้วของประชากร (Data Drift): <0.10 เสถียร, 0.10-0.25 เฝ้าระวัง, >0.25 ต้องรีเทรนโมเดล",
      desc_en:
        "Regulatory metric measuring population score distribution shift: <0.10 Stable, 0.10-0.25 Warning, >0.25 Retrain Trigger.",
    },
    {
      category: "governance",
      term: "TreeSHAP (Explainable AI)",
      desc_th:
        "ทฤษฎีเกมสำหรับคำนวณผลกระทบของแต่ละตัวแปรเพื่อสร้าง Adverse Action Reason Codes ตามมาตรฐาน FCRA / ECOA",
      desc_en:
        "Game-theoretic attribution framework computing exact feature contributions for FCRA/ECOA-compliant Adverse Action Reason Codes.",
    },
  ];

  const filteredTerms = terms.filter((t) => {
    const query = searchQuery.toLowerCase();
    return (
      t.term.toLowerCase().includes(query) ||
      t.desc_th.toLowerCase().includes(query) ||
      t.desc_en.toLowerCase().includes(query)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {lang === "th"
                  ? "คู่มือและพจนานุกรมคำศัพท์การเงิน"
                  : "Financial Glossary & Guide"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Credit Risk Intelligence & Regulatory Compliance Knowledge Base
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex px-6 pt-3 gap-3 border-b border-slate-100 bg-slate-50/60">
          <button
            onClick={() => setActiveTab("guide")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${
              activeTab === "guide"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {lang === "th" ? "🚀 คู่มือการใช้งาน" : "🚀 Quick Guide"}
          </button>
          <button
            onClick={() => setActiveTab("dictionary")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${
              activeTab === "dictionary"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {lang === "th"
              ? "📚 พจนานุกรมคำศัพท์ & ตัวแปร"
              : "📚 Glossary & Variables"}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === "guide" ? (
            <div className="space-y-4 text-sm sm:text-base">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-base sm:text-lg">
                  <ShieldCheck className="w-5 h-5" />
                  <span>
                    {lang === "th"
                      ? "1. ปรับแต่งนโยบายและจำลองกำไร (Tab 1)"
                      : "1. Policy Simulation & Net Profit (Tab 1)"}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  {lang === "th"
                    ? "ปรับเกณฑ์ Cut-off PD, อัตราดอกเบี้ย, และ LGD เพื่อจำลอง Approval Rate, หนี้เสีย (EDR) และ Net Profit สูงสุดแบบ Real-time"
                    : "Tune Cut-off PD, Interest Rate, and LGD sliders to optimize approval rate, expected default rate, and net portfolio return in real time."}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-base sm:text-lg">
                  <Cpu className="w-5 h-5" />
                  <span>
                    {lang === "th"
                      ? "2. ประเมินคะแนนเครดิตรายบุคคล (Tab 2)"
                      : "2. Individual Underwriting (Tab 2)"}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  {lang === "th"
                    ? "ทดสอบผู้กู้เพื่อดูคะแนน Credit Score (300-850), หนังสือแจ้งปฏิเสธ (Reason Codes) และแนวทางปรับปรุง (Recourse)"
                    : "Evaluate applicant creditworthiness (300-850 Score), inspect regulatory Adverse Reason Codes, and simulate Actionable Recourse."}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-700 font-bold text-base sm:text-lg">
                  <Database className="w-5 h-5" />
                  <span>
                    {lang === "th"
                      ? "3. ทดสอบภาวะวิกฤต & Data Drift (Tab 3)"
                      : "3. Stress Testing & Data Drift (Tab 3)"}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  {lang === "th"
                    ? "จำลองวิกฤตเศรษฐกิจเงินเฟ้อ/ดอกเบี้ยพุ่ง เพื่อคำนวณเงินกองทุนสำรองส่วนเพิ่ม (Capital Buffer Delta) และตรวจจับ PSI Drift"
                    : "Simulate economic shocks (rate hikes, stagflation) to calculate Required Capital Buffer Deltas and track data drift via PSI."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    lang === "th"
                      ? "ค้นหาคำศัพท์หรือตัวแปร..."
                      : "Search terms or variables..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-3">
                {filteredTerms.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5"
                  >
                    <div className="text-base font-bold text-blue-700">
                      {t.term}
                    </div>
                    <div className="text-sm text-slate-600 leading-relaxed">
                      {lang === "th" ? t.desc_th : t.desc_en}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            {lang === "th" ? "ปิดหน้าต่าง" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
