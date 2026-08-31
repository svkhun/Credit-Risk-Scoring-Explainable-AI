"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface ScoreGaugeProps {
  score: number; // 300 - 850
  pd: number; // 0.0 - 1.0
  cutoffScore?: number;
}

export function ScoreGauge({
  score,
  pd,
  cutoffScore = 531,
}: ScoreGaugeProps) {
  const { t } = useLanguage();

  const minScore = 300;
  const maxScore = 850;
  const clampedScore = Math.max(minScore, Math.min(maxScore, score));
  const percentage = ((clampedScore - minScore) / (maxScore - minScore)) * 100;

  let tierName = "Deep Subprime";
  let tierColor = "text-rose-700";
  let bgTier = "bg-rose-50 border-rose-200";
  let strokeColor = "#E11D48";
  let Icon = ShieldAlert;

  if (score >= 750) {
    tierName = "Super Prime";
    tierColor = "text-emerald-700";
    bgTier = "bg-emerald-50 border-emerald-200";
    strokeColor = "#059669";
    Icon = ShieldCheck;
  } else if (score >= 680) {
    tierName = "Prime";
    tierColor = "text-emerald-700";
    bgTier = "bg-emerald-50 border-emerald-200";
    strokeColor = "#059669";
    Icon = ShieldCheck;
  } else if (score >= 620) {
    tierName = "Near Prime";
    tierColor = "text-amber-700";
    bgTier = "bg-amber-50 border-amber-200";
    strokeColor = "#D97706";
    Icon = AlertTriangle;
  } else if (score >= 550) {
    tierName = "Subprime";
    tierColor = "text-orange-700";
    bgTier = "bg-orange-50 border-orange-200";
    strokeColor = "#EA580C";
    Icon = ShieldAlert;
  }

  const radius = 80;
  const strokeWidth = 14;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const halfCircumference = circumference / 2;
  const strokeDashoffset =
    halfCircumference - (percentage / 100) * halfCircumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-7 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between w-full mb-2">
        <span className="text-base font-bold tracking-wider text-slate-700 uppercase">
          {t.scorecardTitle}
        </span>
        <div
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm font-bold ${bgTier} ${tierColor}`}
        >
          <Icon className="w-4 h-4" />
          <span>{tierName}</span>
        </div>
      </div>

      {/* Semi-Circular SVG Gauge */}
      <div className="relative flex items-center justify-center w-64 h-36 mt-1">
        <svg
          viewBox="0 0 180 100"
          className="w-full h-full transform -rotate-180"
        >
          {/* Background Track */}
          <path
            d="M 10 90 A 80 80 0 0 1 170 90"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Active Colored Arc */}
          <path
            d="M 10 90 A 80 80 0 0 1 170 90"
            fill="none"
            stroke={strokeColor}
            strokeWidth="14"
            strokeDasharray={`${halfCircumference} ${halfCircumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Score Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <div className="text-5xl sm:text-6xl font-black tracking-tight text-slate-900">
            {score}
          </div>
          <div className="text-base font-medium text-slate-600 mt-0.5">
            {t.scaleText}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 w-full mt-5 pt-5 border-t border-slate-100 text-center">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div className="text-sm font-semibold text-slate-600">
            {t.predictedPD}
          </div>
          <div
            className={`text-xl font-bold mt-0.5 ${
              pd <= 0.18 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {(pd * 100).toFixed(2)}%
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div className="text-sm font-semibold text-slate-600">
            {t.cutoffScore}
          </div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">
            {cutoffScore} pts
          </div>
        </div>
      </div>
    </div>
  );
}
