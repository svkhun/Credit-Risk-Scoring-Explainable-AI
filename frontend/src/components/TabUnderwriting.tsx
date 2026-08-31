"use client";

import React, { useState, useEffect } from "react";
import {
  Sliders,
  Sparkles,
  Activity,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { ApplicantPayload, ScoringResponse, evaluateApplicant } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { ScoreGauge } from "@/components/ScoreGauge";
import { AdverseNotice } from "@/components/AdverseNotice";
import { RecourseTable } from "@/components/RecourseTable";
import { AuditTrail } from "@/components/AuditTrail";

const PRESETS: Record<string, { labelKey: "presetPrime" | "presetSubprime" | "presetFreelancer"; data: ApplicantPayload }> = {
  prime: {
    labelKey: "presetPrime",
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
    labelKey: "presetSubprime",
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
    labelKey: "presetFreelancer",
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

export function TabUnderwriting() {
  const { t, lang } = useLanguage();

  const [form, setForm] = useState<ApplicantPayload>(PRESETS.subprime.data);
  const [ageYears, setAgeYears] = useState<number>(25);
  const [result, setResult] = useState<ScoringResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshAuditTrigger, setRefreshAuditTrigger] = useState<number>(0);

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
    setLoading(true);
    setError(null);
    try {
      const resp = await evaluateApplicant(form);
      setResult(resp);
      setRefreshAuditTrigger((prev) => prev + 1);
    } catch (err: any) {
      setError(
        err.message || "Cannot connect to FastAPI backend at port 8000"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleEvaluate();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-base text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {/* Top 2-Column Section: Form (Left) & Underwriting Verdict + Scorecard (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Applicant Input Profile */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-lg">
                <Sliders className="w-5 h-5" />
                <span>{t.applicantProfile}</span>
              </div>
              <span className="text-sm text-slate-500 font-medium">
                {t.realtimeInference}
              </span>
            </div>

            {/* 1-Click Preset Buttons */}
            <div className="space-y-2.5">
              <label className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                {t.quickPresets}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPreset(key)}
                    className="flex items-center justify-center py-3 px-2 text-sm font-semibold bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 hover:border-blue-300 rounded-xl transition-all shadow-2xs text-center"
                  >
                    <span>{t[preset.labelKey]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form Fields */}
            <form onSubmit={handleEvaluate} className="space-y-4">
              {/* Loan Amount */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-base font-semibold">
                  <label className="text-slate-800">{t.loanAmount}</label>
                  <span className="text-blue-600 font-mono text-lg font-bold">
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
                  className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Monthly Annuity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-base font-semibold">
                  <label className="text-slate-800">{t.monthlyAnnuity}</label>
                  <span className="text-blue-600 font-mono text-lg font-bold">
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
                  className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Age */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-base font-semibold">
                  <label className="text-slate-800">{t.ageYears}</label>
                  <span className="text-blue-600 font-mono text-lg font-bold">
                    {ageYears} {lang === "th" ? "ปี" : "Years"}
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="65"
                  step="1"
                  value={ageYears}
                  onChange={(e) => handleAgeChange(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Bureau Score */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-base font-semibold">
                  <label className="text-slate-800">{t.bureauScore}</label>
                  <span className="text-blue-600 font-mono text-lg font-bold">
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
                  className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Cash Flow Volatility */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-base font-semibold">
                  <label className="text-slate-800">{t.cashFlowVol}</label>
                  <span className="text-blue-600 font-mono text-lg font-bold">
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
                  className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Large Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-5 flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Activity className="w-6 h-6 animate-spin" />
                ) : (
                  <Sparkles className="w-6 h-6" />
                )}
                <span>
                  {loading ? t.evaluatingBtn : t.evaluateBtn}
                </span>
                {!loading && <ArrowRight className="w-6 h-6" />}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Underwriting Verdict & FICO Scorecard */}
        <div className="lg:col-span-6 space-y-6">
          {result ? (
            <>
              {/* Clean Single-Row Verdict Banner */}
              <div
                className={`p-6 sm:p-7 rounded-3xl border shadow-sm flex items-center justify-between gap-4 ${
                  result.decision === "APPROVED"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                }`}
              >
                <div>
                  <div className="text-xs uppercase tracking-widest font-black opacity-80">
                    {t.verdictTitle}
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold mt-1 tracking-tight">
                    {result.decision === "APPROVED"
                      ? t.approvedBadge
                      : t.rejectedBadge}
                  </div>
                  <p className="text-base font-medium mt-1 text-slate-700 leading-relaxed">
                    {result.decision === "APPROVED"
                      ? t.approvedDesc
                      : t.rejectedDesc}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs uppercase tracking-wider text-slate-600 font-bold">
                    {t.predictedPD}
                  </div>
                  <div
                    className={`text-3xl sm:text-4xl font-black font-mono mt-0.5 ${
                      result.applicant_pd <= 0.18
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {(result.applicant_pd * 100).toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* FICO Scorecard Display */}
              <ScoreGauge
                score={result.credit_score}
                pd={result.applicant_pd}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-3xl text-center space-y-3">
              <Activity className="w-8 h-8 text-blue-600 animate-pulse" />
              <div className="text-lg font-bold text-slate-900">
                {lang === "th"
                  ? "พร้อมทำการประเมินความเสี่ยง"
                  : "Ready for Underwriting Assessment"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Full-Width Section: Adverse Action Notice & Counterfactual Recourse */}
      {result && result.decision === "REJECTED" && (
        <div className="space-y-6 pt-2">
          {/* Adverse Action Notice */}
          <AdverseNotice reasons={result.reason_codes} />

          {/* Actionable Counterfactual Recourse Table */}
          <RecourseTable recourse={result.actionable_recourse} />
        </div>
      )}

      {/* Bottom Section: Live Audit Trail */}
      <AuditTrail refreshTrigger={refreshAuditTrigger} />
    </div>
  );
}
