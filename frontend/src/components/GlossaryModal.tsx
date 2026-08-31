"use client";

import React, { useState } from "react";
import { X, BookOpen, Search, ShieldCheck, Cpu, Database } from "lucide-react";

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlossaryModal({ isOpen, onClose }: GlossaryModalProps) {
  const [activeTab, setActiveTab] = useState<"guide" | "dictionary">("guide");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const terms = [
    {
      category: "financial",
      term: "Probability of Default (PD)",
      desc_th:
        "ความน่าจะเป็นที่ผู้กู้จะไม่สามารถชำระหนี้ได้ตามสัญญาภายในระยะเวลาที่กำหนด (0% - 100%) ค่ายิ่งต่ำยิ่งปลอดภัย เกณฑ์มาตรฐานอนุมัติคือ <= 18.0%",
    },
    {
      category: "financial",
      term: "Loss Given Default (LGD)",
      desc_th:
        "สัดส่วนความเสียหายจริงเมื่อเกิดหนี้เสียหลังจากหักการติดตามหนี้และหลักประกันแล้ว (มาตรฐาน 45% ของวงเงินกู้)",
    },
    {
      category: "financial",
      term: "Point Scorecard (300 - 850)",
      desc_th:
        "คะแนนเครดิตมาตรฐาน FICO แปลงจากค่า Odds ทางคณิตศาสตร์: Score = 487.12 + 28.8539 * ln(Odds). คะแนน 750+ จัดเป็น Super Prime",
    },
    {
      category: "variables",
      term: "EXT_SOURCES_MEAN",
      desc_th:
        "คะแนนประวัติเครดิตเฉลี่ยรวม 3 แหล่งจากสถาบันภายนอก/เครดิตบูโร (ตัวแปรที่มีพลังทำนายความเสี่ยงสูงสุดในโมเดล)",
    },
    {
      category: "variables",
      term: "cash_flow_volatility",
      desc_th:
        "ความผันผวนของกระแสเงินสดหมุนเวียนในบัญชีย้อนหลัง ยิ่งต่ำยิ่งแสดงถึงความสม่ำเสมอของรายได้",
    },
    {
      category: "governance",
      term: "Population Stability Index (PSI)",
      desc_th:
        "ดัชนีตรวจจับการเปลี่ยนขั้วของประชากร (Data Drift): <0.10 เสถียร, 0.10-0.25 เฝ้าระวัง, >0.25 ต้องรีเทรนโมเดล",
    },
    {
      category: "governance",
      term: "TreeSHAP (Explainable AI)",
      desc_th:
        "ทฤษฎีเกมสำหรับคำนวณผลกระทบของแต่ละตัวแปรเพื่อสร้าง Adverse Action Reason Codes ตามมาตรฐาน FCRA / ECOA",
    },
  ];

  const filteredTerms = terms.filter(
    (t) =>
      t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.desc_th.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                คู่มือและพจนานุกรมศัพท์ (Guide & Financial Glossary)
              </h2>
              <p className="text-xs text-slate-400">
                Credit Risk Intelligence & Regulatory Compliance Knowledge Base
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex px-6 pt-4 gap-2 border-b border-slate-800/80 bg-slate-900/50">
          <button
            onClick={() => setActiveTab("guide")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${
              activeTab === "guide"
                ? "border-sky-400 text-sky-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            🚀 คู่มือเริ่มต้นใช้งาน (Quick Guide)
          </button>
          <button
            onClick={() => setActiveTab("dictionary")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${
              activeTab === "dictionary"
                ? "border-sky-400 text-sky-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            📚 พจนานุกรมคำศัพท์ & ตัวแปร (Dictionary)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === "guide" ? (
            <div className="space-y-4 text-sm">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                  <ShieldCheck className="w-5 h-5" />
                  <span>1. กรอกข้อมูลหรือเลือก Quick Preset</span>
                </div>
                <p className="text-slate-300">
                  ปรับแต่งตัวเลขวงเงินกู้ ค่างวดต่อเดือน อายุ และคะแนนภายนอก หรือคลิกปุ่ม <b>"👤 Prime Applicant"</b> / <b>"⚠️ Subprime Applicant"</b> เพื่อทดสอบโปรไฟล์ความเสี่ยงทันที
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-base">
                  <Cpu className="w-5 h-5" />
                  <span>2. ตรวจสอบคะแนน Credit Score & เกณฑ์อนุมัติ</span>
                </div>
                <p className="text-slate-300">
                  ระบบจะคำนวณคะแนน 300–850 Scale และ Probability of Default (PD) แบบ Real-time ผ่าน Champion LightGBM Model
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                  <Database className="w-5 h-5" />
                  <span>3. เหตุผลการปฏิเสธ (Adverse Notice) & ทางเลือก (Recourse)</span>
                </div>
                <p className="text-slate-300">
                  หากใบสมัครถูกปฏิเสธ ระบบจะสร้าง <b>Regulatory Reason Codes</b> พร้อมตาราง <b>Actionable Counterfactual Recourse</b> เพื่อบอกผู้กู้ว่าต้องปรับวงเงินหรือค่างวดอย่างไรจึงจะผ่านเกณฑ์
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="ค้นหาคำศัพท์หรือตัวแปร..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-3">
                {filteredTerms.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1"
                  >
                    <div className="text-sm font-bold text-sky-400">
                      {t.term}
                    </div>
                    <div className="text-xs text-slate-300 leading-relaxed">
                      {t.desc_th}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
