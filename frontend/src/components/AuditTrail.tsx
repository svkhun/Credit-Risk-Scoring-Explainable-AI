"use client";

import React, { useState, useEffect } from "react";
import { History, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { AuditLogRecord, fetchAuditLogs } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

interface AuditTrailProps {
  refreshTrigger?: number;
}

export function AuditTrail({ refreshTrigger = 0 }: AuditTrailProps) {
  const { t, lang } = useLanguage();
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAuditLogs(8);
      setLogs(data);
    } catch (err: any) {
      setError(err.message || "Failed to load audit trail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [refreshTrigger]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-slate-900">
          <History className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold tracking-wide text-slate-900">
            {t.auditTitle}
          </h3>
        </div>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? "animate-spin" : ""}`} />
          {t.refreshBtn}
        </button>
      </div>

      {error ? (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {error} (FastAPI port 8000)
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-base text-slate-500">
          {loading ? t.loadingAudit : t.emptyAudit}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead>
              <tr className="border-b border-slate-200 text-sm font-bold text-slate-700 uppercase tracking-wider bg-slate-50/70">
                <th className="py-3.5 px-4 rounded-l-xl">{t.auditId}</th>
                <th className="py-3.5 px-4">{t.auditTime}</th>
                <th className="py-3.5 px-4">{t.auditCredit}</th>
                <th className="py-3.5 px-4">{t.auditAnnuity}</th>
                <th className="py-3.5 px-4 text-center">{t.auditPD}</th>
                <th className="py-3.5 px-4 text-center">{t.auditScore}</th>
                <th className="py-3.5 px-4 text-right rounded-r-xl">{t.auditDecision}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-sm">
              {logs.map((log) => {
                const isApproved = log.decision === "APPROVED";
                const formattedDate = new Date(log.created_at).toLocaleTimeString(
                  lang === "th" ? "th-TH" : "en-US",
                  { hour: "2-digit", minute: "2-digit", second: "2-digit" }
                );
                return (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-slate-500">#{log.id}</td>
                    <td className="py-3.5 px-4 font-sans text-slate-800">
                      {formattedDate}
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 font-semibold">
                      {log.amt_credit.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {log.amt_annuity.toLocaleString()}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-center font-bold ${
                        log.applicant_pd <= 0.18
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      {(log.applicant_pd * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                      {log.credit_score}
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          isApproved
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {isApproved ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {log.decision}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
