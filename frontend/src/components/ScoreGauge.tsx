"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";

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
  // Normalize score between 0 and 100 for gauge percentage
  const minScore = 300;
  const maxScore = 850;
  const clampedScore = Math.max(minScore, Math.min(maxScore, score));
  const percentage = ((clampedScore - minScore) / (maxScore - minScore)) * 100;

  // Determine Tier & Color
  let tierName = "Deep Subprime";
  let tierColor = "text-red-400";
  let bgTier = "bg-red-500/10 border-red-500/30";
  let strokeColor = "#EF4444";
  let Icon = ShieldAlert;

  if (score >= 750) {
    tierName = "Super Prime";
    tierColor = "text-emerald-400";
    bgTier = "bg-emerald-500/10 border-emerald-500/30";
    strokeColor = "#10B981";
    Icon = ShieldCheck;
  } else if (score >= 680) {
    tierName = "Prime";
    tierColor = "text-emerald-400";
    bgTier = "bg-emerald-500/10 border-emerald-500/30";
    strokeColor = "#10B981";
    Icon = ShieldCheck;
  } else if (score >= 620) {
    tierName = "Near Prime";
    tierColor = "text-amber-400";
    bgTier = "bg-amber-500/10 border-amber-500/30";
    strokeColor = "#F59E0B";
    Icon = AlertTriangle;
  } else if (score >= 550) {
    tierName = "Subprime";
    tierColor = "text-orange-400";
    bgTier = "bg-orange-500/10 border-orange-500/30";
    strokeColor = "#FB923C";
    Icon = ShieldAlert;
  }

  // Calculate SVG arc parameters
  const radius = 80;
  const strokeWidth = 14;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // Half-circle gauge: strokeDashoffset for 180 degrees
  const halfCircumference = circumference / 2;
  const strokeDashoffset =
    halfCircumference - (percentage / 100) * halfCircumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
      <div className="flex items-center justify-between w-full mb-2">
        <span className="text-sm font-bold tracking-wider text-slate-400 uppercase">
          Point Scorecard (FICO Standard)
        </span>
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${bgTier} ${tierColor}`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{tierName}</span>
        </div>
      </div>

      {/* Semi-Circular SVG Gauge */}
      <div className="relative flex items-center justify-center w-56 h-32 mt-2">
        <svg
          viewBox="0 0 180 100"
          className="w-full h-full transform -rotate-180"
        >
          {/* Background Track */}
          <path
            d="M 10 90 A 80 80 0 0 1 170 90"
            fill="none"
            stroke="#1E293B"
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
          <div className="text-5xl font-black tracking-tight text-white">
            {score}
          </div>
          <div className="text-xs font-medium text-slate-400">
            Scale: 300 – 850
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 w-full mt-4 pt-4 border-t border-slate-800/80 text-center">
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/50">
          <div className="text-xs font-semibold text-slate-400">
            Probability of Default (PD)
          </div>
          <div
            className={`text-xl font-bold mt-0.5 ${
              pd <= 0.18 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {(pd * 100).toFixed(2)}%
          </div>
        </div>
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/50">
          <div className="text-xs font-semibold text-slate-400">
            Approval Cut-off
          </div>
          <div className="text-xl font-bold text-slate-200 mt-0.5">
            {cutoffScore} pts (18.0% PD)
          </div>
        </div>
      </div>
    </div>
  );
}
