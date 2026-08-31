"use client";

import React, { useState, useEffect } from "react";
import { Zap, Flame, Layers } from "lucide-react";
import { StressScenarioResponse, fetchStressScenarios } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

export function TabStressTesting() {
  const { t, lang } = useLanguage();

  const [stressScenarios, setStressScenarios] = useState<StressScenarioResponse[]>([]);
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const loadStressScenarios = async () => {
    setLoading(true);
    try {
      const data = await fetchStressScenarios();
      setStressScenarios(data);
    } catch {
      setStressScenarios([
        {
          scenario_name:
            lang === "th"
              ? "1. Baseline Scenario (สภาวะปกติ)"
              : "1. Baseline Scenario (Normal Economy)",
          avg_pd_baseline: 8.07,
          avg_pd_stressed: 8.07,
          simulated_npl_rate: 2.85,
          expected_loss_m: 348.0,
          capital_buffer_delta_m: 0.0,
          governance_action:
            lang === "th"
              ? "Standard Capital Adequacy Monitoring (Basel III)"
              : "Standard Capital Adequacy Monitoring (Basel III)",
          psi_index: 0.024,
          drift_status: "🟢 Green (Population Stable)",
        },
        {
          scenario_name:
            lang === "th"
              ? "2. Gig-Worker Income Shock (-30% Cashflow)"
              : "2. Gig-Worker Income Shock (-30% Stability)",
          avg_pd_baseline: 8.07,
          avg_pd_stressed: 11.45,
          simulated_npl_rate: 4.20,
          expected_loss_m: 418.9,
          capital_buffer_delta_m: 70.9,
          governance_action:
            lang === "th"
              ? "Enhanced Cash Flow Monitoring & Risk Tier Adjustment"
              : "Enhanced Cash Flow Monitoring & Risk Tier Adjustment",
          psi_index: 0.142,
          drift_status: "🟡 Yellow (Moderate Drift - Warning)",
        },
        {
          scenario_name:
            lang === "th"
              ? "3. Stagflation & Aggressive Rate Hike (+200 bps)"
              : "3. Stagflation & Aggressive Rate Hike (+200 bps)",
          avg_pd_baseline: 8.07,
          avg_pd_stressed: 14.82,
          simulated_npl_rate: 5.57,
          expected_loss_m: 458.3,
          capital_buffer_delta_m: 110.3,
          governance_action:
            lang === "th"
              ? "Mandatory Capital Buffer Injection & Policy Tightening"
              : "Mandatory Capital Buffer Injection & Policy Tightening",
          psi_index: 0.285,
          drift_status: "🔴 Red (Significant Drift - Retrain Model)",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStressScenarios();
  }, [lang]);

  const currentStress = stressScenarios[selectedScenarioIdx] || stressScenarios[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
          <Zap className="w-7 h-7 text-blue-600" />
          {t.stressTitle}
        </h2>
        <p className="text-base text-slate-600 leading-relaxed max-w-4xl">
          {t.stressSubtitle}
        </p>
      </div>

      {/* Scenario Selector Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stressScenarios.map((sc, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedScenarioIdx(idx)}
            className={`p-6 rounded-3xl border text-left transition-all flex flex-col justify-between ${
              selectedScenarioIdx === idx
                ? "bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                : "bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300 text-slate-600 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Scenario #{idx + 1}
              </span>
              <span
                className={`text-xs sm:text-sm font-bold px-3 py-1 rounded-full border ${
                  sc.psi_index < 0.10
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : sc.psi_index <= 0.25
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {sc.psi_index < 0.10
                  ? "Stable"
                  : sc.psi_index <= 0.25
                  ? "Warning"
                  : "Retrain"}
              </span>
            </div>
            <div className="text-lg font-bold text-slate-900">
              {sc.scenario_name}
            </div>
          </button>
        ))}
      </div>

      {/* Selected Scenario Deep Dive Card */}
      {currentStress && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs sm:text-sm uppercase font-bold text-blue-600 tracking-wider">
                {t.scenarioHeader}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {currentStress.scenario_name}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 font-semibold">
                {t.psiStatus}
              </span>
              <span className="text-sm font-bold text-slate-800">
                {currentStress.drift_status}
              </span>
            </div>
          </div>

          {/* 3 Large KPI Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Stressed PD */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">
                {t.avgPD}
              </div>
              <div className="text-4xl sm:text-5xl font-black text-slate-900">
                {currentStress.avg_pd_stressed.toFixed(2)}%
              </div>
              <div className="text-sm font-semibold text-slate-500 pt-1">
                {t.baselinePD.replace("{val}", currentStress.avg_pd_baseline.toFixed(2))} (
                {currentStress.avg_pd_stressed > currentStress.avg_pd_baseline ? "+" : ""}
                {(
                  currentStress.avg_pd_stressed - currentStress.avg_pd_baseline
                ).toFixed(2)}
                %)
              </div>
            </div>

            {/* Card 2: Simulated NPL */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">
                {t.nplRate}
              </div>
              <div
                className={`text-4xl sm:text-5xl font-black ${
                  currentStress.simulated_npl_rate > 3.0
                    ? "text-rose-600"
                    : "text-emerald-600"
                }`}
              >
                {currentStress.simulated_npl_rate.toFixed(2)}%
              </div>
              <div className="text-sm font-semibold text-slate-500 pt-1">
                {t.expectedLoss.replace(
                  "{val}",
                  currentStress.expected_loss_m.toFixed(1)
                )}
              </div>
            </div>

            {/* Card 3: Capital Buffer Delta */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">
                {t.capBuffer}
              </div>
              <div
                className={`text-4xl sm:text-5xl font-black ${
                  currentStress.capital_buffer_delta_m > 0
                    ? "text-rose-600"
                    : "text-emerald-600"
                }`}
              >
                {currentStress.capital_buffer_delta_m > 0 ? "+" : ""}
                {currentStress.capital_buffer_delta_m.toFixed(1)} M
              </div>
              <div className="text-sm font-semibold text-slate-500 pt-1">
                {t.capBufferUnit}
              </div>
            </div>
          </div>

          {/* Governance Action Notice */}
          <div className="p-5 sm:p-6 rounded-2xl bg-blue-50/80 border-l-4 border-blue-600 border-y border-r border-blue-200 flex items-start gap-3.5">
            <Flame className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-base font-bold text-slate-900">
                {t.govActionTitle}
              </div>
              <p className="text-sm sm:text-base text-slate-700 mt-1 leading-relaxed">
                {currentStress.governance_action}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ICAAP Benchmark Leaderboard Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow space-y-4">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-blue-600" />
          {t.leaderboardTitle}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead>
              <tr className="border-b border-slate-200 text-sm font-bold text-slate-700 uppercase tracking-wider bg-slate-50/70">
                <th className="py-3.5 px-4 rounded-l-xl">{t.scenarioCol}</th>
                <th className="py-3.5 px-4 text-center">{t.avgPDCol}</th>
                <th className="py-3.5 px-4 text-center">{t.nplCol}</th>
                <th className="py-3.5 px-4 text-center">{t.lossCol}</th>
                <th className="py-3.5 px-4 text-center">{t.bufferCol}</th>
                <th className="py-3.5 px-4 text-right rounded-r-xl">{t.psiCol}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-sm">
              {stressScenarios.map((row, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-50 transition-colors ${
                    selectedScenarioIdx === idx ? "bg-blue-50/40" : ""
                  }`}
                >
                  <td className="py-4 px-4 font-sans font-bold text-slate-900">
                    {row.scenario_name}
                  </td>
                  <td className="py-4 px-4 text-center text-slate-700">
                    {row.avg_pd_stressed.toFixed(2)}%
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-slate-900">
                    {row.simulated_npl_rate.toFixed(2)}%
                  </td>
                  <td className="py-4 px-4 text-center text-slate-700">
                    {row.expected_loss_m.toFixed(1)} M
                  </td>
                  <td
                    className={`py-4 px-4 text-center font-bold ${
                      row.capital_buffer_delta_m > 0
                        ? "text-rose-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {row.capital_buffer_delta_m > 0 ? "+" : ""}
                    {row.capital_buffer_delta_m.toFixed(1)} M
                  </td>
                  <td className="py-4 px-4 text-right font-sans">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        row.psi_index < 0.10
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : row.psi_index <= 0.25
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
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
  );
}
