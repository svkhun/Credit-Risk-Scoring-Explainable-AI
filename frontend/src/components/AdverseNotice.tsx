"use client";

import React from "react";
import { AlertOctagon, Lightbulb } from "lucide-react";
import { ReasonCode } from "@/lib/api";

interface AdverseNoticeProps {
  reasons: ReasonCode[];
}

export function AdverseNotice({ reasons }: AdverseNoticeProps) {
  if (!reasons || reasons.length === 0) return null;

  return (
    <div className="bg-slate-900/90 border border-red-500/30 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-2.5 text-red-400">
        <AlertOctagon className="w-5 h-5" />
        <h3 className="text-lg font-bold tracking-wide text-white">
          หนังสือแจ้งเหตุผลแห่งการปฏิเสธ (Adverse Action Notice - FCRA / ECOA)
        </h3>
      </div>
      <p className="text-sm text-slate-400">
        ตามเกณฑ์การกำกับดูแลความเสี่ยงสากล ระบบได้ระบุปัจจัยสำคัญที่สุดที่ส่งผลกระทบต่อคะแนนเครดิต:
      </p>

      <div className="space-y-3">
        {reasons.map((r, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-slate-950/70 border-l-4 border-red-500 border-y border-r border-slate-800"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-wider text-red-400 uppercase">
                [{r.code}] {r.factor}
              </span>
            </div>
            <div className="text-sm font-medium text-slate-200 mt-1">
              {r.description}
            </div>
            <div className="flex items-start gap-2 mt-2.5 pt-2.5 border-t border-slate-800/80 text-xs text-emerald-400 font-semibold">
              <Lightbulb className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>คำแนะนำเพื่อการปรับปรุง: {r.action_recommendation}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
