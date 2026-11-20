import React, { useState } from 'react';
import { Sliders, RotateCcw, TrendingDown, HeartPulse, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RiskSimulator({ initialVitals = {}, initialRisk = 0.45, biomarkers = {} }) {
  const baseAge = parseFloat(initialVitals.age) || 50;
  const baseSbp = parseFloat(initialVitals.systolic_bp) || 135;
  const baseChol = parseFloat(initialVitals.cholesterol) || 210;
  const baseBmi = parseFloat(initialVitals.bmi) || 27;
  const baseSmoking = initialVitals.smoking_status === 'current';
  const baseDiabetes = Boolean(initialVitals.diabetes);

  const [sbp, setSbp] = useState(baseSbp);
  const [chol, setChol] = useState(baseChol);
  const [bmi, setBmi] = useState(baseBmi);
  const [smoking, setSmoking] = useState(baseSmoking);

  const resetVitals = () => {
    setSbp(baseSbp);
    setChol(baseChol);
    setBmi(baseBmi);
    setSmoking(baseSmoking);
  };

  // Compute counterfactual risk delta
  const sbpDelta = (sbp - baseSbp) * 0.0032;
  const cholDelta = (chol - baseChol) * 0.0014;
  const bmiDelta = (bmi - baseBmi) * 0.007;
  const smokingDelta = (smoking !== baseSmoking) ? (smoking ? 0.12 : -0.12) : 0;

  const adjustedProb = Math.max(0.05, Math.min(0.95, initialRisk + sbpDelta + cholDelta + bmiDelta + smokingDelta));
  const riskDiff = adjustedProb - initialRisk;
  const isReduced = riskDiff < -0.005;

  const currentPct = (initialRisk * 100).toFixed(1);
  const projectedPct = (adjustedProb * 100).toFixed(1);
  const diffPct = Math.abs(riskDiff * 100).toFixed(1);

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      padding: '1.75rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      marginBottom: '2rem'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '0.625rem', borderRadius: '10px' }}>
            <Sliders size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Interactive "What-If" Clinical Intervention Simulator
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
              Simulate therapeutic interventions to project personalized cardiovascular risk trajectory reduction.
            </p>
          </div>
        </div>
        <button
          onClick={resetVitals}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: '#f1f5f9', border: '1px solid #cbd5e1',
            padding: '0.5rem 0.875rem', borderRadius: '8px',
            fontSize: '0.8125rem', fontWeight: 600, color: '#475569',
            cursor: 'pointer'
          }}
        >
          <RotateCcw size={14} /> Reset Baseline
        </button>
      </div>

      {/* Grid: Sliders & Projected Outcome */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', alignItems: 'center' }}>
        {/* Controls Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Systolic BP Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', fontSize: '0.875rem' }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>Systolic Blood Pressure</span>
              <span style={{ fontWeight: 700, color: sbp <= 120 ? '#16a34a' : (sbp >= 140 ? '#dc2626' : '#d97706') }}>
                {sbp} mmHg {sbp <= 120 ? '(Optimal)' : (sbp >= 140 ? '(Hypertensive)' : '(Pre-HTN)')}
              </span>
            </div>
            <input
              type="range"
              min="90"
              max="200"
              step="1"
              value={sbp}
              onChange={(e) => setSbp(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#004d40', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#94a3b8' }}>
              <span>90 mmHg (Hypo)</span>
              <span>120 mmHg (Target)</span>
              <span>200 mmHg (Crisis)</span>
            </div>
          </div>

          {/* Cholesterol Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', fontSize: '0.875rem' }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>Total Cholesterol</span>
              <span style={{ fontWeight: 700, color: chol < 200 ? '#16a34a' : (chol >= 240 ? '#dc2626' : '#d97706') }}>
                {chol} mg/dL {chol < 200 ? '(Desirable)' : (chol >= 240 ? '(High)' : '(Borderline)')}
              </span>
            </div>
            <input
              type="range"
              min="120"
              max="320"
              step="2"
              value={chol}
              onChange={(e) => setChol(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#004d40', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#94a3b8' }}>
              <span>120 mg/dL</span>
              <span>200 mg/dL (Target)</span>
              <span>320 mg/dL</span>
            </div>
          </div>

          {/* BMI Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', fontSize: '0.875rem' }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>Body Mass Index (BMI)</span>
              <span style={{ fontWeight: 700, color: (bmi >= 18.5 && bmi <= 24.9) ? '#16a34a' : (bmi >= 30 ? '#dc2626' : '#d97706') }}>
                {bmi.toFixed(1)} kg/m²
              </span>
            </div>
            <input
              type="range"
              min="18"
              max="42"
              step="0.5"
              value={bmi}
              onChange={(e) => setBmi(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#004d40', cursor: 'pointer' }}
            />
          </div>

          {/* Smoking Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Smoking Status</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setSmoking(false)}
                style={{
                  padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                  background: !smoking ? '#10b981' : 'white',
                  color: !smoking ? 'white' : '#64748b',
                  border: '1px solid ' + (!smoking ? '#10b981' : '#cbd5e1'),
                  cursor: 'pointer'
                }}
              >
                Cessation / Non-Smoker
              </button>
              <button
                type="button"
                onClick={() => setSmoking(true)}
                style={{
                  padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                  background: smoking ? '#dc2626' : 'white',
                  color: smoking ? 'white' : '#64748b',
                  border: '1px solid ' + (smoking ? '#dc2626' : '#cbd5e1'),
                  cursor: 'pointer'
                }}
              >
                Active Smoker
              </button>
            </div>
          </div>
        </div>

        {/* Projected Outcome Card */}
        <div style={{
          background: isReduced ? 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)' : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '16px',
          padding: '2rem 1.5rem',
          color: 'white',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.85, fontWeight: 600 }}>
            Projected Post-Intervention Risk
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '3rem', fontWeight: 800 }}>{projectedPct}%</span>
            <span style={{ fontSize: '1rem', opacity: 0.7 }}>from {currentPct}%</span>
          </div>

          {riskDiff !== 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              background: isReduced ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)',
              color: isReduced ? '#4ade80' : '#f87171',
              padding: '0.35rem 0.875rem', borderRadius: '20px',
              fontSize: '0.875rem', fontWeight: 700
            }}>
              {isReduced ? <TrendingDown size={16} /> : <AlertCircle size={16} />}
              {isReduced ? `Projected -${diffPct}% Absolute Risk Reduction` : `+${diffPct}% Elevated Risk`}
            </div>
          )}

          <p style={{ fontSize: '0.8125rem', opacity: 0.8, lineHeight: 1.5, margin: 0 }}>
            {isReduced
              ? 'Target blood pressure control and lifestyle modification can reverse microvascular strain and significantly reduce cardiovascular event hazard.'
              : 'Maintaining optimal clinical targets minimizes microvascular remodeling and end-organ deterioration.'}
          </p>
        </div>
      </div>
    </div>
  );
}
