"use client";

import React, { useState, useEffect } from "react";
import { History, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { AuditLogRecord, fetchAuditLogs } from "@/lib/api";

interface AuditTrailProps {
  refreshTrigger?: number;
}

export function AuditTrail({ refreshTrigger = 0 }: AuditTrailProps) {
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
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-slate-200">
          <History className="w-5 h-5 text-sky-400" />
          <h3 className="text-lg font-bold tracking-wide text-white">
            บันทึกการประเมินย้อนหลัง (Regulatory Audit Trail)
          </h3>
        </div>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          รีเฟรช
        </button>
      </div>

      {error ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {error} (กรุณาตรวจสอบว่า FastAPI backend รันอยู่ที่ port 8000)
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-sm text-slate-500">
          {loading ? "กำลังโหลดประวัติ..." : "ยังไม่มีประวัติการประเมินสินเชื่อ"}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 px-2">ID</th>
                <th className="pb-3 px-2">เวลาประเมิน</th>
                <th className="pb-3 px-2">วงเงินกู้ (THB)</th>
                <th className="pb-3 px-2">ค่างวด/เดือน</th>
                <th className="pb-3 px-2 text-center">PD (%)</th>
                <th className="pb-3 px-2 text-center">Score</th>
                <th className="pb-3 px-2 text-right">ผลการพิจารณา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {logs.map((log) => {
                const isApproved = log.decision === "APPROVED";
                const formattedDate = new Date(log.created_at).toLocaleTimeString(
                  "th-TH",
                  { hour: "2-digit", minute: "2-digit", second: "2-digit" }
                );
                return (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-2 text-slate-400">#{log.id}</td>
                    <td className="py-3 px-2 font-sans text-slate-300">
                      {formattedDate}
                    </td>
                    <td className="py-3 px-2 text-slate-200">
                      {log.amt_credit.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-slate-200">
                      {log.amt_annuity.toLocaleString()}
                    </td>
                    <td
                      className={`py-3 px-2 text-center font-bold ${
                        log.applicant_pd <= 0.18
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {(log.applicant_pd * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-white">
                      {log.credit_score}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          isApproved
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/15 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {isApproved ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
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
