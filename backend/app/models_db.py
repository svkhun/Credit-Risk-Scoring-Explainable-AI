from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, JSON

try:
    from backend.app.database import Base
except ImportError:
    from app.database import Base


class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # ข้อมูลผู้กู้
    amt_credit = Column(Float, nullable=False)
    amt_annuity = Column(Float, nullable=False)
    amt_goods_price = Column(Float, nullable=False)
    days_birth = Column(Integer, nullable=False)
    code_gender = Column(String(10), nullable=False)
    ext_sources_mean = Column(Float, nullable=True)
    
    # ผลการประเมิน
    applicant_pd = Column(Float, nullable=False)
    credit_score = Column(Integer, nullable=False)
    decision = Column(String(20), nullable=False)
    
    # JSON เก็บ Reason Codes และ Recourse
    reason_codes = Column(JSON, nullable=True)
    actionable_recourse = Column(JSON, nullable=True)