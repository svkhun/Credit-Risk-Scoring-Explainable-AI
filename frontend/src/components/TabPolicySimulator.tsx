"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Sparkles, PieChart } from "lucide-react";
import { PolicySimResponse, simulatePolicy } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

export function TabPolicySimulator() {
  const { t, lang } = useLanguage();

  const [cutoffPD, setCutoffPD] = useState<number>(18.0);
  const [interestRate, setInterestRate] = useState<number>(15.0);
  const [lgdRate, setLgdRate] = useState<number>(45.0);
  const [policyResult, setPolicyResult] = useState<PolicySimResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await simulatePolicy({
        cutoff_pd: cutoffPD,
        interest_rate: interestRate,
        lgd: lgdRate,
      });
      setPolicyResult(res);
    } catch {
      // Fallback calculation
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
            ? lang === "th"
              ? "Conservative Policy: ความเสี่ยงต่ำสุด ดักจับหนี้เสียได้สูง เหมาะกับช่วงเศรษฐกิจชะลอตัว"
              : "Conservative Policy: Lowest default risk. Recommended during economic downturns."
            : cutoff <= 0.22
            ? lang === "th"
              ? "Balanced Growth Policy (แนะนำ): จุดสมดุลที่ดีที่สุดระหว่างการเติบโตและการควบคุมหนี้เสีย"
              : "Balanced Growth Policy (Recommended): Optimal balance between volume growth and loss provisioning."
            : lang === "th"
            ? "Aggressive Expansion: อนุมัติสูงมาก ระวังความเสี่ยง NPL พุ่งสูงเกินเกณฑ์ควบคุม"
            : "Aggressive Expansion: High acceptance rate; requires higher capital buffers.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [cutoffPD, interestRate, lgdRate, lang]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Description */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
          <PieChart className="w-7 h-7 text-blue-600" />
          {t.tab1Title}
        </h2>
        <p className="text-base text-slate-600 leading-relaxed max-w-4xl">
          {t.tab1Subtitle}
        </p>
      </div>

      {/* Interactive Control Box */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-lg">
            <Sliders className="w-5 h-5" />
            <span>{t.policyControls}</span>
          </div>
          <span className="text-sm font-semibold text-slate-500">
            {t.realtimeSim}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Slider 1: Cut-off PD */}
          <div className="space-y-3">
            <div className="flex justify-between text-base font-semibold">
              <label className="text-slate-800">{t.cutoffLabel}</label>
              <span className="text-blue-600 font-mono text-lg font-bold">
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
              className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-sm text-slate-500 font-medium">
              <span>5.0% ({t.conservative})</span>
              <span>35.0% ({t.aggressive})</span>
            </div>
          </div>

          {/* Slider 2: Interest Rate */}
          <div className="space-y-3">
            <div className="flex justify-between text-base font-semibold">
              <label className="text-slate-800">{t.interestRateLabel}</label>
              <span className="text-blue-600 font-mono text-lg font-bold">
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
              className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-sm text-slate-500 font-medium">
              <span>5.0% ({t.lowMargin})</span>
              <span>30.0% ({t.highMargin})</span>
            </div>
          </div>

          {/* Slider 3: LGD */}
          <div className="space-y-3">
            <div className="flex justify-between text-base font-semibold">
              <label className="text-slate-800">{t.lgdLabel}</label>
              <span className="text-blue-600 font-mono text-lg font-bold">
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
              className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-sm text-slate-500 font-medium">
              <span>20% ({t.secured})</span>
              <span>80% ({t.unsecured})</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Big KPI Metric Cards */}
      {policyResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* KPI 1: Approval Rate */}
          <div className="p-6 sm:p-7 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="text-base font-bold text-slate-600 uppercase tracking-wider">
              {t.kpiApprovalRate}
            </div>
            <div className="text-4xl sm:text-5xl font-black text-emerald-600 my-2.5">
              {policyResult.approval_rate.toFixed(1)}%
            </div>
            <div className="text-sm font-medium text-slate-500">
              {t.approvedOfTotal
                .replace("{count}", policyResult.approved_count.toLocaleString())
                .replace("{total}", "15,000")}
            </div>
          </div>

          {/* KPI 2: EDR */}
          <div className="p-6 sm:p-7 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="text-base font-bold text-slate-600 uppercase tracking-wider">
              {t.kpiEDR}
            </div>
            <div
              className={`text-4xl sm:text-5xl font-black my-2.5 ${
                policyResult.expected_default_rate > 5.0
                  ? "text-rose-600"
                  : "text-amber-600"
              }`}
            >
              {policyResult.expected_default_rate.toFixed(2)}%
            </div>
            <div className="text-sm font-medium text-slate-500">
              {t.defaultOfApproved.replace(
                "{count}",
                policyResult.default_count.toLocaleString()
              )}
            </div>
          </div>

          {/* KPI 3: Approved Exposure */}
          <div className="p-6 sm:p-7 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="text-base font-bold text-slate-600 uppercase tracking-wider">
              {t.kpiExposure}
            </div>
            <div className="text-4xl sm:text-5xl font-black text-slate-900 my-2.5">
              {policyResult.approved_exposure_m.toLocaleString()} M
            </div>
            <div className="text-sm font-medium text-slate-500">
              {t.exposureUnit}
            </div>
          </div>

          {/* KPI 4: Simulated Net Profit */}
          <div className="p-6 sm:p-7 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="text-base font-bold text-slate-600 uppercase tracking-wider">
              {t.kpiNetProfit}
            </div>
            <div
              className={`text-4xl sm:text-5xl font-black my-2.5 ${
                policyResult.simulated_net_profit_m >= 0
                  ? "text-emerald-600"
                  : "text-rose-600"
              }`}
            >
              {policyResult.simulated_net_profit_m >= 0 ? "+" : ""}
              {policyResult.simulated_net_profit_m.toLocaleString()} M
            </div>
            <div className="flex gap-2 text-sm font-mono font-medium">
              <span className="text-emerald-600">
                {t.revenue}: {policyResult.revenue_m}M
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-rose-600">
                {t.loss}: {policyResult.expected_loss_m}M
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Recommendation Banner */}
      {policyResult && (
        <div className="p-6 sm:p-7 rounded-3xl bg-blue-50/80 border border-blue-200 shadow-sm flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-blue-600 text-white shrink-0 shadow-md shadow-blue-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold text-slate-900">
              {t.strategicRecTitle}
            </div>
            <div className="text-base font-medium text-blue-900 leading-relaxed">
              {policyResult.recommendation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
