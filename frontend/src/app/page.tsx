"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  BookOpen,
  ArrowRight,
  UserCheck,
  UserX,
  Briefcase,
  Sliders,
  Sparkles,
  AlertCircle,
  Activity,
  TrendingUp,
  Percent,
  DollarSign,
  AlertTriangle,
  Layers,
  Zap,
  User,
  PieChart,
  Flame,
} from "lucide-react";
import {
  ApplicantPayload,
  ScoringResponse,
  PolicySimResponse,
  StressScenarioResponse,
  evaluateApplicant,
  simulatePolicy,
  fetchStressScenarios,
} from "@/lib/api";
import { ScoreGauge } from "@/components/ScoreGauge";
import { AdverseNotice } from "@/components/AdverseNotice";
import { RecourseTable } from "@/components/RecourseTable";
import { AuditTrail } from "@/components/AuditTrail";
import { GlossaryModal } from "@/components/GlossaryModal";

// Presets for Tab 2
const PRESETS: Record<string, { label: string; icon: any; data: ApplicantPayload }> = {
  prime: {
    label: "👤 Prime Profile (Low Risk)",
    icon: UserCheck,
    data: {
      AMT_CREDIT: 250000,
      AMT_ANNUITY: 11500,
      AMT_GOODS_PRICE: 220000,
      DAYS_BIRTH: -18250, // ~50 years old
      CODE_GENDER: "F",
      EXT_SOURCES_MEAN: 0.78,
      EXT_SOURCE_3: 0.75,
      BURO_DAYS_CREDIT_MAX: -60,
      cash_flow_volatility: 0.12,
    },
  },
  subprime: {
    label: "⚠️ Subprime Profile (High Risk)",
    icon: UserX,
    data: {
      AMT_CREDIT: 650000,
      AMT_ANNUITY: 42000,
      AMT_GOODS_PRICE: 600000,
      DAYS_BIRTH: -9125, // ~25 years old
      CODE_GENDER: "M",
      EXT_SOURCES_MEAN: 0.16,
      EXT_SOURCE_3: 0.18,
      BURO_DAYS_CREDIT_MAX: -12,
      cash_flow_volatility: 0.48,
    },
  },
  freelancer: {
    label: "💼 Gig-Worker / Freelancer",
    icon: Briefcase,
    data: {
      AMT_CREDIT: 350000,
      AMT_ANNUITY: 22000,
      AMT_GOODS_PRICE: 320000,
      DAYS_BIRTH: -11680, // ~32 years old
      CODE_GENDER: "M",
      EXT_SOURCES_MEAN: 0.45,
      EXT_SOURCE_3: 0.42,
      BURO_DAYS_CREDIT_MAX: -35,
      cash_flow_volatility: 0.35,
    },
  },
};

export default function DashboardPage() {
  // Navigation State (3 Tabs)
  const [activeTab, setActiveTab] = useState<"policy" | "underwriting" | "stress">("underwriting");

  // ==========================================
  // TAB 1: Policy Simulator State
  // ==========================================
  const [cutoffPD, setCutoffPD] = useState<number>(18.0);
  const [interestRate, setInterestRate] = useState<number>(15.0);
  const [lgdRate, setLgdRate] = useState<number>(45.0);
  const [policyResult, setPolicyResult] = useState<PolicySimResponse | null>(null);
  const [policyLoading, setPolicyLoading] = useState<boolean>(false);

  // ==========================================
  // TAB 2: Individual Underwriting State
  // ==========================================
  const [form, setForm] = useState<ApplicantPayload>(PRESETS.subprime.data);
  const [ageYears, setAgeYears] = useState<number>(25);
  const [underwritingResult, setUnderwritingResult] = useState<ScoringResponse | null>(null);
  const [underwritingLoading, setUnderwritingLoading] = useState<boolean>(false);
  const [underwritingError, setUnderwritingError] = useState<string | null>(null);
  const [refreshAuditTrigger, setRefreshAuditTrigger] = useState<number>(0);

  // ==========================================
  // TAB 3: Stress Testing State
  // ==========================================
  const [stressScenarios, setStressScenarios] = useState<StressScenarioResponse[]>([]);
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState<number>(0);
  const [stressLoading, setStressLoading] = useState<boolean>(false);

  // Modal State
  const [isGlossaryOpen, setIsGlossaryOpen] = useState<boolean>(false);

  // ------------------------------------------
  // Tab 1 API Call
  // ------------------------------------------
  const runPolicySimulation = async () => {
    setPolicyLoading(true);
    try {
      const res = await simulatePolicy({
        cutoff_pd: cutoffPD,
        interest_rate: interestRate,
        lgd: lgdRate,
      });
      setPolicyResult(res);
    } catch {
      // Client-side fallback calculation if offline
      const cutoff = cutoffPD / 100.0;
      const r = interestRate / 100.0;
      const lgd = lgdRate / 100.0;
      const approval_rate = Math.min(0.95, Math.max(0.10, 0.40 + cutoff * 1.8));
      const approved_count = Math.round(15000 * approval_rate);
      const edr = Math.min(0.12, Math.max(0.005, cutoff * 0.15));
      const default_count = Math.round(approved_count * edr);
      const exposure_m = (approved_count * 600000) / 1e6;
      const revenue_m = exposure_m * r;
      const expected_loss_m = exposure_m * edr * lgd;
      const net_profit_m = revenue_m - expected_loss_m;

      setPolicyResult({
        approval_rate: Number((approval_rate * 100).toFixed(2)),
        approved_count,
        expected_default_rate: Number((edr * 100).toFixed(2)),
        default_count,
        approved_exposure_m: Number(exposure_m.toFixed(2)),
        simulated_net_profit_m: Number(net_profit_m.toFixed(2)),
        revenue_m: Number(revenue_m.toFixed(2)),
        expected_loss_m: Number(expected_loss_m.toFixed(2)),
        recommendation:
          cutoff <= 0.12
            ? "Conservative Policy: ความเสี่ยงต่ำสุด ดักจับหนี้เสียได้สูง เหมาะกับช่วงเศรษฐกิจชะลอตัว"
            : cutoff <= 0.22
            ? "Balanced Growth Policy (แนะนำ): จุดสมดุลที่ดีที่สุดระหว่างการเติบโตและการควบคุมหนี้เสีย"
            : "Aggressive Expansion: อนุมัติสูงมาก ระวังความเสี่ยง NPL พุ่งสูงเกินเกณฑ์ควบคุม",
      });
    } finally {
      setPolicyLoading(false);
    }
  };

  useEffect(() => {
    runPolicySimulation();
  }, [cutoffPD, interestRate, lgdRate]);

  // ------------------------------------------
  // Tab 2 Handlers
  // ------------------------------------------
  const applyPreset = (key: string) => {
    const preset = PRESETS[key];
    if (preset) {
      setForm(preset.data);
      setAgeYears(Math.abs(Math.round(preset.data.DAYS_BIRTH / 365)));
    }
  };

  const handleAgeChange = (years: number) => {
    setAgeYears(years);
    setForm((prev) => ({
      ...prev,
      DAYS_BIRTH: -Math.abs(years * 365),
    }));
  };

  const handleEvaluate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUnderwritingLoading(true);
    setUnderwritingError(null);
    try {
      const resp = await evaluateApplicant(form);
      setUnderwritingResult(resp);
      setRefreshAuditTrigger((prev) => prev + 1);
    } catch (err: any) {
      setUnderwritingError(
        err.message || "ไม่สามารถเชื่อมต่อกับ Backend Service ที่ port 8000 ได้"
      );
    } finally {
      setUnderwritingLoading(false);
    }
  };

  useEffect(() => {
    handleEvaluate();
  }, []);

  // ------------------------------------------
  // Tab 3 Handlers
  // ------------------------------------------
  const loadStressScenarios = async () => {
    setStressLoading(true);
    try {
      const data = await fetchStressScenarios();
      setStressScenarios(data);
    } catch {
      // Fallback scenarios
      setStressScenarios([
        {
          scenario_name: "1. Baseline Scenario (สภาวะปกติ)",
          avg_pd_baseline: 8.07,
          avg_pd_stressed: 8.07,
          simulated_npl_rate: 2.85,
          expected_loss_m: 348.0,
          capital_buffer_delta_m: 0.0,
          governance_action: "Standard Capital Adequacy Monitoring (Basel III)",
          psi_index: 0.024,
          drift_status: "🟢 Green (Population Stable)",
        },
        {
          scenario_name: "2. Gig-Worker Income Shock (-30% Cashflow)",
          avg_pd_baseline: 8.07,
          avg_pd_stressed: 11.45,
          simulated_npl_rate: 4.20,
          expected_loss_m: 418.9,
          capital_buffer_delta_m: 70.9,
          governance_action: "Enhanced Cash Flow Monitoring & Risk Tier Adjustment",
          psi_index: 0.142,
          drift_status: "🟡 Yellow (Moderate Drift - Warning)",
        },
        {
          scenario_name: "3. Stagflation & Aggressive Rate Hike (+200 bps)",
          avg_pd_baseline: 8.07,
          avg_pd_stressed: 14.82,
          simulated_npl_rate: 5.57,
          expected_loss_m: 458.3,
          capital_buffer_delta_m: 110.3,
          governance_action: "Mandatory Capital Buffer Injection & Policy Tightening",
          psi_index: 0.285,
          drift_status: "🔴 Red (Significant Drift - Retrain Model)",
        },
      ]);
    } finally {
      setStressLoading(false);
    }
  };

  useEffect(() => {
    loadStressScenarios();
  }, []);

  const currentStress = stressScenarios[selectedScenarioIdx] || stressScenarios[0];

  return (
    <div className="min-h-screen pb-16">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 shadow-lg shadow-sky-500/20 text-white">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Credit Risk Intelligence Platform
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v1.2.0 API
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                FastAPI + LightGBM 5-Folds + TreeSHAP + FCRA Adverse Notice + Macro Stress Testing
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsGlossaryOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all shadow-md hover:border-slate-700"
          >
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span className="hidden md:inline">คู่มือและพจนานุกรมศัพท์</span>
            <span className="md:hidden">Glossary</span>
          </button>
        </div>

        {/* 3 Main Interactive Tabs Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-2 border-t border-slate-900 bg-slate-950/40">
          <button
            onClick={() => setActiveTab("policy")}
            className={`flex items-center gap-2 py-3.5 px-5 font-bold text-sm border-b-2 transition-all ${
              activeTab === "policy"
                ? "border-sky-500 text-sky-400 bg-sky-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>1. 🎯 Policy & Profit Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab("underwriting")}
            className={`flex items-center gap-2 py-3.5 px-5 font-bold text-sm border-b-2 transition-all ${
              activeTab === "underwriting"
                ? "border-sky-500 text-sky-400 bg-sky-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <User className="w-4 h-4" />
            <span>2. 👤 Individual Underwriting</span>
          </button>

          <button
            onClick={() => setActiveTab("stress")}
            className={`flex items-center gap-2 py-3.5 px-5 font-bold text-sm border-b-2 transition-all ${
              activeTab === "stress"
                ? "border-sky-500 text-sky-400 bg-sky-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>3. ⚡ Stress Testing & PSI</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* =========================================================================
            TAB 1: POLICY SIMULATOR & NET PROFIT OPTIMIZATION
        ========================================================================= */}
        {activeTab === "policy" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header Description */}
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                <PieChart className="w-6 h-6 text-sky-400" />
                Portfolio Credit Policy & Net Profit Simulator
              </h2>
              <p className="text-sm text-slate-400">
                จำลองและปรับแต่งเกณฑ์การอนุมัติสินเชื่อ (Cut-off PD), อัตราดอกเบี้ย, และสมมติฐาน LGD เพื่อค้นหาจุดสมดุลสูงสุดของกำไรสุทธิ (Net Profit Optimization)
              </p>
            </div>

            {/* Interactive Control Box */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-base">
                  <Sliders className="w-5 h-5" />
                  <span>พารามิเตอร์นโยบายสินเชื่อ (Credit Policy Controls)</span>
                </div>
                <span className="text-xs text-slate-400">Real-time Simulation</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Slider 1: Cut-off PD */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <label className="text-slate-300">Cut-off PD Threshold (%)</label>
                    <span className="text-sky-400 font-mono text-base font-bold">
                      {cutoffPD.toFixed(1)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5.0"
                    max="35.0"
                    step="0.5"
                    value={cutoffPD}
                    onChange={(e) => setCutoffPD(Number(e.target.value))}
                    className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>5.0% (Conservative)</span>
                    <span>35.0% (Aggressive)</span>
                  </div>
                </div>

                {/* Slider 2: Interest Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <label className="text-slate-300">Average Interest Rate (%)</label>
                    <span className="text-sky-400 font-mono text-base font-bold">
                      {interestRate.toFixed(1)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5.0"
                    max="30.0"
                    step="0.5"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>5.0% (Low Margin)</span>
                    <span>30.0% (High Margin)</span>
                  </div>
                </div>

                {/* Slider 3: LGD */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <label className="text-slate-300">Loss Given Default - LGD (%)</label>
                    <span className="text-sky-400 font-mono text-base font-bold">
                      {lgdRate.toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20.0"
                    max="80.0"
                    step="5.0"
                    value={lgdRate}
                    onChange={(e) => setLgdRate(Number(e.target.value))}
                    className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>20% (Secured)</span>
                    <span>80% (Unsecured)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Big KPI Metric Cards */}
            {policyResult && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* KPI 1: Approval Rate */}
                <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Approval Rate
                  </div>
                  <div className="text-4xl sm:text-5xl font-black text-emerald-400 my-2">
                    {policyResult.approval_rate.toFixed(1)}%
                  </div>
                  <div className="text-xs font-medium text-slate-400">
                    อนุมัติ {policyResult.approved_count.toLocaleString()} จาก 15,000 สัญญา
                  </div>
                </div>

                {/* KPI 2: EDR */}
                <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Expected Default (EDR)
                  </div>
                  <div
                    className={`text-4xl sm:text-5xl font-black my-2 ${
                      policyResult.expected_default_rate > 5.0
                        ? "text-red-400"
                        : "text-amber-400"
                    }`}
                  >
                    {policyResult.expected_default_rate.toFixed(2)}%
                  </div>
                  <div className="text-xs font-medium text-slate-400">
                    คาดการณ์หนี้เสีย {policyResult.default_count.toLocaleString()} สัญญา
                  </div>
                </div>

                {/* KPI 3: Approved Exposure */}
                <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Approved Exposure
                  </div>
                  <div className="text-4xl sm:text-5xl font-black text-white my-2">
                    {policyResult.approved_exposure_m.toLocaleString()} M
                  </div>
                  <div className="text-xs font-medium text-slate-400">
                    วงเงินสินเชื่อรวมที่อนุมัติ (บาท)
                  </div>
                </div>

                {/* KPI 4: Simulated Net Profit */}
                <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Simulated Net Profit
                  </div>
                  <div
                    className={`text-4xl sm:text-5xl font-black my-2 ${
                      policyResult.simulated_net_profit_m >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {policyResult.simulated_net_profit_m >= 0 ? "+" : ""}
                    {policyResult.simulated_net_profit_m.toLocaleString()} M
                  </div>
                  <div className="flex gap-2 text-[11px] font-mono">
                    <span className="text-emerald-400 font-bold">
                      Rev: {policyResult.revenue_m}M
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-red-400 font-bold">
                      Loss: {policyResult.expected_loss_m}M
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Strategy Recommendation Banner */}
            {policyResult && (
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-sky-500/30 shadow-xl flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="text-base font-bold text-white">
                    ข้อเสนอแนะเชิงกลยุทธ์ (Strategic Policy Recommendation)
                  </div>
                  <div className="text-sm font-medium text-sky-200">
                    {policyResult.recommendation}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: INDIVIDUAL UNDERWRITING & RECOURSE ENGINE
        ========================================================================= */}
        {activeTab === "underwriting" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Error Alert */}
            {underwritingError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-sm text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <span className="font-bold">เกิดข้อผิดพลาด:</span> {underwritingError}
                </div>
              </div>
            )}

            {/* 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Form */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-2 text-sky-400 font-bold text-base">
                      <Sliders className="w-5 h-5" />
                      <span>ข้อมูลผู้ขอกู้ (Applicant Profile)</span>
                    </div>
                    <span className="text-xs text-slate-400">Real-time Inference</span>
                  </div>

                  {/* 1-Click Preset Buttons */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Quick Testing Presets:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {Object.entries(PRESETS).map(([key, preset]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => applyPreset(key)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-sky-500/50 rounded-xl transition-all"
                        >
                          <span>{preset.label.split(" ")[0]}</span>
                          <span className="truncate">{preset.label.split(" ")[1]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input Form Fields */}
                  <form onSubmit={handleEvaluate} className="space-y-4">
                    {/* Loan Amount */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm font-semibold">
                        <label className="text-slate-300">วงเงินกู้ที่ขอ (AMT_CREDIT)</label>
                        <span className="text-sky-400 font-mono">
                          {form.AMT_CREDIT.toLocaleString()} THB
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50000"
                        max="1500000"
                        step="10000"
                        value={form.AMT_CREDIT}
                        onChange={(e) =>
                          setForm({ ...form, AMT_CREDIT: Number(e.target.value) })
                        }
                        className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                    </div>

                    {/* Monthly Annuity */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm font-semibold">
                        <label className="text-slate-300">ค่างวดต่อเดือน (AMT_ANNUITY)</label>
                        <span className="text-sky-400 font-mono">
                          {form.AMT_ANNUITY.toLocaleString()} THB
                        </span>
                      </div>
                      <input
                        type="range"
                        min="2000"
                        max="80000"
                        step="1000"
                        value={form.AMT_ANNUITY}
                        onChange={(e) =>
                          setForm({ ...form, AMT_ANNUITY: Number(e.target.value) })
                        }
                        className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                    </div>

                    {/* Age */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm font-semibold">
                        <label className="text-slate-300">อายุผู้กู้ (Age)</label>
                        <span className="text-sky-400 font-mono">{ageYears} ปี</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="65"
                        step="1"
                        value={ageYears}
                        onChange={(e) => handleAgeChange(Number(e.target.value))}
                        className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                    </div>

                    {/* Bureau Score */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm font-semibold">
                        <label className="text-slate-300">
                          คะแนนเครดิตบูโร (EXT_SOURCES_MEAN)
                        </label>
                        <span className="text-sky-400 font-mono">
                          {((form.EXT_SOURCES_MEAN || 0.5) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.95"
                        step="0.01"
                        value={form.EXT_SOURCES_MEAN || 0.5}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            EXT_SOURCES_MEAN: Number(e.target.value),
                            EXT_SOURCE_3: Number(e.target.value),
                          })
                        }
                        className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                    </div>

                    {/* Cash Flow Volatility */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm font-semibold">
                        <label className="text-slate-300">
                          ความผันผวนกระแสเงินสด (Volatility)
                        </label>
                        <span className="text-sky-400 font-mono">
                          {(form.cash_flow_volatility || 0.2).toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.80"
                        step="0.02"
                        value={form.cash_flow_volatility || 0.2}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            cash_flow_volatility: Number(e.target.value),
                          })
                        }
                        className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                    </div>

                    {/* Submit Action */}
                    <button
                      type="submit"
                      disabled={underwritingLoading}
                      className="w-full mt-4 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-sky-500/25 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {underwritingLoading ? (
                        <Activity className="w-5 h-5 animate-spin" />
                      ) : (
                        <Sparkles className="w-5 h-5" />
                      )}
                      <span>
                        {underwritingLoading
                          ? "กำลังประเมินความเสี่ยง..."
                          : "ประเมินความเสี่ยงสินเชื่อ (Evaluate Risk)"}
                      </span>
                      {!underwritingLoading && <ArrowRight className="w-5 h-5" />}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Results */}
              <div className="lg:col-span-7 space-y-6">
                {underwritingResult ? (
                  <>
                    {/* Decision Hero Banner */}
                    <div
                      className={`p-6 sm:p-7 rounded-3xl border shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 ${
                        underwritingResult.decision === "APPROVED"
                          ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400 shadow-emerald-900/10"
                          : "bg-red-950/40 border-red-500/40 text-red-400 shadow-red-900/10"
                      }`}
                    >
                      <div>
                        <div className="text-xs uppercase tracking-widest font-black opacity-80">
                          Underwriting Verdict
                        </div>
                        <div className="text-3xl sm:text-4xl font-black mt-1 tracking-tight">
                          {underwritingResult.decision === "APPROVED"
                            ? "🟢 APPROVED (ผ่านเกณฑ์)"
                            : "🔴 REJECTED (ไม่ผ่านเกณฑ์)"}
                        </div>
                        <p className="text-sm font-medium mt-1 text-slate-300">
                          {underwritingResult.decision === "APPROVED"
                            ? "ผู้กู้มีคุณสมบัติความเสี่ยงอยู่ในเกณฑ์ปลอดภัย พร้อมส่งต่อฝ่ายพิจารณาสัญญา"
                            : "ความเสี่ยงการผิดนัดชำระหนี้สูงกว่าเกณฑ์ Cut-off นโยบายของธนาคาร"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                          Predicted Default Risk
                        </div>
                        <div
                          className={`text-3xl font-black font-mono mt-0.5 ${
                            underwritingResult.applicant_pd <= 0.18
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {(underwritingResult.applicant_pd * 100).toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    {/* Score Gauge Card */}
                    <ScoreGauge
                      score={underwritingResult.credit_score}
                      pd={underwritingResult.applicant_pd}
                    />

                    {/* Adverse Action Notice (If Rejected) */}
                    {underwritingResult.decision === "REJECTED" && (
                      <AdverseNotice reasons={underwritingResult.reason_codes} />
                    )}

                    {/* Actionable Recourse Recommendations */}
                    {underwritingResult.decision === "REJECTED" && (
                      <RecourseTable recourse={underwritingResult.actionable_recourse} />
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 border border-slate-800 rounded-3xl text-center space-y-3">
                    <Activity className="w-8 h-8 text-sky-400 animate-pulse" />
                    <div className="text-lg font-bold text-white">
                      พร้อมทำการประเมินความเสี่ยง
                    </div>
                    <p className="text-sm text-slate-400 max-w-md">
                      เลือกพารามิเตอร์หรือคลิกปุ่ม Quick Preset ทางซ้ายมือ เพื่อดูผลการประเมินคะแนนเครดิตสกอร์การ์ด (300-850)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section: Live Audit Trail */}
            <AuditTrail refreshTrigger={refreshAuditTrigger} />
          </div>
        )}

        {/* =========================================================================
            TAB 3: MACROECONOMIC STRESS TESTING & PSI TRACKER
        ========================================================================= */}
        {activeTab === "stress" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                <Zap className="w-6 h-6 text-sky-400" />
                Macroeconomic Stress Testing & Population Drift Tracker (ICAAP)
              </h2>
              <p className="text-sm text-slate-400">
                จำลองวิกฤตเศรษฐกิจภายใต้กรอบ Basel III / ICAAP เพื่อประเมินเงินกองทุนสำรองส่วนเพิ่ม (Capital Buffer Delta) และตรวจจับ Data Drift ด้วย PSI
              </p>
            </div>

            {/* Scenario Selector Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stressScenarios.map((sc, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedScenarioIdx(idx)}
                  className={`p-5 rounded-3xl border text-left transition-all flex flex-col justify-between ${
                    selectedScenarioIdx === idx
                      ? "bg-slate-900 border-sky-500 ring-2 ring-sky-500/20 shadow-xl"
                      : "bg-slate-950/60 border-slate-800 hover:bg-slate-900/60 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Scenario #{idx + 1}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        sc.psi_index < 0.10
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : sc.psi_index <= 0.25
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-red-500/10 text-red-400 border-red-500/30"
                      }`}
                    >
                      {sc.psi_index < 0.10
                        ? "Stable"
                        : sc.psi_index <= 0.25
                        ? "Warning"
                        : "Retrain"}
                    </span>
                  </div>
                  <div className="text-base font-bold text-white">
                    {sc.scenario_name}
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Scenario Deep Dive Card */}
            {currentStress && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                  <div>
                    <span className="text-xs uppercase font-bold text-sky-400 tracking-wider">
                      Selected Macroeconomic Scenario
                    </span>
                    <h3 className="text-xl font-black text-white mt-0.5">
                      {currentStress.scenario_name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold">
                      PSI Status:
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      {currentStress.drift_status}
                    </span>
                  </div>
                </div>

                {/* 3 Large KPI Comparison Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Card 1: Stressed PD */}
                  <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Average Portfolio PD
                    </div>
                    <div className="text-4xl font-black text-white">
                      {currentStress.avg_pd_stressed.toFixed(2)}%
                    </div>
                    <div className="text-xs font-semibold text-slate-400 pt-1">
                      Baseline: {currentStress.avg_pd_baseline.toFixed(2)}% (
                      {currentStress.avg_pd_stressed > currentStress.avg_pd_baseline ? "+" : ""}
                      {(
                        currentStress.avg_pd_stressed - currentStress.avg_pd_baseline
                      ).toFixed(2)}
                      %)
                    </div>
                  </div>

                  {/* Card 2: Simulated NPL */}
                  <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Simulated NPL Rate
                    </div>
                    <div
                      className={`text-4xl font-black ${
                        currentStress.simulated_npl_rate > 3.0
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {currentStress.simulated_npl_rate.toFixed(2)}%
                    </div>
                    <div className="text-xs font-semibold text-slate-400 pt-1">
                      Expected Loss: {currentStress.expected_loss_m.toFixed(1)} M THB
                    </div>
                  </div>

                  {/* Card 3: Capital Buffer Delta */}
                  <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Required Capital Buffer Delta
                    </div>
                    <div
                      className={`text-4xl font-black ${
                        currentStress.capital_buffer_delta_m > 0
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {currentStress.capital_buffer_delta_m > 0 ? "+" : ""}
                      {currentStress.capital_buffer_delta_m.toFixed(1)} M
                    </div>
                    <div className="text-xs font-semibold text-slate-400 pt-1">
                      เงินกองทุนสำรองส่วนเพิ่ม (THB)
                    </div>
                  </div>
                </div>

                {/* Governance Action Notice */}
                <div className="p-5 rounded-2xl bg-slate-950/70 border-l-4 border-sky-500 border-y border-r border-slate-800 flex items-start gap-3">
                  <Flame className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-white">
                      มาตรการกำกับดูแลความเสี่ยง (Model Governance & Action):
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                      {currentStress.governance_action}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ICAAP Benchmark Leaderboard Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-400" />
                ตารางเปรียบเทียบฉากทัศน์ความเสี่ยง (ICAAP Scenario Leaderboard)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 px-2">ฉากทัศน์ (Scenario)</th>
                      <th className="pb-3 px-2 text-center">Avg PD</th>
                      <th className="pb-3 px-2 text-center">NPL Rate</th>
                      <th className="pb-3 px-2 text-center">Expected Loss</th>
                      <th className="pb-3 px-2 text-center">Capital Delta</th>
                      <th className="pb-3 px-2 text-right">PSI Drift Index</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {stressScenarios.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          selectedScenarioIdx === idx ? "bg-slate-800/20" : ""
                        }`}
                      >
                        <td className="py-3 px-2 font-sans font-bold text-slate-200">
                          {row.scenario_name}
                        </td>
                        <td className="py-3 px-2 text-center text-slate-300">
                          {row.avg_pd_stressed.toFixed(2)}%
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-slate-200">
                          {row.simulated_npl_rate.toFixed(2)}%
                        </td>
                        <td className="py-3 px-2 text-center text-slate-300">
                          {row.expected_loss_m.toFixed(1)} M
                        </td>
                        <td
                          className={`py-3 px-2 text-center font-bold ${
                            row.capital_buffer_delta_m > 0
                              ? "text-red-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {row.capital_buffer_delta_m > 0 ? "+" : ""}
                          {row.capital_buffer_delta_m.toFixed(1)} M
                        </td>
                        <td className="py-3 px-2 text-right font-sans">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              row.psi_index < 0.10
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : row.psi_index <= 0.25
                                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                : "bg-red-500/15 text-red-400 border border-red-500/30"
                            }`}
                          >
                            PSI: {row.psi_index.toFixed(3)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Financial Glossary & Guide Modal */}
      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />
    </div>
  );
}
