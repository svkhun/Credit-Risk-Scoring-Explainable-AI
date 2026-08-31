from pydantic import BaseModel, Field
from typing import Optional, List

class ApplicantRequest(BaseModel):
    AMT_CREDIT: float = Field(..., description="วงเงินสินเชื่อที่ขอ", json_schema_extra={"example": 343800.0})
    AMT_ANNUITY: float = Field(..., description="ภาระค่างวดต่อเดือน", json_schema_extra={"example": 16155.0})
    AMT_GOODS_PRICE: float = Field(..., description="ราคาสินค้า/หลักประกัน", json_schema_extra={"example": 225000.0})
    DAYS_BIRTH: int = Field(..., description="อายุผู้กู้ (หน่วยเป็นวัน ติดลบ)", json_schema_extra={"example": -12000})
    CODE_GENDER: str = Field(..., description="เพศ (M/F)", json_schema_extra={"example": "M"})
    EXT_SOURCES_MEAN: Optional[float] = Field(0.5, description="คะแนนเฉลี่ยจากสถาบันภายนอก", json_schema_extra={"example": 0.123})
    EXT_SOURCE_3: Optional[float] = Field(0.5, description="คะแนนภายนอกแหล่งที่ 3", json_schema_extra={"example": 0.156})
    BURO_DAYS_CREDIT_MAX: Optional[float] = Field(-30.0, description="จำนวนวันนับจากเครดิตล่าสุด", json_schema_extra={"example": -5.0})
    cash_flow_volatility: Optional[float] = Field(0.2, description="ความผันผวนของกระแสเงินสด", json_schema_extra={"example": 0.45})

class ReasonCode(BaseModel):
    code: str
    factor: str
    description: str
    action_recommendation: str

class RecourseOption(BaseModel):
    action: str
    simulated_pd: float
    new_status: str

class ScoringResponse(BaseModel):
    applicant_pd: float
    credit_score: int
    decision: str
    reason_codes: List[ReasonCode]
    actionable_recourse: List[RecourseOption]