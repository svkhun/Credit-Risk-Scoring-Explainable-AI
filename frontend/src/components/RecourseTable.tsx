"use client";

import React from "react";
import { Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { RecourseOption } from "@/lib/api";

interface RecourseTableProps {
  recourse: RecourseOption[];
}

export function RecourseTable({ recourse }: RecourseTableProps) {
  if (!recourse || recourse.length === 0) return null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-2 text-emerald-400">
        <Sparkles className="w-5 h-5" />
        <h3 className="text-lg font-bold tracking-wide text-white">
          แนวทางการปรับปรุงเงื่อนไขสินเชื่อ (Actionable Counterfactual Recourse)
        </h3>
      </div>
      <p className="text-sm text-slate-400">
        การปรับเปลี่ยนเงื่อนไขทางการเงินที่จำลองแล้วสามารถช่วยให้ใบสมัครผ่านเกณฑ์อนุมัติ:
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="pb-3 px-2">มาตรการปรับปรุง</th>
              <th className="pb-3 px-2 text-center">Simulated PD</th>
              <th className="pb-3 px-2 text-right">สถานะใหม่</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {recourse.map((item, idx) => {
              const isApproved = item.new_status === "APPROVED";
              return (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-2 font-medium text-slate-200">
                    {item.action}
                  </td>
                  <td className="py-3.5 px-2 text-center font-mono font-bold text-slate-300">
                    {(item.simulated_pd * 100).toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-2 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        isApproved
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {isApproved ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      {isApproved ? "Approved" : "Review"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
