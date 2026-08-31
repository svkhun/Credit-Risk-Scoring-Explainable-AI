export interface ApplicantPayload {
  AMT_CREDIT: number;
  AMT_ANNUITY: number;
  AMT_GOODS_PRICE: number;
  DAYS_BIRTH: number;
  CODE_GENDER: string;
  EXT_SOURCES_MEAN?: number;
  EXT_SOURCE_3?: number;
  BURO_DAYS_CREDIT_MAX?: number;
  cash_flow_volatility?: number;
}

export interface ReasonCode {
  code: string;
  factor: string;
  description: string;
  action_recommendation: string;
}

export interface RecourseOption {
  action: string;
  simulated_pd: number;
  new_status: string;
}

export interface ScoringResponse {
  applicant_pd: number;
  credit_score: number;
  decision: "APPROVED" | "REJECTED";
  reason_codes: ReasonCode[];
  actionable_recourse: RecourseOption[];
}

export interface AuditLogRecord {
  id: number;
  created_at: string;
  amt_credit: number;
  amt_annuity: number;
  amt_goods_price: number;
  days_birth: number;
  code_gender: string;
  ext_sources_mean: number | null;
  applicant_pd: number;
  credit_score: number;
  decision: string;
  reason_codes?: ReasonCode[];
  actionable_recourse?: RecourseOption[];
}

export interface PolicySimRequest {
  cutoff_pd: number;
  interest_rate: number;
  lgd: number;
  total_portfolio_size?: number;
  avg_loan_amount?: number;
}

export interface PolicySimResponse {
  approval_rate: number;
  approved_count: number;
  expected_default_rate: number;
  default_count: number;
  approved_exposure_m: number;
  simulated_net_profit_m: number;
  revenue_m: number;
  expected_loss_m: number;
  recommendation: string;
}

export interface StressScenarioResponse {
  scenario_name: string;
  avg_pd_baseline: number;
  avg_pd_stressed: number;
  simulated_npl_rate: number;
  expected_loss_m: number;
  capital_buffer_delta_m: number;
  governance_action: string;
  psi_index: number;
  drift_status: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function evaluateApplicant(
  payload: ApplicantPayload
): Promise<ScoringResponse> {
  const response = await fetch(`${API_BASE}/api/v1/score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = "Failed to evaluate credit risk";
    try {
      const err = await response.json();
      errorDetail = err.detail || errorDetail;
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function simulatePolicy(
  req: PolicySimRequest
): Promise<PolicySimResponse> {
  const response = await fetch(`${API_BASE}/api/v1/simulate/policy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    throw new Error("Failed to simulate policy optimization");
  }

  return response.json();
}

export async function fetchStressScenarios(): Promise<StressScenarioResponse[]> {
  const response = await fetch(`${API_BASE}/api/v1/simulate/stress-test`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch stress testing scenarios");
  }

  return response.json();
}

export async function fetchAuditLogs(limit: number = 10): Promise<AuditLogRecord[]> {
  const response = await fetch(`${API_BASE}/api/v1/audit-logs?limit=${limit}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch audit logs");
  }

  return response.json();
}
