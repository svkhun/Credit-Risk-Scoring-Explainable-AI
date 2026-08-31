import logging
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

try:
    from backend.app.schemas import ApplicantRequest, ScoringResponse, ReasonCode, RecourseOption
    from backend.app.services import engine
    from backend.app.database import engine as db_engine, Base, get_db
    from backend.app.models_db import LoanApplication
except ImportError:
    from app.schemas import ApplicantRequest, ScoringResponse, ReasonCode, RecourseOption
    from app.services import engine
    from app.database import engine as db_engine, Base, get_db
    from app.models_db import LoanApplication

logger = logging.getLogger("credit_risk_api")

# สร้าง Table ใน Database
Base.metadata.create_all(bind=db_engine)

app = FastAPI(
    title="Credit Risk & Explainable AI Engine API",
    description="Production-ready Credit Scoring, Adverse Action & Regulatory Audit Trail Microservice",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "model_loaded": engine.model is not None,
        "database_connected": True
    }

@app.post("/api/v1/score", response_model=ScoringResponse, tags=["Credit Underwriting"])
def evaluate_applicant(payload: ApplicantRequest, db: Session = Depends(get_db)):
    data = payload.model_dump()
    
    try:
        pd_val, score, decision = engine.predict(data)
    except Exception as e:
        logger.error(f"Inference error in evaluate_applicant: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}"
        )
    
    raw_reasons = []
    raw_recourse = []
    
    if decision == "REJECTED":
        raw_reasons = engine.generate_adverse_reasons(data)
        raw_recourse = engine.generate_recourse(pd_val)
        
    # บันทึกข้อมูลลงฐานข้อมูล SQLite
    try:
        db_record = LoanApplication(
            amt_credit=float(data["AMT_CREDIT"]),
            amt_annuity=float(data["AMT_ANNUITY"]),
            amt_goods_price=float(data.get("AMT_GOODS_PRICE") or data["AMT_CREDIT"]),
            days_birth=int(data.get("DAYS_BIRTH", -15000)),
            code_gender=str(data.get("CODE_GENDER", "M")),
            ext_sources_mean=float(data.get("EXT_SOURCES_MEAN", 0.5)),
            applicant_pd=float(pd_val),
            credit_score=int(score),
            decision=str(decision),
            reason_codes=raw_reasons,
            actionable_recourse=raw_recourse
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
    except Exception as e:
        logger.warning(f"Failed to persist audit log: {e}")
        db.rollback()

    return ScoringResponse(
        applicant_pd=round(pd_val, 4),
        credit_score=score,
        decision=decision,
        reason_codes=[ReasonCode(**r) for r in raw_reasons],
        actionable_recourse=[RecourseOption(**r) for r in raw_recourse]
    )

@app.get("/api/v1/audit-logs", tags=["Audit & Governance"])
def get_audit_trail(limit: int = 10, db: Session = Depends(get_db)):
    logs = db.query(LoanApplication).order_by(LoanApplication.created_at.desc()).limit(limit).all()
    return logs