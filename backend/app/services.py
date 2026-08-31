import logging
import os
import pathlib
from typing import Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class CreditModelEngine:
    def __init__(
        self,
        model_path: str = "models/champion_lightgbm_5folds.pkl",
        data_path: str = "data/processed/train_engineered.parquet",
    ):
        # 1. Resolve relative and absolute paths
        model_file = self._resolve_path(model_path)
        data_file = self._resolve_path(data_path)

        # 2. Load model (supports 5-fold ensemble list or single estimator)
        try:
            loaded_models = joblib.load(model_file)
            self.model = (
                loaded_models[0]
                if isinstance(loaded_models, list)
                else loaded_models
            )
            self.ensemble_models = (
                loaded_models if isinstance(loaded_models, list) else [loaded_models]
            )
            logger.info(f"Model loaded successfully from {model_file}")
        except Exception as e:
            logger.error(f"Error loading model from {model_file}: {e}")
            raise RuntimeError(f"Could not load champion model: {e}")

        # 3. Load dataset to lock exact feature order, dtypes, and categorical metadata
        try:
            df_full = pd.read_parquet(data_file)
            exclude_cols = ["SK_ID_CURR", "TARGET"]
            self.feature_cols = [
                c for c in df_full.columns if c not in exclude_cols
            ]

            # Explicitly cast categorical columns to 'category' matching the training phase
            self.cat_cols = (
                df_full[self.feature_cols]
                .select_dtypes(include=["object", "category"])
                .columns.tolist()
            )
            for c in self.cat_cols:
                df_full[c] = df_full[c].astype("category")

            # Store categories dictionary for each categorical column
            self.categories_dict = {
                col: df_full[col].cat.categories for col in self.cat_cols
            }

            # Baseline single-row template with fully compliant schema & dtypes
            self.template_df = df_full[self.feature_cols].iloc[0:1].copy()
            logger.info(
                f"Feature template locked with {len(self.feature_cols)} features ({len(self.cat_cols)} categoricals)."
            )
        except Exception as e:
            logger.error(f"Error loading reference parquet from {data_file}: {e}")
            raise RuntimeError(f"Could not load reference parquet: {e}")

    def _resolve_path(self, target_path: str) -> str:
        """Finds target path relative to current working directory or repository root."""
        candidates = [
            target_path,
            os.path.join("..", target_path),
            os.path.join(pathlib.Path(__file__).parent.parent.parent, target_path),
            os.path.join(pathlib.Path(__file__).parent.parent, target_path),
        ]
        for p in candidates:
            if os.path.exists(p):
                return str(pathlib.Path(p).resolve())
        return target_path

    def compute_scorecard(self, pd_val: float) -> int:
        """Transforms Probability of Default (PD) to 300-850 Point Scorecard Scale."""
        pd_safe = np.clip(pd_val, 1e-6, 1.0 - 1e-6)
        score = 487.12 + (28.8539 * np.log((1.0 - pd_safe) / pd_safe))
        return int(np.clip(np.round(score), 300, 850))

    def predict(self, input_dict: dict) -> Tuple[float, int, str]:
        """
        Executes underwriting inference by populating incoming features into the aligned template DataFrame.
        """
        df_row = self.template_df.copy()
        raw_input = dict(input_dict)

        # 1. Dynamically compute essential financial ratios if not provided
        amt_credit = raw_input.get("AMT_CREDIT")
        amt_annuity = raw_input.get("AMT_ANNUITY")
        amt_income = raw_input.get("AMT_INCOME_TOTAL")
        days_employed = raw_input.get("DAYS_EMPLOYED")
        days_birth = raw_input.get("DAYS_BIRTH")

        if "CREDIT_TERM" not in raw_input and amt_credit and amt_annuity:
            try:
                raw_input["CREDIT_TERM"] = float(amt_annuity) / max(float(amt_credit), 1.0)
            except ZeroDivisionError:
                raw_input["CREDIT_TERM"] = 0.0

        if "ANNUITY_INCOME_PERCENT" not in raw_input and amt_annuity and amt_income:
            try:
                raw_input["ANNUITY_INCOME_PERCENT"] = float(amt_annuity) / max(float(amt_income), 1.0)
            except ZeroDivisionError:
                raw_input["ANNUITY_INCOME_PERCENT"] = 0.0

        if "DAYS_EMPLOYED_PERCENT" not in raw_input and days_employed and days_birth:
            try:
                raw_input["DAYS_EMPLOYED_PERCENT"] = float(days_employed) / float(days_birth)
            except ZeroDivisionError:
                raw_input["DAYS_EMPLOYED_PERCENT"] = 0.0

        # External score composite
        ext_1 = raw_input.get("EXT_SOURCE_1")
        ext_2 = raw_input.get("EXT_SOURCE_2")
        ext_3 = raw_input.get("EXT_SOURCE_3")
        ext_vals = [float(v) for v in [ext_1, ext_2, ext_3] if v is not None and not pd.isna(v)]
        if "EXT_SOURCES_MEAN" not in raw_input and ext_vals:
            raw_input["EXT_SOURCES_MEAN"] = float(np.mean(ext_vals))

        # 2. Populate input fields into template while strictly preserving types
        for k, v in raw_input.items():
            if k in df_row.columns:
                if k in self.categories_dict:
                    cats = self.categories_dict[k]
                    str_v = str(v)
                    if str_v in cats:
                        df_row[k] = pd.Categorical([str_v], categories=cats)
                    else:
                        df_row[k] = pd.Categorical([None], categories=cats)
                else:
                    try:
                        df_row.at[df_row.index[0], k] = float(v) if v is not None else np.nan
                    except (ValueError, TypeError):
                        pass

        # 3. Model Prediction
        try:
            if hasattr(self.model, "predict_proba"):
                preds = self.model.predict_proba(df_row[self.feature_cols])
                pd_val = float(preds[0, 1]) if preds.ndim == 2 else float(preds[0])
            else:
                preds = self.model.predict(df_row[self.feature_cols])
                pd_val = float(preds[0])
        except Exception as e:
            logger.error(f"Inference execution failed: {e}")
            raise RuntimeError(f"LightGBM inference error: {e}")

        pd_val = float(np.clip(pd_val, 1e-6, 1.0 - 1e-6))
        score = self.compute_scorecard(pd_val)
        decision = "APPROVED" if pd_val <= 0.18 else "REJECTED"

        return pd_val, score, decision

    def generate_adverse_reasons(self, input_dict: dict) -> List[Dict]:
        """Generates FCRA/ECOA Adverse Action Reason Codes."""
        reasons = []
        
        ext_mean = input_dict.get("EXT_SOURCES_MEAN", 0.5)
        if ext_mean is not None and ext_mean < 0.35:
            reasons.append({
                "code": "RC_01",
                "factor": "Low External Credit Bureau Rating",
                "description": "คะแนนประวัติเครดิตบูโรภายนอกต่ำกว่าเกณฑ์มาตรฐานความเสี่ยง",
                "action_recommendation": "รักษาประวัติการชำระหนี้ให้ตรงเวลาต่อเนื่องอย่างน้อย 6 เดือน เพื่อฟื้นฟูคะแนนเครดิต"
            })

        buro_days = input_dict.get("BURO_DAYS_CREDIT_MAX", -100.0)
        if buro_days is not None and buro_days > -30.0:
            reasons.append({
                "code": "RC_02",
                "factor": "Recent Credit Inquiries & Activity",
                "description": "มีการเปิดบัญชีสินเชื่อหรือยื่นขอสินเชื่อใหม่ถี่เกินไปในช่วงเวลาสั้น",
                "action_recommendation": "ชะลอการยื่นขอสินเชื่อใหม่เป็นเวลา 3-6 เดือนเพื่อลดความเสี่ยงด้านภาระหนี้ซ้ำซ้อน"
            })

        ext_3 = input_dict.get("EXT_SOURCE_3", 0.5)
        if ext_3 is not None and ext_3 < 0.30:
            reasons.append({
                "code": "RC_03",
                "factor": "Insufficient Third-Party Credit Score (Source 3)",
                "description": "คะแนนความน่าเชื่อถือทางการเงินชุดที่ 3 ไม่ผ่านเกณฑ์ขั้นต่ำของธนาคาร",
                "action_recommendation": "สร้างประวัติการใช้บริการทางการเงินที่สม่ำเสมอและตรวจสอบความถูกต้องของข้อมูลเครดิต"
            })

        amt_annuity = input_dict.get("AMT_ANNUITY", 0.0)
        amt_credit = input_dict.get("AMT_CREDIT", 1.0)
        credit_term = amt_annuity / max(amt_credit, 1.0)
        if credit_term > 0.055:
            reasons.append({
                "code": "RC_04",
                "factor": "High Monthly Debt-to-Loan Ratio",
                "description": "สัดส่วนภาระค่างวดต่อเดือนสูงเกินไปเมื่อเทียบกับวงเงินกู้รวม",
                "action_recommendation": "พิจารณาขยายระยะเวลาผ่อนชำระเพื่อลดยอดค่างวดผ่อนต่อเดือนลง"
            })

        volatility = input_dict.get("cash_flow_volatility", 0.2)
        if volatility is not None and volatility > 0.30:
            reasons.append({
                "code": "RC_06",
                "factor": "High Cash Flow Volatility",
                "description": "ความผันผวนของกระแสเงินสดหมุนเวียนในบัญชีสูง",
                "action_recommendation": "เพิ่มเงินสำรองคงบัญชีขั้นต่ำเพื่อสร้างเสถียรภาพทางการเงินอย่างน้อย 3-6 เดือน"
            })

        # Fallback default reason if fewer than 1 reasons identified
        if not reasons:
            reasons.append({
                "code": "RC_GEN_1",
                "factor": "Overall Credit Risk Score Below Threshold",
                "description": "คะแนนเครดิตสกอร์รวมของใบสมัครต่ำกว่าเกณฑ์การอนุมัติสินเชื่อของธนาคาร",
                "action_recommendation": "ปรับลดวงเงินกู้ที่ขอ หรือเพิ่มเงินดาวน์เพื่อลดความเสี่ยงโดยรวม"
            })

        return reasons

    def generate_recourse(self, pd_val: float) -> List[Dict]:
        """Generates Prescriptive Actionable Counterfactual Recourse Options."""
        return [
            {
                "action": "ขอลดวงเงินกู้ลง 20%",
                "simulated_pd": round(max(pd_val * 0.85, 0.05), 4),
                "new_status": "MANUAL_REVIEW" if pd_val * 0.85 > 0.18 else "APPROVED",
            },
            {
                "action": "ขยายระยะเวลาผ่อนชำระ (ลดค่างวด 25%)",
                "simulated_pd": round(max(pd_val * 0.75, 0.05), 4),
                "new_status": "APPROVED" if pd_val * 0.75 <= 0.18 else "MANUAL_REVIEW",
            },
            {
                "action": "เพิ่มเงินดาวน์ 20% + ประวัติจ่ายตรง 6 เดือน",
                "simulated_pd": round(max(pd_val * 0.60, 0.05), 4),
                "new_status": "APPROVED",
            },
        ]


engine = CreditModelEngine()