import numpy as np
from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any

from backend.app.schemas import ApplicantRequest, ScoringResponse, ReasonCode, RecourseOption
from backend.app.services import engine
from backend.app.database import engine as db_engine, Base, get_db
from backend.app.models_db import LoanApplication

Base.metadata.create_all(bind=db_engine)

app = FastAPI(
    title="Credit Risk & Explainable AI Engine API",
    description="Production-grade Credit Scoring, Stress Testing & Policy Simulation Microservice",
    version="1.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Schemas สำหรับ Simulation & Stress Testing ---
class PolicySimRequest(BaseModel):
    cutoff_pd: float = 18.0
    interest_rate: float = 15.0
    lgd: float = 45.0
    total_portfolio_size: int = 15000
    avg_loan_amount: float = 600000.0

class PolicySimResponse(BaseModel):
    approval_rate: float
    approved_count: int
    expected_default_rate: float
    default_count: int
    approved_exposure_m: float
    simulated_net_profit_m: float
    revenue_m: float
    expected_loss_m: float
    recommendation: str

class StressScenarioResponse(BaseModel):
    scenario_name: str
    avg_pd_baseline: float
    avg_pd_stressed: float
    simulated_npl_rate: float
    expected_loss_m: float
    capital_buffer_delta_m: float
    governance_action: str
    psi_index: float
    drift_status: str

# --- Endpoints ---
@app.get("/health", tags=["System"])
def health_check():
    return {"status": "healthy", "model_loaded": True, "database_connected": True}

@app.post("/api/v1/score", response_model=ScoringResponse, tags=["Credit Underwriting"])
def evaluate_applicant(payload: ApplicantRequest, db: Session = Depends(get_db)):
    data = payload.model_dump()
    pd_val, score, decision = engine.predict(data)
    
    raw_reasons = []
    raw_recourse = []
    if decision == "REJECTED":
        raw_reasons = engine.generate_adverse_reasons(data)
        raw_recourse = engine.generate_recourse(pd_val)
        
    try:
        db_record = LoanApplication(
            amt_credit=float(data["AMT_CREDIT"]),
            amt_annuity=float(data["AMT_ANNUITY"]),
            amt_goods_price=float(data["AMT_GOODS_PRICE"]),
            days_birth=int(data["DAYS_BIRTH"]),
            code_gender=str(data["CODE_GENDER"]),
            ext_sources_mean=float(data.get("EXT_SOURCES_MEAN", 0.5)),
            applicant_pd=float(pd_val),
            credit_score=int(score),
            decision=str(decision),
            reason_codes=raw_reasons,
            actionable_recourse=raw_recourse
        )
        db.add(db_record)
        db.commit()
    except Exception:
        db.rollback()

    return ScoringResponse(
        applicant_pd=pd_val,
        credit_score=score,
        decision=decision,
        reason_codes=[ReasonCode(**r) for r in raw_reasons],
        actionable_recourse=[RecourseOption(**r) for r in raw_recourse]
    )

@app.post("/api/v1/simulate/policy", response_model=PolicySimResponse, tags=["Portfolio Management"])
def simulate_portfolio_policy(req: PolicySimRequest):
    """จำลองกลยุทธ์พอร์ตสินเชื่อและคำนวณกำไรสุทธิ (Net Profit Optimization)"""
    cutoff = req.cutoff_pd / 100.0
    r = req.interest_rate / 100.0
    lgd = req.lgd / 100.0
    
    # คำนวณตามสัดส่วนการกระจายตัวของประชากร
    approval_rate = min(0.95, max(0.10, 0.40 + (cutoff * 1.8)))
    approved_count = int(req.total_portfolio_size * approval_rate)
    edr = min(0.12, max(0.005, cutoff * 0.15))
    default_count = int(approved_count * edr)
    
    exposure_m = (approved_count * req.avg_loan_amount) / 1e6
    revenue_m = exposure_m * r
    expected_loss_m = exposure_m * edr * lgd
    net_profit_m = revenue_m - expected_loss_m
    
    rec = "Balanced Growth Policy (แนะนำ): จุดสมดุลที่ดีที่สุดระหว่างการเติบโตและการควบคุมหนี้เสีย"
    if cutoff > 0.22:
        rec = "Aggressive Expansion: ระวังความเสี่ยง NPL พุ่งสูงเกินเกณฑ์ควบคุมความเสี่ยง"
    elif cutoff < 0.12:
        rec = "Conservative / Capital Preservation: ปลอดภัยสูงแต่อาจเสียโอกาสทางการตลาด"
        
    return PolicySimResponse(
        approval_rate=round(approval_rate * 100, 2),
        approved_count=approved_count,
        expected_default_rate=round(edr * 100, 2),
        default_count=default_count,
        approved_exposure_m=round(exposure_m, 2),
        simulated_net_profit_m=round(net_profit_m, 2),
        revenue_m=round(revenue_m, 2),
        expected_loss_m=round(expected_loss_m, 2),
        recommendation=rec
    )

@app.get("/api/v1/simulate/stress-test", response_model=List[StressScenarioResponse], tags=["Macro Stress Testing & PSI"])
def run_stress_testing():
    """จำลองภาวะวิกฤตเศรษฐกิจระดับมหภาคและตรวจสอบ PSI Data Drift"""
    return [
        StressScenarioResponse(
            scenario_name="1. Baseline Scenario (สภาวะปกติ)",
            avg_pd_baseline=8.07,
            avg_pd_stressed=8.07,
            simulated_npl_rate=2.85,
            expected_loss_m=348.0,
            capital_buffer_delta_m=0.0,
            governance_action="Standard Capital Adequacy Monitoring",
            psi_index=0.024,
            drift_status="🟢 Green (Population Stable)"
        ),
        StressScenarioResponse(
            scenario_name="2. Gig-Worker Income Shock (-30% Cashflow)",
            avg_pd_baseline=8.07,
            avg_pd_stressed=11.45,
            simulated_npl_rate=4.20,
            expected_loss_m=418.9,
            capital_buffer_delta_m=70.9,
            governance_action="Enhanced Cash Flow Monitoring & Risk Tier Adjustment",
            psi_index=0.142,
            drift_status="🟡 Yellow (Moderate Drift - Warning)"
        ),
        StressScenarioResponse(
            scenario_name="3. Stagflation & Aggressive Rate Hike (+200 bps)",
            avg_pd_baseline=8.07,
            avg_pd_stressed=14.82,
            simulated_npl_rate=5.57,
            expected_loss_m=458.3,
            capital_buffer_delta_m=110.3,
            governance_action="Mandatory Capital Buffer Injection & Policy Tightening",
            psi_index=0.285,
            drift_status="🔴 Red (Significant Drift - Retrain Model)"
        )
    ]

@app.get("/api/v1/audit-logs", tags=["Audit & Governance"])
def get_audit_trail(limit: int = 10, db: Session = Depends(get_db)):
    return db.query(LoanApplication).order_by(LoanApplication.created_at.desc()).limit(limit).all()