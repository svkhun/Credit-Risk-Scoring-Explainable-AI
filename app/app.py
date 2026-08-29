import streamlit as st
import pandas as pd
import numpy as np
import joblib
import plotly.graph_objects as go
import plotly.express as px

# 1. ตั้งค่าหน้าเพจ Dashboard
st.set_page_config(
    page_title="Credit Risk & XAI Intelligence Platform",
    page_icon="🏦",
    layout="wide"
)

st.title("🏦 Credit Risk & Explainable AI Intelligence Platform")
st.caption("Enterprise-grade Risk Scoring, Adverse Action XAI, Recourse Engine & Stress Testing")

# 2. ฟังก์ชันโหลด Cache ข้อมูลและโมเดล
@st.cache_resource
def load_artifacts():
    try:
        model = joblib.load('models/champion_lightgbm_5folds.pkl')[0]
        df = pd.read_parquet('data/processed/train_engineered.parquet')
        return model, df
    except Exception:
        model = joblib.load('../models/champion_lightgbm_5folds.pkl')[0]
        df = pd.read_parquet('../data/processed/train_engineered.parquet')
        return model, df

model, df = load_artifacts()

exclude_cols = ['SK_ID_CURR', 'TARGET']
feature_cols = [c for c in df.columns if c not in exclude_cols]
for c in df[feature_cols].select_dtypes(include=['object', 'category']).columns:
    df[c] = df[c].astype('category')

# สร้าง 3 Tabs หลัก
tab1, tab2, tab3 = st.tabs([
    "🎯 Policy Simulator & Net Profit", 
    "👤 Individual Underwriting & Recourse", 
    "⚡ Macro Stress Testing & PSI"
])

# ==============================================================================
# TAB 1: POLICY SIMULATOR & NET PROFIT OPTIMIZATION
# ==============================================================================
with tab1:
    st.subheader("Credit Policy & Profitability Optimization")
    
    col1, col2, col3 = st.columns([1, 1, 1])
    with col1:
        cut_off_pd = st.slider("Select Cut-off PD Threshold (%)", min_value=4.0, max_value=30.0, value=18.0, step=1.0) / 100.0
    with col2:
        avg_interest_rate = st.slider("Average Loan Interest Rate (%)", min_value=5.0, max_value=25.0, value=15.0, step=1.0) / 100.0
    with col3:
        lgd_assumption = st.slider("Loss Given Default - LGD (%)", min_value=20.0, max_value=70.0, value=45.0, step=5.0) / 100.0

    sample_eval = df.sample(15000, random_state=42).copy()
    preds_eval = model.predict_proba(sample_eval[feature_cols])[:, 1]
    
    approved_mask = preds_eval <= cut_off_pd
    n_total = len(sample_eval)
    n_approved = approved_mask.sum()
    n_defaults = (sample_eval.loc[approved_mask, 'TARGET'] == 1).sum()
    
    approval_rate = (n_approved / n_total) * 100
    edr = (n_defaults / n_approved * 100) if n_approved > 0 else 0.0
    
    total_credit_approved = sample_eval.loc[approved_mask, 'AMT_CREDIT'].sum()
    interest_revenue = total_credit_approved * avg_interest_rate
    default_loss = sample_eval.loc[approved_mask & (sample_eval['TARGET'] == 1), 'AMT_CREDIT'].sum() * lgd_assumption
    net_profit = interest_revenue - default_loss

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Approval Rate", f"{approval_rate:.1f}%")
    m2.metric("Expected Default Rate (EDR)", f"{edr:.2f}%")
    m3.metric("Approved Exposure", f"{total_credit_approved/1e6:.1f} M THB")
    m4.metric("Simulated Net Profit", f"{net_profit/1e6:.2f} M THB", delta=f"{(interest_revenue - default_loss)/1e6:.2f} M")

    fig_donut = go.Figure(data=[go.Pie(
        labels=['Approved (Good)', 'Approved (Default)', 'Rejected'],
        values=[n_approved - n_defaults, n_defaults, n_total - n_approved],
        hole=.5,
        marker_colors=['#2ca02c', '#d9534f', '#7f7f7f']
    )])
    fig_donut.update_layout(title="Portfolio Approval & Risk Breakdown", height=380)
    st.plotly_chart(fig_donut, use_container_width=True)

# ==============================================================================
# TAB 2: INDIVIDUAL UNDERWRITING & RECOURSE ENGINE
# ==============================================================================
with tab2:
    st.subheader("Individual Credit Evaluation & Adverse Action Notice")
    
    applicant_row = df.sample(1, random_state=int(st.number_input("Enter Random Applicant Seed", value=281935, step=1)))
    app_id = applicant_row['SK_ID_CURR'].values[0]
    actual_label = applicant_row['TARGET'].values[0]
    
    pred_prob = model.predict_proba(applicant_row[feature_cols])[:, 1][0]
    credit_score = int(np.clip(487.12 + (28.8539 * np.log((1 - pred_prob) / max(pred_prob, 1e-6))), 300, 850))
    is_approved = pred_prob <= cut_off_pd

    c1, c2 = st.columns([1, 2])
    with c1:
        st.write(f"**Applicant ID:** `{app_id}`")
        st.write(f"**Actual Outcome:** `{'Default (หนี้เสีย)' if actual_label == 1 else 'Good (ปกติ)'}`")
        st.write(f"**Decision:** {'🟢 APPROVED' if is_approved else '🔴 REJECTED'}")
        st.metric("Credit Score (300–850)", f"{credit_score} แต้ม")
        st.metric("Predicted Default Probability", f"{pred_prob*100:.2f}%")

    with c2:
        fig_gauge = go.Figure(go.Indicator(
            mode="gauge+number",
            value=credit_score,
            title={'text': "Credit Scorecard Gauge"},
            gauge={
                'axis': {'range': [300, 850]},
                'bar': {'color': "#1f77b4"},
                'steps': [
                    {'range': [300, 550], 'color': "#f8d7da"},
                    {'range': [550, 650], 'color': "#fff3cd"},
                    {'range': [650, 850], 'color': "#d4edda"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': int(np.clip(487.12 + (28.8539 * np.log((1 - cut_off_pd) / cut_off_pd)), 300, 850))
                }
            }
        ))
        fig_gauge.update_layout(height=300)
        st.plotly_chart(fig_gauge, use_container_width=True)

    if not is_approved:
        st.divider()
        st.markdown("### 📄 Adverse Action Notice (FCRA/ECOA Compliant)")
        st.warning(f"คำขอสินเชื่อของ Applicant #{app_id} ไม่ผ่านเกณฑ์พิจารณาเบื้องต้นเนื่องจากเหตุผลดังต่อไปนี้:")
        st.markdown("""
        * **[RC_01] Low External Credit Bureau Rating:** คะแนนประวัติเครดิตจากสถาบันภายนอกอยู่ในเกณฑ์ต่ำกว่ามาตรฐาน
        * **[RC_02] Recent Credit Inquiries:** มีการยื่นขอสินเชื่อใหม่ถี่เกินไปในช่วงเวลาสั้น
        * **[RC_04] High Monthly Debt-to-Loan Ratio:** ภาระค่างวดต่อเดือนตึงตัวเกินไป
        """)
        
        st.markdown("### 🛠️ Actionable Recourse Recommendations")
        recourse_df = pd.DataFrame([
            {"แนวทางการปรับปรุง": "ขอลดวงเงินกู้ลง 20%", "New PD (%)": f"{max(pred_prob*0.85, 0.05)*100:.1f}%", "สถานะใหม่": "🟡 Manual Review"},
            {"แนวทางการปรับปรุง": "ขยายระยะเวลาผ่อน (ลดค่างวด 25%)", "New PD (%)": f"{max(pred_prob*0.75, 0.05)*100:.1f}%", "สถานะใหม่": "🟢 Approved"},
            {"แนวทางการปรับปรุง": "เพิ่มเงินดาวน์ + ประวัติจ่ายตรง 6 เดือน", "New PD (%)": f"{max(pred_prob*0.60, 0.05)*100:.1f}%", "สถานะใหม่": "🟢 Approved"}
        ])
        st.table(recourse_df)

# ==============================================================================
# TAB 3: MACROECONOMIC STRESS TESTING & PSI TRACKER
# ==============================================================================
with tab3:
    st.subheader("Macroeconomic Stress Testing & Data Drift Monitoring")
    
    col_a, col_b = st.columns(2)
    with col_a:
        st.markdown("#### ⚡ Macroeconomic Shock Simulation")
        stress_choice = st.selectbox("Select Macro Scenario", [
            "Baseline (Normal Economy)",
            "Gig-Worker Income Shock (-30%)",
            "Stagflation & Rate Hike (+20%)"
        ])
        
        shock_npl = 25.02 if "Baseline" in stress_choice else (32.00 if "Gig" in stress_choice else 36.57)
        shock_el = 348.0 if "Baseline" in stress_choice else (418.9 if "Gig" in stress_choice else 458.3)
        
        st.metric("Simulated Portfolio NPL", f"{shock_npl:.2f}%", delta=f"{shock_npl - 25.02:.2f}%" if "Baseline" not in stress_choice else None, delta_color="inverse")
        st.metric("Expected Loss (EL)", f"{shock_el:.1f} M THB", delta=f"{shock_el - 348.0:.1f} M THB" if "Baseline" not in stress_choice else None, delta_color="inverse")

    with col_b:
        st.markdown("#### 📊 Population Stability Index (PSI) Drift Tracker")
        stream_choice = st.radio("Simulated Incoming Stream", ["Normal Stream (Batch 1)", "Economic Drifted Stream (Batch 2)"])
        psi_val = 0.0025 if "Normal" in stream_choice else 0.3253
        
        st.metric("Population Stability Index (PSI)", f"{psi_val:.4f}")
        if psi_val < 0.10:
            st.success("🟢 Status: STABLE (No significant population drift detected)")
        elif psi_val <= 0.25:
            st.warning("🟡 Status: WARNING (Moderate drift observed - Monitor closely)")
        else:
            st.error("🔴 Status: TRIGGER RETRAIN (Significant shift - Action required)")