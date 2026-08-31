"use client";

import React from "react";
import { Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { RecourseOption } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { RECOURSE_DICT } from "@/lib/translations";

interface RecourseTableProps {
  recourse: RecourseOption[];
}

export function RecourseTable({ recourse }: RecourseTableProps) {
  const { t, lang } = useLanguage();

  if (!recourse || recourse.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow space-y-4">
      <div className="flex items-center gap-2.5 text-emerald-700">
        <Sparkles className="w-6 h-6 shrink-0 text-emerald-600" />
        <h3 className="text-lg sm:text-xl font-bold tracking-wide text-slate-900">
          {t.recourseTitle}
        </h3>
      </div>
      <p className="text-base text-slate-600 leading-relaxed">
        {t.recourseSubtitle}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-base">
          <thead>
            <tr className="border-b border-slate-200 text-sm font-bold text-slate-700 uppercase tracking-wider bg-slate-50">
              <th className="py-4 px-5 rounded-l-xl">{t.measureHeader}</th>
              <th className="py-4 px-5 text-center">{t.simulatedPDHeader}</th>
              <th className="py-4 px-5 text-right rounded-r-xl">{t.newStatusHeader}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recourse.map((item, idx) => {
              const isApproved = item.new_status === "APPROVED";
              const actionText =
                lang === "en"
                  ? RECOURSE_DICT[item.action]?.en || item.action
                  : RECOURSE_DICT[item.action]?.th || item.action;

              return (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5 font-semibold text-slate-800 text-base">
                    {actionText}
                  </td>
                  <td className="py-4 px-5 text-center font-mono font-bold text-slate-900 text-base">
                    {(item.simulated_pd * 100).toFixed(1)}%
                  </td>
                  <td className="py-4 px-5 text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold ${
                        isApproved
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {isApproved ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
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
