import streamlit as st
import pandas as pd
import numpy as np
import joblib
import plotly.graph_objects as go
import plotly.express as px
import shap
import re

# ==============================================================================
# 1. PAGE CONFIGURATION & ENHANCED HIGH-READABILITY STYLING
# ==============================================================================
st.set_page_config(
    page_title="Credit Risk & Explainable AI Platform",
    page_icon="🏦",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for Large, High-Contrast Typography & Modern Glassmorphism Cards
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 16px;
    }
    
    /* Main Top Header */
    .main-header {
        padding: 1.2rem 0rem 1.6rem 0rem;
        border-bottom: 2px solid rgba(128, 128, 128, 0.18);
        margin-bottom: 1.8rem;
    }
    .main-header h1 {
        font-size: 2.25rem;
        font-weight: 800;
        margin: 0;
        letter-spacing: -0.03em;
        line-height: 1.2;
    }
    .main-header p {
        color: #4b5563;
        font-size: 1.1rem;
        margin-top: 0.4rem;
        margin-bottom: 0;
        font-weight: 400;
    }
    
    /* Prominent KPI Metric Cards */
    .metric-card {
        background: rgba(128, 128, 128, 0.05);
        border: 1px solid rgba(128, 128, 128, 0.18);
        border-radius: 14px;
        padding: 1.35rem 1.5rem;
        transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    }
    .metric-card:hover {
        border-color: rgba(16, 185, 129, 0.45);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    }
    .metric-title {
        font-size: 1.0rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #4b5563;
        font-weight: 700;
        margin-bottom: 0.4rem;
    }
    .metric-value {
        font-size: 2.35rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        line-height: 1.15;
    }
    .metric-delta {
        font-size: 0.98rem;
        font-weight: 600;
        margin-top: 0.45rem;
        color: #4b5563;
    }
    
    /* Decision Status Badges */
    .badge-approved {
        display: inline-block;
        background-color: rgba(16, 185, 129, 0.15);
        color: #059669;
        border: 1.5px solid rgba(16, 185, 129, 0.4);
        border-radius: 10px;
        padding: 0.5rem 1.1rem;
        font-weight: 800;
        font-size: 1.05rem;
        letter-spacing: 0.02em;
    }
    .badge-rejected {
        display: inline-block;
        background-color: rgba(239, 68, 68, 0.15);
        color: #dc2626;
        border: 1.5px solid rgba(239, 68, 68, 0.4);
        border-radius: 10px;
        padding: 0.5rem 1.1rem;
        font-weight: 800;
        font-size: 1.05rem;
        letter-spacing: 0.02em;
    }
    .badge-review {
        display: inline-block;
        background-color: rgba(245, 158, 11, 0.15);
        color: #d97706;
        border: 1.5px solid rgba(245, 158, 11, 0.4);
        border-radius: 10px;
        padding: 0.5rem 1.1rem;
        font-weight: 800;
        font-size: 1.05rem;
        letter-spacing: 0.02em;
    }
    
    /* Reason Code Card */
    .reason-box {
        background: rgba(239, 68, 68, 0.04);
        border-left: 5px solid #ef4444;
        border-radius: 0 10px 10px 0;
        padding: 1.0rem 1.25rem;
        margin-bottom: 0.95rem;
    }
    .reason-code {
        font-weight: 800;
        color: #dc2626;
        font-size: 1.0rem;
    }
    .reason-title {
        font-weight: 700;
        font-size: 1.05rem;
        margin-bottom: 0.25rem;
    }
    .reason-desc {
        color: #374151;
        font-size: 0.96rem;
        line-height: 1.45;
    }
    .reason-recourse {
        margin-top: 0.45rem;
        font-size: 0.92rem;
        color: #047857;
        font-weight: 600;
        line-height: 1.4;
    }

    /* Modal / Dialog Custom Card */
    .guide-step-box {
        background: rgba(128, 128, 128, 0.06);
        border-left: 4px solid #10b981;
        border-radius: 0 8px 8px 0;
        padding: 0.85rem 1.0rem;
        margin-bottom: 0.8rem;
    }
    .guide-step-title {
        font-weight: 700;
        font-size: 1.0rem;
        color: #111827;
    }
    .guide-step-desc {
        font-size: 0.92rem;
        color: #4b5563;
        margin-top: 0.2rem;
    }

    /* Tab Label Styling */
    .stTabs [data-baseweb="tab-list"] {
        gap: 12px;
    }
    .stTabs [data-baseweb="tab"] {
        border-radius: 10px 10px 0px 0px;
        padding: 12px 24px;
        font-weight: 700;
        font-size: 1.05rem;
    }
</style>
""", unsafe_allow_html=True)

# ==============================================================================
# 2. ARTIFACT LOADING & CACHING
# ==============================================================================
@st.cache_resource(show_spinner="Loading Champion LightGBM & Risk Knowledge Base...")
def load_risk_artifacts():
    try:
        models_list = joblib.load('models/champion_lightgbm_5folds.pkl')
        df = pd.read_parquet('data/processed/train_engineered.parquet')
    except Exception:
        models_list = joblib.load('../models/champion_lightgbm_5folds.pkl')
        df = pd.read_parquet('../data/processed/train_engineered.parquet')
    
    model = models_list[0] if isinstance(models_list, list) else models_list
    
    # Feature columns alignment
    exclude_cols = ['SK_ID_CURR', 'TARGET']
    feature_cols = [c for c in df.columns if c not in exclude_cols]
    for c in df[feature_cols].select_dtypes(include=['object', 'category']).columns:
        df[c] = df[c].astype('category')
        
    explainer = shap.TreeExplainer(model)
    return model, df, feature_cols, explainer

model, df, feature_cols, explainer = load_risk_artifacts()

# Regulatory Reason Code Mapping (FCRA / ECOA Standards)
REASON_CODE_MAPPING = {
    'EXT_SOURCES_MEAN': {
        'code': 'RC_01',
        'title': 'Low External Credit Bureau Rating',
        'desc_th': 'คะแนนประวัติการชำระสินเชื่อจากสถาบันภายนอกอยู่ในเกณฑ์ต่ำกว่ามาตรฐาน',
        'recourse': 'รักษาประวัติการชำระหนี้ให้ตรงงวดติดต่อกันอย่างน้อย 6 เดือน เพื่อฟื้นฟูคะแนนเครดิต'
    },
    'BURO_DAYS_CREDIT_MAX': {
        'code': 'RC_02',
        'title': 'Recent Credit Inquiries / New Activity',
        'desc_th': 'มีการเปิดบัญชีสินเชื่อหรือยื่นขอสินเชื่อใหม่ถี่เกินไปในช่วงเวลาอันสั้น',
        'recourse': 'ชะลอการยื่นขอสินเชื่อใหม่เป็นเวลา 3-6 เดือนเพื่อลดความเสี่ยงด้านภาระหนี้ซ้ำซ้อน'
    },
    'BURO_DAYS_CREDIT_MEAN': {
        'code': 'RC_02',
        'title': 'Recent Credit Inquiries / New Activity',
        'desc_th': 'มีการเปิดบัญชีสินเชื่อหรือยื่นขอสินเชื่อใหม่ถี่เกินไปในช่วงเวลาอันสั้น',
        'recourse': 'ชะลอการยื่นขอสินเชื่อใหม่เป็นเวลา 3-6 เดือนเพื่อลดความเสี่ยงด้านภาระหนี้ซ้ำซ้อน'
    },
    'EXT_SOURCE_3': {
        'code': 'RC_03',
        'title': 'Insufficient Third-Party Credit Score (Source 3)',
        'desc_th': 'คะแนนความน่าเชื่อถือทางการเงินชุดที่ 3 ไม่ผ่านเกณฑ์ขั้นต่ำของธนาคาร',
        'recourse': 'สร้างประวัติการใช้บริการทางการเงินที่สม่ำเสมอและตรวจสอบความถูกต้องของข้อมูลเครดิต'
    },
    'EXT_SOURCE_2': {
        'code': 'RC_03',
        'title': 'Insufficient Third-Party Credit Score (Source 2)',
        'desc_th': 'คะแนนความน่าเชื่อถือทางการเงินชุดที่ 2 ไม่ผ่านเกณฑ์ขั้นต่ำของธนาคาร',
        'recourse': 'สร้างประวัติการใช้บริการทางการเงินที่สม่ำเสมอและตรวจสอบความถูกต้องของข้อมูลเครดิต'
    },
    'CREDIT_TERM': {
        'code': 'RC_04',
        'title': 'High Monthly Debt-to-Loan Ratio',
        'desc_th': 'สัดส่วนภาระค่างวดต่อวงเงินกู้สูงเกินขีดความสามารถในการชำระ',
        'recourse': 'พิจารณาขยายระยะเวลาการผ่อนชำระเพื่อลดยอดค่างวดต่อเดือนลง'
    },
    'AMT_ANNUITY': {
        'code': 'RC_05',
        'title': 'High Payment Burden (Monthly Annuity)',
        'desc_th': 'ภาระค่างวดผ่อนชำระต่องวดสูงเกินเกณฑ์ที่กำหนดเมื่อเทียบกับสภาพคล่อง',
        'recourse': 'ปรับลดวงเงินกู้หรือเพิ่มเงินดาวน์เพื่อลดภาระค่างวด'
    },
    'ANNUITY_INCOME_PERCENT': {
        'code': 'RC_05',
        'title': 'High Payment Burden (Monthly Annuity)',
        'desc_th': 'ภาระค่างวดผ่อนชำระต่องวดสูงเกินเกณฑ์ที่กำหนดเมื่อเทียบกับสภาพคล่อง',
        'recourse': 'ปรับลดวงเงินกู้หรือเพิ่มเงินดาวน์เพื่อลดภาระค่างวด'
    },
    'cash_flow_volatility': {
        'code': 'RC_06',
        'title': 'High Cash Flow Volatility',
        'desc_th': 'ความผันผวนของกระแสเงินสดและประวัติการหมุนเวียนเงินสูง',
        'recourse': 'รักษาเงินคงบัญชีเฉลี่ยให้สม่ำเสมอต่อเนื่องอย่างน้อย 3-6 เดือน'
    },
    'INST_AMT_PAYMENT_MIN': {
        'code': 'RC_07',
        'title': 'Low Historical Minimum Installment Amount',
        'desc_th': 'ประวัติยอดการชำระค่างวดขั้นต่ำในอดีตต่ำกว่าเกณฑ์มาตรฐานความเสี่ยง',
        'recourse': 'ชำระยอดสินเชื่อให้เต็มจำนวนตามใบแจ้งหนี้อย่างสม่ำเสมอ'
    }
}

# ==============================================================================
# 3. ONBOARDING WELCOME MODAL (st.dialog)
# ==============================================================================
if "has_seen_welcome" not in st.session_state:
    st.session_state.has_seen_welcome = False

@st.dialog("👋 Welcome to Credit Risk & Explainable AI Platform")
def show_welcome_dialog():
    st.markdown("""
    ### 🏦 Enterprise Credit Risk Intelligence Platform
    แพลตฟอร์มบริหารจัดการความเสี่ยงสินเชื่ออัจฉริยะ ผสานพลัง **Machine Learning (LightGBM)**, **Explainable AI (TreeSHAP)**, และ **Regulatory Adverse Action Engine** ตามมาตรฐานสากล FCRA/ECOA
    """)
    
    st.markdown("---")
    st.markdown("#### 🚀 Quick Start Guide (3 ขั้นตอนง่ายๆ ในการใช้งาน):")
    
    st.markdown("""
    <div class="guide-step-box">
        <div class="guide-step-title">🎯 Step 1: ปรับแต่งนโยบายและกำไรพอร์ตโฟลิโอ (Tab 1)</div>
        <div class="guide-step-desc">ปรับเกณฑ์ <b>Cut-off PD</b>, <b>อัตราดอกเบี้ย</b>, และ <b>LGD</b> เพื่อดูสัดส่วนการอนุมัติ, อัตราหนี้เสีย (EDR) และกำไรสุทธิแบบ Real-time</div>
    </div>
    <div class="guide-step-box">
        <div class="guide-step-title">👤 Step 2: ประเมินคะแนนเครดิตรายบุคคล & รับคำแนะนำ (Tab 2)</div>
        <div class="guide-step-desc">ใส่รหัสผู้กู้เพื่อดูคะแนน <b>Credit Score (300–850)</b> และหากถูกปฏิเสธ ระบบจะออก <b>หนังสือแจ้งเหตุผล (Reason Codes)</b> พร้อม <b>แนวทางปรับปรุงวงเงิน/ค่างวด (Recourse)</b></div>
    </div>
    <div class="guide-step-box">
        <div class="guide-step-title">⚡ Step 3: ทดสอบภาวะวิกฤตเศรษฐกิจ & ตรวจจับ Data Drift (Tab 3)</div>
        <div class="guide-step-desc">จำลองวิกฤตเศรษฐกิจ (เงินเฟ้อ/ดอกเบี้ยพุ่ง) เพื่อคำนวณ <b>Expected Loss</b> และติดตามความเสถียรของประชากรผู้กู้ด้วย <b>PSI Index</b></div>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("<br>", unsafe_allow_html=True)
    if st.button("🚀 Got it / Start Exploring (เริ่มต้นใช้งาน)", type="primary", use_container_width=True):
        st.session_state.has_seen_welcome = True
        st.rerun()

# Automatically show welcome dialog on first visit
if not st.session_state.has_seen_welcome:
    show_welcome_dialog()

# ==============================================================================
# 4. SIDEBAR NAVIGATION, FINANCIAL GLOSSARY & VARIABLE CHEAT SHEET
# ==============================================================================
with st.sidebar:
    st.markdown("### 🏦 Control Center")
    if st.button("ℹ️ Open Quick Start Guide", use_container_width=True):
        show_welcome_dialog()
    
    st.markdown("---")
    st.markdown("#### ⚙️ Global Policy Threshold")
    default_cutoff = st.slider(
        "Default Policy Cut-off PD (%)",
        min_value=4.0, max_value=30.0, value=18.0, step=1.0,
        help="Probability of Default threshold for approving loans across the platform."
    ) / 100.0
    
    st.markdown("---")
    st.markdown("#### 🔬 Progressive Disclosure")
    show_advanced = st.toggle(
        "Show Advanced Technical Details",
        value=False,
        help="Enable to inspect TreeSHAP waterfall values, mathematical formulas, and statistical distributions."
    )
    
    # -------------------------------------------------------------
    # FINANCIAL GLOSSARY & VARIABLE CHEAT SHEET (Dedicated Section)
    # -------------------------------------------------------------
    st.markdown("---")
    with st.expander("📖 Financial & Variable Cheat Sheet", expanded=False):
        st.markdown("#### 🏛️ Core Risk & Financial Metrics")
        st.markdown("""
        * **PD (Probability of Default):** ความน่าจะเป็นที่ผู้กู้จะไม่สามารถชำระหนี้ได้ตามสัญญา (0% – 100%)
        * **LGD (Loss Given Default):** สัดส่วนความเสียหายที่คาดว่าจะสูญเสียจริงเมื่อเกิดหนี้เสีย (เช่น 45% ของวงเงิน)
        * **EAD (Exposure at Default):** ยอดหนี้คงค้างทั้งหมด ณ วันที่ผู้กู้ผิดนัดชำระ
        * **EDR (Expected Default Rate):** อัตราหนี้เสียเฉลี่ยที่หลุดเข้าไปในกลุ่มผู้กู้ที่ได้รับอนุมัติ
        * **Credit Scorecard (300–850):** คะแนนเครดิตตามมาตรฐานสากล (FICO-like scale) ยิ่งสูงยิ่งมีความน่าเชื่อถือ
        """)
        
        st.markdown("#### 📊 Governance & Explainability")
        st.markdown("""
        * **PSI (Population Stability Index):** ดัชนีวัดการเปลี่ยนขั้ว/เบี่ยงเบนของประชากรผู้กู้ (Data Drift):
          * `< 0.10`: 🟢 เสถียร (Stable)
          * `0.10–0.25`: 🟡 เฝ้าระวัง (Warning)
          * `> 0.25`: 🔴 ต้องรีเทรนโมเดล (Trigger Retrain)
        * **TreeSHAP:** เทคนิค Explainable AI สำหรับอธิบายผลกระทบของแต่ละฟีเจอร์ต่อความเสี่ยง (ค่าบวก = เพิ่มเสี่ยง, ค่าลบ = ลดเสี่ยง)
        """)

        st.markdown("#### 🔬 Key Model Variables")
        st.markdown("""
        * **`EXT_SOURCES_MEAN`:** คะแนนประวัติเครดิตเฉลี่ยจากสถาบันภายนอก/เครดิตบูโร (ปัจจัยคุ้มกันที่ทรงพลังที่สุด)
        * **`CREDIT_TERM`:** สัดส่วนภาระค่างวดต่อเดือนต่อวงเงินกู้ทั้งหมด (`AMT_ANNUITY / AMT_CREDIT`)
        * **`ANNUITY_INCOME_PERCENT`:** สัดส่วนภาระค่างวดต่อรายได้รวมต่อปี (Debt-to-Income Indicator)
        * **`cash_flow_volatility`:** ความผันผวนของกระแสเงินหมุนเวียน (ยิ่งต่ำกระแสเงินสดยิ่งมั่นคง)
        * **`INST_DPD_MAX`:** จำนวนวันชำระล่าช้าสูงสุดในอดีต (Days Past Due)
        """)
    
    st.markdown("---")
    st.caption(f"**Champion Model:** LightGBM 5-Folds")
    st.caption(f"**Portfolio Universe:** {len(df):,} loans")
    st.caption(f"**Feature Count:** {len(feature_cols)} features")

# ==============================================================================
# 5. APP MAIN HEADER
# ==============================================================================
st.markdown("""
<div class="main-header">
    <h1>🏦 Credit Risk Scoring & Explainable AI Intelligence Platform</h1>
    <p>Enterprise-Grade Quantitative Underwriting, Point Scorecard (300–850), Adverse Action Notice & Counterfactual Recourse</p>
</div>
""", unsafe_allow_html=True)

# Main Navigation Tabs
tab1, tab2, tab3 = st.tabs([
    "🎯 Policy Simulator & Net Profit",
    "👤 Individual Underwriting & Recourse",
    "⚡ Macro Stress Testing & PSI Tracker"
])

# ==============================================================================
# TAB 1: POLICY SIMULATOR & NET PROFIT OPTIMIZATION
# ==============================================================================
with tab1:
    st.markdown("### 🎯 Portfolio Credit Policy & Profitability Optimization")
    st.markdown("จำลองและปรับแต่งเกณฑ์การอนุมัติสินเชื่อ (Cut-off PD), อัตราดอกเบี้ย, และสมมติฐาน LGD เพื่อค้นหาจุดสมดุลสูงสุดของกำไรสุทธิ (Net Profit)")

    # Control Parameters Row
    c_p1, c_p2, c_p3 = st.columns(3)
    with c_p1:
        cut_off_pd = st.slider(
            "Cut-off PD Threshold (%)",
            min_value=4.0, max_value=30.0, value=default_cutoff * 100.0, step=0.5,
            format="%.1f%%",
            help="กำหนดเกณฑ์ PD สูงสุดที่จะอนุมัติสินเชื่อ"
        ) / 100.0
    with c_p2:
        avg_interest_rate = st.slider(
            "Average Loan Interest Rate (%)",
            min_value=5.0, max_value=25.0, value=15.0, step=0.5,
            format="%.1f%%",
            help="อัตราดอกเบี้ยเงินกู้เฉลี่ยต่อปี"
        ) / 100.0
    with c_p3:
        lgd_assumption = st.slider(
            "Loss Given Default - LGD (%)",
            min_value=20.0, max_value=70.0, value=45.0, step=5.0,
            format="%.0f%%",
            help="สัดส่วนความเสียหายจริงเมื่อเกิดหนี้เสีย"
        ) / 100.0

    # Simulation Evaluation
    sample_eval = df.sample(15000, random_state=42).copy()
    preds_eval = model.predict_proba(sample_eval[feature_cols])[:, 1]

    approved_mask = preds_eval <= cut_off_pd
    n_total = len(sample_eval)
    n_approved = int(approved_mask.sum())
    n_defaults = int((sample_eval.loc[approved_mask, 'TARGET'] == 1).sum())

    approval_rate = (n_approved / n_total) * 100
    edr = (n_defaults / n_approved * 100) if n_approved > 0 else 0.0

    total_credit_approved = float(sample_eval.loc[approved_mask, 'AMT_CREDIT'].sum())
    interest_revenue = total_credit_approved * avg_interest_rate
    default_loss = float(sample_eval.loc[approved_mask & (sample_eval['TARGET'] == 1), 'AMT_CREDIT'].sum()) * lgd_assumption
    net_profit = interest_revenue - default_loss

    # Prominent KPI Metric Cards (Large Typography)
    st.markdown("<br>", unsafe_allow_html=True)
    kpi1, kpi2, kpi3, kpi4 = st.columns(4)
    with kpi1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Approval Rate (อัตราอนุมัติ)</div>
            <div class="metric-value" style="color: #059669;">{approval_rate:.1f}%</div>
            <div class="metric-delta">{n_approved:,} จากทั้งหมด {n_total:,} สัญญา</div>
        </div>
        """, unsafe_allow_html=True)
    with kpi2:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Expected Default Rate (EDR)</div>
            <div class="metric-value" style="color: {'#dc2626' if edr > 8.0 else '#d97706'};">{edr:.2f}%</div>
            <div class="metric-delta">{n_defaults:,} สัญญาหนี้เสียที่หลุดอนุมัติ</div>
        </div>
        """, unsafe_allow_html=True)
    with kpi3:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Approved Exposure (ยอดสินเชื่อ)</div>
            <div class="metric-value">{total_credit_approved/1e6:,.1f} M</div>
            <div class="metric-delta">วงเงินสินเชื่อรวมที่อนุมัติ (บาท)</div>
        </div>
        """, unsafe_allow_html=True)
    with kpi4:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Simulated Net Profit (กำไรสุทธิ)</div>
            <div class="metric-value" style="color: {'#059669' if net_profit > 0 else '#dc2626'};">{net_profit/1e6:+,.2f} M</div>
            <div class="metric-delta">ดอกเบี้ย: {(interest_revenue/1e6):.1f}M | หนี้เสีย: {(default_loss/1e6):.1f}M</div>
        </div>
        """, unsafe_allow_html=True)

    # Portfolio Breakdown Chart
    st.markdown("<br>", unsafe_allow_html=True)
    c_chart, c_strategy = st.columns([1.2, 1])
    
    with c_chart:
        fig_donut = go.Figure(data=[go.Pie(
            labels=['Approved (Good Loans)', 'Approved (Default Risk)', 'Rejected Applications'],
            values=[n_approved - n_defaults, n_defaults, n_total - n_approved],
            hole=.55,
            marker_colors=['#10b981', '#ef4444', '#9ca3af'],
            textinfo='percent+label',
            textposition='inside',
            insidetextorientation='radial',
            textfont=dict(size=13, family='Inter')
        )])
        fig_donut.update_layout(
            title="<b>Portfolio Approval & Default Distribution</b>",
            margin=dict(t=40, b=20, l=20, r=20),
            height=340,
            showlegend=False
        )
        st.plotly_chart(fig_donut, use_container_width=True)

    with c_strategy:
        st.markdown("#### 💡 Strategic Policy Recommendations")
        if cut_off_pd <= 0.12:
            st.info("🛡️ **Conservative Policy:** ความเสี่ยงต่ำสุด ดักจับหนี้เสียได้สูง เหมาะกับช่วงเศรษฐกิจชะลอตัว แต่อาจเสียโอกาสในการขยายส่วนแบ่งตลาด")
        elif cut_off_pd <= 0.20:
            st.success("⚖️ **Balanced Growth Policy (แนะนำ):** จุดสมดุลที่ดีที่สุดระหว่างการเติบโตของพอร์ตโฟลิโอและการตั้งสำรองหนี้เสีย ให้กำไรสุทธิสูงสุด")
        else:
            st.warning("🚀 **Aggressive Expansion Policy:** อนุมัติสินเชื่อในอัตราสูงมาก ต้องเตรียมเงินกองทุนสำรองรองรับหนี้เสียและเพิ่มอัตราดอกเบี้ยชดเชยความเสี่ยง")

        st.markdown(f"""
        * **Breakeven Net Margin:** `{(net_profit / max(total_credit_approved, 1.0) * 100):.2f}%`
        * **Revenue per Approved Loan:** `{(interest_revenue / max(n_approved, 1)):,.0f} THB`
        * **Cost per Default:** `{(default_loss / max(n_defaults, 1)):,.0f} THB`
        """)

    # Deep Dive Expander
    if show_advanced:
        with st.expander("🔬 Deep Dive: Policy Trade-off Curve & Strategy Scenarios", expanded=True):
            st.markdown("#### 📊 Standard Strategy Benchmark Leaderboard")
            scenarios = []
            for th, name in [(0.10, "Conservative"), (0.18, "Balanced (Current)"), (0.25, "Aggressive Growth")]:
                m = preds_eval <= th
                cnt = m.sum()
                d_cnt = (sample_eval.loc[m, 'TARGET'] == 1).sum()
                exp = sample_eval.loc[m, 'AMT_CREDIT'].sum()
                rev = exp * avg_interest_rate
                loss = sample_eval.loc[m & (sample_eval['TARGET'] == 1), 'AMT_CREDIT'].sum() * lgd_assumption
                profit = rev - loss
                scenarios.append({
                    "Strategy Scenario": name,
                    "PD Cut-off": f"{th*100:.1f}%",
                    "Approval Rate": f"{(cnt/n_total*100):.1f}%",
                    "Expected Default (EDR)": f"{(d_cnt/cnt*100):.2f}%",
                    "Approved Exposure": f"{exp/1e6:,.1f} M THB",
                    "Simulated Net Profit": f"{profit/1e6:,.2f} M THB"
                })
            st.dataframe(pd.DataFrame(scenarios), use_container_width=True, hide_index=True)

# ==============================================================================
# TAB 2: INDIVIDUAL UNDERWRITING & RECOURSE ENGINE
# ==============================================================================
with tab2:
    st.markdown("### 👤 Individual Credit Underwriting & Recourse Engine")
    st.markdown("ประเมินความเสี่ยงรายบุคคล, คำนวณคะแนน **Credit Scorecard (300–850)**, สร้าง **หนังสือแจ้งปฏิเสธ (Adverse Action Notice)**, และจำลอง **เงื่อนไขทางเลือก (Actionable Recourse)**")

    # Applicant Selection
    col_sel1, col_sel2 = st.columns([1, 2])
    with col_sel1:
        seed_choice = st.number_input("Enter Applicant Seed ID (Random Lookup)", value=281935, step=1)
    with col_sel2:
        st.markdown("<br>", unsafe_allow_html=True)
        st.caption("💡 **ตัวอย่างรหัสผู้กู้:** `281935` (เคสเสี่ยงสูง / ถูกปฏิเสธ), `100003` (เคสเครดิตดีเยี่ยม / ได้รับอนุมัติ)")

    applicant_row = df.sample(1, random_state=int(seed_choice)).copy()
    app_id = int(applicant_row['SK_ID_CURR'].values[0])
    actual_label = int(applicant_row['TARGET'].values[0])

    # Model Evaluation
    pred_prob = float(model.predict_proba(applicant_row[feature_cols])[:, 1][0])
    
    # Calibrated Scorecard Formula (300 to 850 scale)
    odds = (1.0 - pred_prob) / max(pred_prob, 1e-6)
    scorecard_raw = 487.12 + (28.8539 * np.log(odds))
    credit_score = int(np.clip(np.round(scorecard_raw), 300, 850))
    is_approved = pred_prob <= cut_off_pd

    # Scorecard Tier
    if credit_score >= 750:
        score_grade = "Super Prime"
        grade_color = "#059669"
    elif credit_score >= 680:
        score_grade = "Prime"
        grade_color = "#059669"
    elif credit_score >= 620:
        score_grade = "Near Prime"
        grade_color = "#d97706"
    elif credit_score >= 550:
        score_grade = "Subprime"
        grade_color = "#dc2626"
    else:
        score_grade = "Deep Subprime"
        grade_color = "#dc2626"

    # Hero Assessment Banner
    st.markdown("<br>", unsafe_allow_html=True)
    c_dec1, c_dec2 = st.columns([1.1, 1.4])

    with c_dec1:
        status_html = f'<span class="badge-approved">🟢 APPROVED (ผ่านเกณฑ์)</span>' if is_approved else f'<span class="badge-rejected">🔴 REJECTED (ไม่ผ่านเกณฑ์)</span>'
        
        st.markdown(f"""
        <div class="metric-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.9rem;">
                <span style="font-size: 1.05rem; font-weight: 700;">Applicant ID: <code>#{app_id}</code></span>
                {status_html}
            </div>
            <div style="display: flex; gap: 32px; align-items: baseline; margin-top: 0.6rem;">
                <div>
                    <div class="metric-title">Credit Score (คะแนนเครดิต)</div>
                    <div class="metric-value" style="color: {grade_color};">{credit_score} <span style="font-size: 1.1rem; color: #6b7280; font-weight: 500;">/ 850</span></div>
                    <div style="font-size: 0.95rem; font-weight: 700; color: {grade_color}; margin-top: 0.2rem;">{score_grade} Tier</div>
                </div>
                <div>
                    <div class="metric-title">Default Risk (PD)</div>
                    <div class="metric-value" style="color: {'#059669' if is_approved else '#dc2626'};">{pred_prob*100:.2f}%</div>
                    <div style="font-size: 0.92rem; color: #4b5563; font-weight: 600;">เกณฑ์อนุมัติ: {cut_off_pd*100:.1f}%</div>
                </div>
            </div>
            <div style="margin-top: 1.1rem; padding-top: 0.75rem; border-top: 1px solid rgba(128,128,128,0.18); font-size: 0.95rem; color: #4b5563;">
                ประวัติการชำระจริงในอดีต: <b>{'หนี้เสีย (Default)' if actual_label == 1 else 'ชำระปกติ (Good Loan)'}</b>
            </div>
        </div>
        """, unsafe_allow_html=True)

    with c_dec2:
        threshold_score = int(np.clip(487.12 + (28.8539 * np.log((1 - cut_off_pd) / cut_off_pd)), 300, 850))
        fig_gauge = go.Figure(go.Indicator(
            mode="gauge+number",
            value=credit_score,
            number={'suffix': " pts", 'font': {'size': 26, 'family': 'Inter', 'weight': 'bold'}},
            gauge={
                'axis': {'range': [300, 850], 'tickwidth': 1, 'tickcolor': "#9ca3af"},
                'bar': {'color': grade_color, 'thickness': 0.30},
                'bgcolor': "white",
                'borderwidth': 1,
                'bordercolor': "rgba(128,128,128,0.2)",
                'steps': [
                    {'range': [300, 550], 'color': 'rgba(239, 68, 68, 0.15)'},
                    {'range': [550, 650], 'color': 'rgba(245, 158, 11, 0.15)'},
                    {'range': [650, 850], 'color': 'rgba(16, 185, 129, 0.15)'}
                ],
                'threshold': {
                    'line': {'color': "#dc2626", 'width': 3.5},
                    'thickness': 0.75,
                    'value': threshold_score
                }
            }
        ))
        fig_gauge.update_layout(
            margin=dict(t=30, b=10, l=30, r=30),
            height=210,
            title={'text': "<b>Point Scorecard Gauge (300–850)</b>", 'font': {'size': 14}}
        )
        st.plotly_chart(fig_gauge, use_container_width=True)

    # Adverse Action Notice & Recourse Section (if rejected)
    if not is_approved:
        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown("### 📄 Adverse Action Notice & Actionable Recourse")
        
        c_adv, c_rec = st.columns([1, 1.1])
        
        # Calculate local SHAP values
        shap_vals = explainer(applicant_row[feature_cols])
        shap_values_row = shap_vals.values[0]
        adverse_indices = np.argsort(shap_values_row)[::-1]
        
        with c_adv:
            st.markdown("#### 🚨 Regulatory Reason Codes (FCRA / ECOA)")
            st.caption(f"สาเหตุสำคัญที่ส่งผลให้ความเสี่ยงสูงกว่าเกณฑ์ที่กำหนด ({cut_off_pd*100:.1f}%):")
            
            reasons_rendered = 0
            for idx in adverse_indices:
                feat = feature_cols[idx]
                val = shap_values_row[idx]
                if val > 0 and feat in REASON_CODE_MAPPING:
                    info = REASON_CODE_MAPPING[feat]
                    st.markdown(f"""
                    <div class="reason-box">
                        <div class="reason-code">[{info['code']}] {info['title']}</div>
                        <div class="reason-desc">{info['desc_th']}</div>
                        <div class="reason-recourse">💡 <b>คำแนะนำ:</b> {info['recourse']}</div>
                    </div>
                    """, unsafe_allow_html=True)
                    reasons_rendered += 1
                if reasons_rendered >= 3:
                    break

        with c_rec:
            st.markdown("#### 🛠️ Actionable Recourse Recommendations")
            st.caption("แนวทางการปรับเปลี่ยนเงื่อนไขทางการเงินเพื่อให้ผ่านเกณฑ์อนุมัติ:")
            
            # Recourse simulation paths
            orig_credit = float(applicant_row['AMT_CREDIT'].iloc[0]) if 'AMT_CREDIT' in applicant_row else 500000.0
            orig_annuity = float(applicant_row['AMT_ANNUITY'].iloc[0]) if 'AMT_ANNUITY' in applicant_row else 25000.0
            
            # Path 1: Reduce credit by 20%
            r1_df = applicant_row.copy()
            r1_df['AMT_CREDIT'] = orig_credit * 0.80
            r1_df['AMT_ANNUITY'] = orig_annuity * 0.80
            if 'CREDIT_TERM' in r1_df.columns:
                r1_df['CREDIT_TERM'] = r1_df['AMT_ANNUITY'] / r1_df['AMT_CREDIT']
            pd_r1 = float(model.predict_proba(r1_df[feature_cols])[:, 1][0])
            score_r1 = int(np.clip(487.12 + (28.8539 * np.log((1 - pd_r1) / max(pd_r1, 1e-6))), 300, 850))

            # Path 2: Extend tenure (-25% annuity)
            r2_df = applicant_row.copy()
            r2_df['AMT_ANNUITY'] = orig_annuity * 0.75
            if 'CREDIT_TERM' in r2_df.columns:
                r2_df['CREDIT_TERM'] = r2_df['AMT_ANNUITY'] / r2_df['AMT_CREDIT']
            pd_r2 = float(model.predict_proba(r2_df[feature_cols])[:, 1][0])
            score_r2 = int(np.clip(487.12 + (28.8539 * np.log((1 - pd_r2) / max(pd_r2, 1e-6))), 300, 850))

            # Path 3: Downpayment 20% + clean payment
            r3_df = applicant_row.copy()
            r3_df['AMT_CREDIT'] = orig_credit * 0.80
            r3_df['AMT_ANNUITY'] = orig_annuity * 0.80
            if 'EXT_SOURCES_MEAN' in r3_df.columns:
                r3_df['EXT_SOURCES_MEAN'] = min(float(r3_df['EXT_SOURCES_MEAN'].iloc[0]) * 1.15, 0.95)
            if 'cash_flow_volatility' in r3_df.columns:
                r3_df['cash_flow_volatility'] = max(float(r3_df['cash_flow_volatility'].iloc[0]) * 0.70, 0.3)
            pd_r3 = float(model.predict_proba(r3_df[feature_cols])[:, 1][0])
            score_r3 = int(np.clip(487.12 + (28.8539 * np.log((1 - pd_r3) / max(pd_r3, 1e-6))), 300, 850))

            recourse_table = pd.DataFrame([
                {
                    "แนวทางการปรับปรุงเงื่อนไข": "ขอลดวงเงินกู้ลง 20%",
                    "New PD": f"{pd_r1*100:.1f}%",
                    "Score": f"{score_r1}",
                    "สถานะใหม่": "🟢 Approved" if pd_r1 <= cut_off_pd else "🟡 Review"
                },
                {
                    "แนวทางการปรับปรุงเงื่อนไข": "ขยายระยะเวลางวดผ่อน (ลดค่างวด 25%)",
                    "New PD": f"{pd_r2*100:.1f}%",
                    "Score": f"{score_r2}",
                    "สถานะใหม่": "🟢 Approved" if pd_r2 <= cut_off_pd else "🟡 Review"
                },
                {
                    "แนวทางการปรับปรุงเงื่อนไข": "วางดาวน์ 20% + ประวัติจ่ายตรง 6 เดือน",
                    "New PD": f"{pd_r3*100:.1f}%",
                    "Score": f"{score_r3}",
                    "สถานะใหม่": "🟢 Approved" if pd_r3 <= cut_off_pd else "🟡 Review"
                }
            ])
            st.dataframe(recourse_table, use_container_width=True, hide_index=True)

    # Deep Dive Expander
    if show_advanced:
        with st.expander("🔬 Deep Dive: TreeSHAP Local Feature Attributions", expanded=True):
            st.markdown("#### 🌲 Local Feature Attribution Impact (SHAP Waterfall)")
            
            top_shap_indices = np.argsort(np.abs(shap_values_row))[::-1][:10]
            top_feats = [feature_cols[i] for i in top_shap_indices][::-1]
            top_vals = [shap_values_row[i] for i in top_shap_indices][::-1]
            
            fig_shap = go.Figure(go.Bar(
                x=top_vals,
                y=top_feats,
                orientation='h',
                marker_color=['#ef4444' if v > 0 else '#10b981' for v in top_vals]
            ))
            fig_shap.update_layout(
                title=f"<b>Top 10 Feature Contributions for Applicant #{app_id}</b>",
                xaxis_title="SHAP Value (Red = Increases Risk, Green = Reduces Risk)",
                yaxis_title="Feature Name",
                margin=dict(l=150, r=20, t=40, b=30),
                height=360
            )
            st.plotly_chart(fig_shap, use_container_width=True)

# ==============================================================================
# TAB 3: MACROECONOMIC STRESS TESTING & PSI TRACKER
# ==============================================================================
with tab3:
    st.markdown("### ⚡ Macroeconomic Stress Testing & Population Drift Tracker")
    st.markdown("จำลองวิกฤตเศรษฐกิจภายใต้กรอบ **ICAAP (Internal Capital Adequacy Assessment Process)** และติดตามการเบี่ยงเบนของกลุ่มประชากรผู้กู้ด้วย **Population Stability Index (PSI)**")

    col_m1, col_m2 = st.columns(2)

    with col_m1:
        st.markdown("#### 🏛️ Macro Scenario Shock Simulation (ICAAP)")
        stress_scenario = st.selectbox(
            "Select Economic Stress Scenario",
            [
                "1. Baseline (Normal Economy)",
                "2. Gig-Worker Income Shock (-30% Stability)",
                "3. Stagflation & Rate Hike (+20% Annuity & Inflation)"
            ]
        )

        npl_val = 25.02 if "Baseline" in stress_scenario else (32.00 if "Gig" in stress_scenario else 36.57)
        el_val = 348.0 if "Baseline" in stress_scenario else (418.9 if "Gig" in stress_scenario else 458.3)
        delta_el = el_val - 348.0

        st.markdown(f"""
        <div style="display: flex; gap: 16px; margin-top: 1rem;">
            <div class="metric-card" style="flex: 1;">
                <div class="metric-title">Simulated NPL Rate</div>
                <div class="metric-value" style="color: {'#dc2626' if npl_val > 25.02 else '#059669'};">{npl_val:.2f}%</div>
                <div class="metric-delta" style="color: {'#dc2626' if npl_val > 25.02 else '#4b5563'};">
                    {f'+{(npl_val - 25.02):.2f}% vs Baseline' if npl_val > 25.02 else 'Baseline Risk Level'}
                </div>
            </div>
            <div class="metric-card" style="flex: 1;">
                <div class="metric-title">Expected Loss (EL)</div>
                <div class="metric-value" style="color: {'#dc2626' if delta_el > 0 else '#059669'};">{el_val:.1f} M</div>
                <div class="metric-delta" style="color: {'#dc2626' if delta_el > 0 else '#4b5563'};">
                    {f'Required Buffer: +{delta_el:.1f} M THB' if delta_el > 0 else 'Standard Capital Buffer'}
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)

        if "Stagflation" in stress_scenario:
            st.warning("⚠️ **Capital Action Required:** แนะนำให้ตั้งสำรองเงินกองทุนส่วนเพิ่ม +110.3M THB ตามเกณฑ์ IFRS 9 Stage 2/3")
        elif "Gig" in stress_scenario:
            st.info("ℹ️ **Increased Monitoring:** กลุ่มฟรีแลนซ์และ Gig-Worker มีความผันผวนของกระแสเงินสดสูงขึ้น ต้องติดตามใกล้ชิด")
        else:
            st.success("✅ **Capital Adequacy:** พอร์ตโฟลิโอในภาวะปกติมีเงินกองทุนสำรองเพียงพอตามเกณฑ์ Basel III")

    with col_m2:
        st.markdown("#### 📊 Population Stability Index (PSI) Drift Tracker")
        stream_mode = st.radio(
            "Select Simulated Production Stream",
            ["Batch 1: Stable Normal Stream", "Batch 2: Economic Drifted Stream (Income & Bureau Shift)"],
            horizontal=True
        )

        psi_metric = 0.0025 if "Stable" in stream_mode else 0.3253

        if psi_metric < 0.10:
            psi_status = '<span class="badge-approved">🟢 STABLE (ไม่มี Data Drift)</span>'
            psi_msg = "การแจกแจงของคะแนนผู้กู้สอดคล้องกับช่วงเทรนโมเดล สามารถปฏิบัติการตามปกติได้"
        elif psi_metric <= 0.25:
            psi_status = '<span class="badge-review">🟡 WARNING (เฝ้าระวัง)</span>'
            psi_msg = "เริ่มพบการเปลี่ยนแปลงของประชากรระดับปานกลาง ควรเพิ่มความถี่ในการตรวจสอบ Segment"
        else:
            psi_status = '<span class="badge-rejected">🔴 TRIGGER RETRAIN (ต้องรีเทรน)</span>'
            psi_msg = "ประชากรผู้กู้เปลี่ยนแปลงอย่างมีนัยสำคัญ ความแม่นยำโมเดลอาจลดลง ควรเริ่มกระบวนการ Retrain ทันที"

        st.markdown(f"""
        <div class="metric-card" style="margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div class="metric-title">Population Stability Index</div>
                    <div class="metric-value">{psi_metric:.4f}</div>
                </div>
                <div>{psi_status}</div>
            </div>
            <div style="margin-top: 0.8rem; font-size: 0.95rem; color: #374151; line-height: 1.4;">
                {psi_msg}
            </div>
        </div>
        """, unsafe_allow_html=True)

    if show_advanced:
        with st.expander("🔬 Deep Dive: ICAAP Stress Testing Breakdown & PSI Binning", expanded=True):
            st.markdown("#### 🏦 ICAAP Macroeconomic Stress Testing Leaderboard")
            stress_table = pd.DataFrame([
                {
                    "Economic Scenario": "1. Baseline (Normal Economy)",
                    "Avg PD": "8.07%",
                    "Simulated NPL": "25.02%",
                    "Expected Loss": "348.0 M THB",
                    "Capital Buffer Delta": "0.0 M THB",
                    "Governance Action": "Standard Capital Adequacy"
                },
                {
                    "Economic Scenario": "2. Gig-Worker Income Shock (-30%)",
                    "Avg PD": "11.45%",
                    "Simulated NPL": "32.00%",
                    "Expected Loss": "418.9 M THB",
                    "Capital Buffer Delta": "+70.9 M THB",
                    "Governance Action": "Enhanced Cash Flow Monitoring"
                },
                {
                    "Economic Scenario": "3. Stagflation & Rate Hike (+20%)",
                    "Avg PD": "14.82%",
                    "Simulated NPL": "36.57%",
                    "Expected Loss": "458.3 M THB",
                    "Capital Buffer Delta": "+110.3 M THB",
                    "Governance Action": "Mandatory Capital Buffer Injection"
                }
            ])
            st.dataframe(stress_table, use_container_width=True, hide_index=True)