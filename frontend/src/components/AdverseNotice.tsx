"use client";

import React from "react";
import { AlertOctagon, Lightbulb } from "lucide-react";
import { ReasonCode } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { REASON_CODES_DICT } from "@/lib/translations";

interface AdverseNoticeProps {
  reasons: ReasonCode[];
}

export function AdverseNotice({ reasons }: AdverseNoticeProps) {
  const { t, lang } = useLanguage();

  if (!reasons || reasons.length === 0) return null;

  return (
    <div className="bg-rose-50/60 border border-rose-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
      <div className="flex items-center gap-2.5 text-rose-700">
        <AlertOctagon className="w-6 h-6 shrink-0 text-rose-600" />
        <h3 className="text-lg sm:text-xl font-bold tracking-wide text-rose-900">
          {t.adverseNoticeTitle}
        </h3>
      </div>
      <p className="text-base text-slate-700 leading-relaxed">
        {t.adverseNoticeSubtitle}
      </p>

      <div className="space-y-4">
        {reasons.map((r, idx) => {
          const dictItem = REASON_CODES_DICT[r.code];
          const factor = lang === "en" ? (dictItem?.factor_en || r.factor) : (dictItem?.factor_th || r.factor);
          const description = lang === "en" ? (dictItem?.desc_en || r.description) : (dictItem?.desc_th || r.description);
          const recommendation = lang === "en" ? (dictItem?.action_en || r.action_recommendation) : (dictItem?.action_th || r.action_recommendation);

          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-rose-200/90 border-l-4 border-l-rose-500 shadow-xs space-y-2"
            >
              <div className="text-lg font-bold text-slate-900">
                <span className="text-rose-700 font-extrabold mr-2">[{r.code}]</span>
                {factor}
              </div>
              <div className="text-base text-slate-700 leading-relaxed">
                {description}
              </div>
              <div className="flex items-start gap-2.5 mt-3 pt-3 border-t border-slate-100 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/70 text-base text-emerald-900 font-semibold leading-relaxed">
                <Lightbulb className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                <span>
                  <strong className="text-emerald-800 font-bold">{t.recourseAdvice}:</strong> {recommendation}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
