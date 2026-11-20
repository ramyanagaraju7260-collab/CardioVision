import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Download, Printer, LayoutDashboard,
  ShieldCheck, AlertTriangle, UserRound, Eye, Sparkles,
  Activity, Layers, Info, ShieldAlert, ArrowRight,
  FileCode, Clipboard, ClipboardCheck, Stethoscope,
  Pill, Target, HeartHandshake, EyeOff, ChevronDown, ChevronUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getPrediction, getModelMetrics, getReportUrl, getFhirDownloadUrl, getPredictionFhir } from '../services/api';
import RiskSimulator from '../components/RiskSimulator';

function RiskGauge({ probability, riskLevel }) {
  const pct = probability * 100;
  const angle = -90 + (pct / 100) * 180;
  const riskColor = riskLevel === 'HIGH_RISK' ? '#dc2626' : (riskLevel === 'MEDIUM_RISK' ? '#d97706' : '#16a34a');

  const x1 = 90 + 70 * Math.cos((angle * Math.PI) / 180);
  const y1 = 95 - 70 * Math.sin((-angle * Math.PI) / 180);

  return (
    <div className="risk-gauge-container">
      <svg className="risk-gauge-svg" viewBox="0 0 180 110">
        <path d="M 15 95 A 75 75 0 0 1 165 95" fill="none" stroke="#e5e7eb" strokeWidth="12" strokeLinecap="round" />
        <path
          d={`M 15 95 A 75 75 0 ${pct > 50 ? 1 : 0} 1 ${x1} ${y1}`}
          fill="none" stroke={riskColor} strokeWidth="12" strokeLinecap="round"
          style={{ transition: 'all 800ms ease' }}
        />
        <circle cx="90" cy="95" r="5" fill={riskColor} />
      </svg>
      <div className="risk-gauge-value" style={{ color: riskColor, fontSize: '2rem', fontWeight: 'bold' }}>
        {pct.toFixed(1)}%
      </div>
      <div className="risk-gauge-label">Risk Probability</div>
    </div>
  );
}

export default function PredictionResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageTab, setImageTab] = useState('original'); // 'original', 'heatmap', 'vessel'
  const [overlayOpacity, setOverlayOpacity] = useState(0.70);
  const [isOverlayMode, setIsOverlayMode] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);
  const [showFhirModal, setShowFhirModal] = useState(false);
  const [fhirData, setFhirData] = useState(null);
  const [loadingFhir, setLoadingFhir] = useState(false);

  useEffect(() => {
    Promise.all([
      getPrediction(id),
      getModelMetrics(),
    ])
      .then(([predRes, metricRes]) => {
        setPrediction(predRes.data);
        setMetrics(metricRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopyNote = () => {
    if (prediction?.cdss?.ehr_clinical_note) {
      navigator.clipboard.writeText(prediction.cdss.ehr_clinical_note);
      setCopiedNote(true);
      setTimeout(() => setCopiedNote(false), 2500);
    }
  };

  const handleOpenFhir = () => {
    setShowFhirModal(true);
    if (!fhirData) {
      setLoadingFhir(true);
      getPredictionFhir(id)
        .then((res) => setFhirData(res.data))
        .catch(() => {})
        .finally(() => setLoadingFhir(false));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--color-slate)' }}>Prediction not found.</p>
      </div>
    );
  }

  const isHighRisk = prediction.risk_level === 'HIGH_RISK';
  const isMediumRisk = prediction.risk_level === 'MEDIUM_RISK';
  const riskColor = isHighRisk ? '#dc2626' : (isMediumRisk ? '#d97706' : '#16a34a');
  const riskBg = isHighRisk ? '#fef2f2' : (isMediumRisk ? '#fffbeb' : '#f0fdf4');
  const riskLabel = isHighRisk ? 'HIGH RISK' : (isMediumRisk ? 'MEDIUM RISK' : 'LOW RISK');

  const probData = [
    { name: 'Low Risk', value: prediction.probabilities?.low_risk || 0, color: '#16a34a' },
    { name: 'Medium Risk', value: prediction.probabilities?.medium_risk || 0, color: '#d97706' },
    { name: 'High Risk', value: prediction.probabilities?.high_risk || 0, color: '#dc2626' },
  ];

  const metricsAvailable = metrics?.status !== 'pending' && metrics?.accuracy !== null;
  const clinical = prediction.clinical_data || {};
  const biomarkers = prediction.biomarkers || {};
  const markers = biomarkers.markers_breakdown || [];
  const traditional = prediction.traditional_risk || {};
  const explain = prediction.explainability || {};
  const cdss = prediction.cdss || {};
  const topContributions = prediction.feature_contributions || [];

  const activeImageUrl =
    imageTab === 'heatmap' && explain.gradcam_url
      ? explain.gradcam_url
      : imageTab === 'vessel' && (biomarkers.vessel_mask_url || explain.vessel_mask_url)
      ? (biomarkers.vessel_mask_url || explain.vessel_mask_url)
      : prediction.retinal_image_url;

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', padding: '1.5rem 1rem 4rem 1rem' }}>
      
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-deep-teal)', margin: 0 }}>
            Cardiovascular Risk Stratification
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Assessment #{prediction.id} • Patient {prediction.patient_code} ({prediction.patient_name})
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <a href={getReportUrl(id)} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ background: '#004d40', color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={15} /> PDF Report
          </a>
          <a href={getFhirDownloadUrl(id)} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ background: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCode size={15} color="#0284c7" /> Download FHIR
          </a>
          <button className="btn-secondary" onClick={handleOpenFhir} style={{ background: 'white' }}>
            <FileCode size={15} /> View FHIR
          </button>
          <button className="btn-secondary" onClick={() => window.print()} style={{ background: 'white' }}>
            <Printer size={15} /> Print
          </button>
          <button className="btn-secondary" onClick={() => navigate('/dashboard')} style={{ background: 'white' }}>
            <LayoutDashboard size={15} /> Dashboard
          </button>
        </div>
      </div>

      {/* Production Model Badge & Banner */}
      <div style={{
        background: '#f0fdf4', border: '1px solid #16a34a', borderRadius: '10px',
        padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        color: '#166534', fontWeight: 600, marginBottom: '1.75rem', boxShadow: '0 2px 8px rgba(22, 163, 74, 0.08)',
        flexWrap: 'wrap', gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle2 size={22} color="#16a34a" />
          <div>
            <span>Trained Multimodal Ensemble Inference Complete</span>
            <span style={{ fontWeight: 400, fontSize: '0.8125rem', marginLeft: '0.75rem', color: '#15803d' }}>
              Fused deep clinical vital records with computer-vision retinal microvascular morphology.
            </span>
          </div>
        </div>
        <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#166534', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid #86efac' }}>
          Production ML v{prediction.model?.version || '2.0.0'}
        </span>
      </div>

      {/* 3-COLUMN PRIMARY GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* COL 1: Retinal Image & Explainability Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card-compact" style={{ background: 'white', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-deep-teal)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Eye size={18} /> Retinal Fundus & XAI
              </h3>
              <div style={{ display: 'flex', gap: '0.25rem', background: '#f1f5f9', padding: '0.2rem', borderRadius: '6px' }}>
                <button
                  onClick={() => setImageTab('original')}
                  style={{
                    border: 'none', background: imageTab === 'original' ? 'white' : 'transparent',
                    color: imageTab === 'original' ? '#004d40' : '#64748b',
                    fontSize: '0.6875rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer'
                  }}
                >
                  Fundus
                </button>
                <button
                  onClick={() => setImageTab('heatmap')}
                  disabled={!explain.gradcam_url}
                  style={{
                    border: 'none', background: imageTab === 'heatmap' ? 'white' : 'transparent',
                    color: imageTab === 'heatmap' ? '#004d40' : '#64748b',
                    fontSize: '0.6875rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer',
                    opacity: explain.gradcam_url ? 1 : 0.5
                  }}
                >
                  Heatmap
                </button>
                <button
                  onClick={() => setImageTab('vessel')}
                  disabled={!(biomarkers.vessel_mask_url || explain.vessel_mask_url)}
                  style={{
                    border: 'none', background: imageTab === 'vessel' ? 'white' : 'transparent',
                    color: imageTab === 'vessel' ? '#004d40' : '#64748b',
                    fontSize: '0.6875rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer',
                    opacity: (biomarkers.vessel_mask_url || explain.vessel_mask_url) ? 1 : 0.5
                  }}
                >
                  Vessels
                </button>
              </div>
            </div>

            <div style={{ width: '100%', height: '240px', background: '#000', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {/* Base Fundus Image (rendered behind overlay when in overlay mode) */}
              {prediction.retinal_image_url && isOverlayMode && imageTab !== 'original' && (
                <img
                  src={prediction.retinal_image_url}
                  alt="Base Retinal Fundus"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
                />
              )}
              {activeImageUrl ? (
                <img
                  src={activeImageUrl}
                  alt="Retinal Fundus / Biomarker Visualization"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'relative',
                    opacity: (isOverlayMode && imageTab !== 'original') ? overlayOpacity : 1.0,
                    mixBlendMode: (isOverlayMode && imageTab === 'heatmap') ? 'screen' : 'normal',
                    transition: 'opacity 120ms ease'
                  }}
                />
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '0.8125rem' }}>No retinal image available</div>
              )}
              <div style={{
                position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.75)',
                color: 'white', fontSize: '0.6875rem', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'capitalize', zIndex: 2
              }}>
                {imageTab === 'original'
                  ? 'Retinal Fundus Color Image'
                  : isOverlayMode
                  ? `${imageTab === 'heatmap' ? 'Grad-CAM' : 'Vessels'} Overlaid on Fundus (${(overlayOpacity * 100).toFixed(0)}%)`
                  : imageTab === 'heatmap'
                  ? 'Grad-CAM Attention Heatmap'
                  : 'Segmented Microvasculature'}
              </div>
            </div>

            {/* Interactive Overlay & Transparency Controls */}
            {imageTab !== 'original' && (
              <div style={{ marginTop: '0.625rem', padding: '0.45rem 0.625rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: '#004d40', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isOverlayMode}
                    onChange={(e) => setIsOverlayMode(e.target.checked)}
                    style={{ accentColor: '#004d40' }}
                  />
                  Overlay on Eye
                </label>
                {isOverlayMode && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, maxWidth: '180px' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {(overlayOpacity * 100).toFixed(0)}%
                    </span>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={overlayOpacity}
                      onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#004d40', cursor: 'pointer' }}
                    />
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
              {imageTab === 'heatmap'
                ? 'Highlighting microvascular arteriolar attenuation and optic disc arcade regions driving neural risk prediction.'
                : imageTab === 'vessel'
                ? 'Binary vessel segmentation extracted via adaptive morphological thresholding and CLAHE green-channel isolation.'
                : 'Macula-centered retinal fundus photograph showing arteriolar-to-venular distribution.'}
            </div>
          </div>

          {/* Top Contributing Factors */}
          {topContributions.length > 0 && (
            <div className="card-compact" style={{ background: 'white', borderRadius: '14px' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-deep-teal)', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} color="#004d40" /> Key Prediction Drivers
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {topContributions.map((fc, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0.5rem', background: '#f8fafc', borderRadius: '6px', fontSize: '0.75rem' }}>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{fc.factor}</span>
                    <span style={{ color: '#004d40', fontWeight: 700 }}>{fc.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COL 2: Quantitative Risk Prediction */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card-compact" style={{ background: 'white', borderRadius: '14px', textAlign: 'center', padding: '1.5rem 1rem' }}>
            <RiskGauge probability={prediction.risk_probability} riskLevel={prediction.risk_level} />

            <div style={{ display: 'inline-block', padding: '0.375rem 1rem', borderRadius: '9999px', background: riskBg, color: riskColor, fontWeight: 800, fontSize: '0.9375rem', marginTop: '0.5rem', letterSpacing: '0.05em' }}>
              {riskLabel}
            </div>

            <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0.5rem 0 1rem 0' }}>
              Tiers: Low &lt; 30% · Medium 30–59% · High &ge; 60%
            </p>

            <div style={{ height: '70px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={probData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 1]} hide />
                  <YAxis type="category" dataKey="name" hide />
                  <Tooltip formatter={(v) => `${(v * 100).toFixed(1)}%`} />
                  <Bar dataKey="value" barSize={14} radius={[0, 6, 6, 0]}>
                    {probData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* COL 3: Clinical Parameters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card-compact" style={{ background: 'white', borderRadius: '14px' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-deep-teal)', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserRound size={18} /> Clinical Vitals Profile
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { label: 'Systolic BP', value: `${clinical.systolic_bp || '—'} mmHg`, status: (clinical.systolic_bp >= 140 ? 'High' : 'Normal') },
                { label: 'Diastolic BP', value: `${clinical.diastolic_bp || '—'} mmHg`, status: (clinical.diastolic_bp >= 90 ? 'High' : 'Normal') },
                { label: 'Total Cholesterol', value: `${clinical.cholesterol || '—'} mg/dL`, status: (clinical.cholesterol >= 200 ? 'Elevated' : 'Desirable') },
                { label: 'BMI', value: `${clinical.bmi || '—'} kg/m²`, status: (clinical.bmi >= 25 ? 'Overweight' : 'Normal') },
                { label: 'Diabetes Mellitus', value: clinical.diabetes ? 'Positive (Yes)' : 'Negative (No)', status: clinical.diabetes ? 'Risk Factor' : 'Normal' },
                { label: 'Smoking Status', value: clinical.smoking_status || 'Never', status: clinical.smoking_status === 'current' ? 'Active Smoker' : 'Non-Smoker' },
              ].map((item, idx) => (
                <div key={idx} style={{ background: '#f8fafc', padding: '0.625rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: '0.125rem 0' }}>{item.value}</div>
                  <div style={{ fontSize: '0.6875rem', color: item.status.includes('High') || item.status.includes('Risk') || item.status.includes('Active') || item.status.includes('Elevated') ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                    {item.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TRADITIONAL RISK VS CARDIOVISION AI COMPARISON */}
      <div className="card-compact" style={{ background: 'white', borderRadius: '14px', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-deep-teal)', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={20} /> Multi-Model Risk Comparison & Discordance Analysis
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.8125rem', margin: '0 0 1.25rem 0' }}>
          Side-by-side benchmarking of CardioVision AI against international clinical risk engines.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          
          {/* CardioVision Card */}
          <div style={{ border: '2px solid #004d40', borderRadius: '10px', padding: '1rem', background: '#f0fdfa' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#004d40', textTransform: 'uppercase' }}>CardioVision AI (Ocular+Clinical)</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: riskColor, margin: '0.25rem 0' }}>
              {(prediction.risk_probability * 100).toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>{riskLabel}</div>
            <p style={{ fontSize: '0.75rem', color: '#475569', margin: '0.5rem 0 0 0' }}>
              Captures subclinical microvascular rarefaction and arteriolar narrowing prior to major macrovascular events.
            </p>
          </div>

          {/* Framingham Card */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', background: 'white' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Framingham 10-Yr CVD (2008)</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
              {traditional.framingham?.risk_percentage != null ? `${traditional.framingham.risk_percentage}%` : '—'}
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>
              {traditional.framingham?.category || 'Standard Risk Tier'}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.5rem 0 0 0' }}>
              Traditional cohort risk assessing 10-year probability of coronary death, stroke, or heart failure.
            </p>
          </div>

          {/* AHA/ACC ASCVD Card */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', background: 'white' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>AHA / ACC ASCVD (2014)</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
              {traditional.ascvd?.risk_percentage != null ? `${traditional.ascvd.risk_percentage}%` : '—'}
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>
              {traditional.ascvd?.category || 'Standard Risk Tier'}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.5rem 0 0 0' }}>
              PCE calculation estimating 10-year risk of first hard ASCVD event (nonfatal MI or stroke).
            </p>
          </div>
        </div>

        {/* Discordance Alert Banner */}
        {traditional.discordance && (
          <div style={{
            background: traditional.discordance.discordant ? '#fffbeb' : '#f8fafc',
            border: `1px solid ${traditional.discordance.discordant ? '#f59e0b' : '#e2e8f0'}`,
            borderRadius: '8px', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem'
          }}>
            <AlertTriangle size={20} color={traditional.discordance.discordant ? '#d97706' : '#64748b'} />
            <div style={{ fontSize: '0.8125rem', color: '#1e293b' }}>
              <strong>Clinical Concordance Status: </strong>
              {traditional.discordance.interpretation}
            </div>
          </div>
        )}
      </div>

      {/* CLINICAL DECISION SUPPORT SYSTEM (CDSS) & CARE PATHWAY */}
      {cdss.summary && (
        <div className="card-compact" style={{ background: 'white', borderRadius: '14px', marginBottom: '2rem', border: '1px solid #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-deep-teal)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Stethoscope size={22} color="#004d40" /> Clinical Decision Support System (CDSS) & Care Pathway
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.8125rem', margin: '0.25rem 0 0 0' }}>
                Guideline-concordant pharmacotherapy, ophthalmic referral, and lifestyle action plan.
              </p>
            </div>
            <button
              onClick={handleCopyNote}
              className="btn-secondary"
              style={{ background: '#f8fafc', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #cbd5e1' }}
            >
              {copiedNote ? <ClipboardCheck size={16} color="#16a34a" /> : <Clipboard size={16} />}
              {copiedNote ? 'Copied to Clipboard!' : 'Copy Clinical Note for EHR'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            
            {/* 1. Statin Guidance */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Pill size={18} color="#004d40" />
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>Lipid / Statin Guidance</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: isHighRisk ? '#dc2626' : (isMediumRisk ? '#d97706' : '#004d40'), marginBottom: '0.25rem' }}>
                {cdss.statin_therapy?.tier}
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#334155', fontWeight: 600, margin: '0.25rem 0' }}>
                {cdss.statin_therapy?.medication}
              </p>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.35rem' }}>
                <strong>Guideline: </strong> {cdss.statin_therapy?.guideline}
              </div>
            </div>

            {/* 2. Antihypertensive Guidance */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Activity size={18} color="#004d40" />
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>Antihypertensive Regimen</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a', marginBottom: '0.25rem' }}>
                {cdss.antihypertensive_therapy?.stage}
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#334155', margin: '0.25rem 0' }}>
                {cdss.antihypertensive_therapy?.action}
              </p>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.35rem' }}>
                <strong>Guideline: </strong> {cdss.antihypertensive_therapy?.guideline}
              </div>
            </div>

            {/* 3. Retinal Microvascular & Ophthalmology Referral */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Eye size={18} color="#004d40" />
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>Retinal & Eye Referral</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a', marginBottom: '0.25rem' }}>
                {cdss.ophthalmology_referral?.grade}
              </div>
              <div style={{
                display: 'inline-block', background: cdss.summary.retinopathy_stage?.includes('Grade II') ? '#fee2e2' : '#dcfce7',
                color: cdss.summary.retinopathy_stage?.includes('Grade II') ? '#991b1b' : '#166534',
                fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', margin: '0.25rem 0'
              }}>
                {cdss.ophthalmology_referral?.referral_urgency}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#475569', margin: '0.35rem 0 0 0' }}>
                {cdss.ophthalmology_referral?.clinical_significance}
              </p>
            </div>
          </div>

          {/* Biomarker Target Goals */}
          {cdss.target_goals && (
            <div style={{ marginTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Target size={16} color="#004d40" /> Biomarker Target Goals
              </h4>
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#004d40' }}>Biomarker</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#004d40' }}>Current Value</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#004d40' }}>Target Clinical Goal</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: '#004d40' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cdss.target_goals.map((tg, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{tg.biomarker}</td>
                        <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontWeight: 700 }}>{tg.current}</td>
                        <td style={{ padding: '0.5rem 0.75rem', color: '#004d40', fontWeight: 700 }}>{tg.target}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <span style={{
                            padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 700,
                            background: tg.status === 'Controlled' || tg.status === 'At Goal' || tg.status === 'Normal' || tg.status === 'Preserved' ? '#dcfce7' : '#fee2e2',
                            color: tg.status === 'Controlled' || tg.status === 'At Goal' || tg.status === 'Normal' || tg.status === 'Preserved' ? '#166534' : '#991b1b'
                          }}>
                            {tg.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Lifestyle & Behavioral Prescription */}
          {cdss.lifestyle_prescriptions && (
            <div style={{ marginTop: '1rem', background: '#f8fafc', padding: '0.875rem', borderRadius: '8px', borderLeft: '4px solid #004d40' }}>
              <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#004d40', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <HeartHandshake size={16} /> Prescribed Lifestyle Interventions
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', color: '#334155', lineHeight: 1.5 }}>
                {cdss.lifestyle_prescriptions.map((lp, idx) => (
                  <li key={idx}>{lp}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* COUNTERFACTUAL WHAT-IF RISK SIMULATOR */}
      <div style={{ marginBottom: '2rem' }}>
        <RiskSimulator
          baselineRisk={prediction.risk_probability}
          clinicalData={clinical}
          biomarkers={biomarkers}
        />
      </div>

      {/* QUANTITATIVE MICROVASCULAR BIOMARKERS DASHBOARD */}
      <div className="card-compact" style={{ background: 'white', borderRadius: '14px', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-deep-teal)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} /> Quantitative Microvascular Biomarkers Dashboard
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.8125rem', margin: '0.25rem 0 0 0' }}>
              Biomarkers derived via fundus vessel segmentation, skeletonization, and caliber analysis.
            </p>
          </div>
          {biomarkers.microvascular_health_score && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600 }}>Microvascular Health Score</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: biomarkers.microvascular_health_score > 70 ? '#16a34a' : '#dc2626' }}>
                {biomarkers.microvascular_health_score} / 100
              </div>
            </div>
          )}
        </div>

        {/* 4 Primary Biomarker Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            {
              label: 'Arteriolar-to-Venular Ratio',
              value: biomarkers.avr ? biomarkers.avr.toFixed(2) : '—',
              unit: 'AVR',
              ref: '0.67 – 0.75',
              status: biomarkers.avr && biomarkers.avr < 0.67 ? 'Narrowed' : 'Normal',
              color: biomarkers.avr && biomarkers.avr < 0.67 ? '#dc2626' : '#16a34a'
            },
            {
              label: 'Vessel Density',
              value: biomarkers.vessel_density ? `${biomarkers.vessel_density.toFixed(1)}%` : '—',
              unit: 'Area %',
              ref: '9.0% – 16.0%',
              status: biomarkers.vessel_density && biomarkers.vessel_density < 9.0 ? 'Rarefaction' : 'Normal',
              color: biomarkers.vessel_density && biomarkers.vessel_density < 9.0 ? '#d97706' : '#16a34a'
            },
            {
              label: 'Vessel Tortuosity Index',
              value: biomarkers.vessel_tortuosity ? biomarkers.vessel_tortuosity.toFixed(2) : '—',
              unit: 'Index',
              ref: '1.05 – 1.18',
              status: biomarkers.vessel_tortuosity && biomarkers.vessel_tortuosity > 1.18 ? 'Elevated' : 'Normal',
              color: biomarkers.vessel_tortuosity && biomarkers.vessel_tortuosity > 1.18 ? '#dc2626' : '#16a34a'
            },
            {
              label: 'Mean Vessel Caliber',
              value: biomarkers.mean_caliber_um ? `${biomarkers.mean_caliber_um.toFixed(1)}` : '—',
              unit: 'µm',
              ref: '16.0 – 24.0 µm',
              status: 'Calibrated',
              color: '#004d40'
            },
          ].map((card, i) => (
            <div key={i} style={{ background: '#f8fafc', padding: '0.875rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b' }}>{card.label}</div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
                {card.value} <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>{card.unit}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#94a3b8' }}>
                <span>Ref: {card.ref}</span>
                <span style={{ fontWeight: 700, color: card.color }}>{card.status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Markers Breakdown Table */}
        {markers.length > 0 && (
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '0.75rem 1rem', color: '#004d40' }}>Biomarker ID</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#004d40' }}>Morphological Marker</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#004d40' }}>Computed Value</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#004d40' }}>Reference Range</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#004d40' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#004d40' }}>Clinical Significance</th>
                </tr>
              </thead>
              <tbody>
                {markers.map((m, i) => (
                  <tr key={m.id || i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 600 }}>{m.id}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0f172a' }}>{m.name}</td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 700 }}>{m.value} {m.unit}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{m.refRange}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 700,
                        background: m.status === 'Abnormal' ? '#fee2e2' : '#dcfce7',
                        color: m.status === 'Abnormal' ? '#991b1b' : '#166534'
                      }}>
                        {m.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#475569', fontSize: '0.75rem' }}>{m.significance || 'Retinal microvascular morphology parameter'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {biomarkers.clinical_summary && (
          <div style={{ marginTop: '1rem', background: '#f8fafc', padding: '0.875rem 1rem', borderRadius: '8px', borderLeft: '4px solid #004d40', fontSize: '0.8125rem', color: '#334155' }}>
            <strong>Ocular Microvascular Finding: </strong>
            {biomarkers.clinical_summary}
          </div>
        )}
      </div>

      {/* FHIR JSON MODAL / DRAWER */}
      {showFhirModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            background: 'white', borderRadius: '14px', width: '100%', maxWidth: '800px',
            maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileCode size={20} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                  HL7 FHIR R4 Document Bundle
                </h3>
              </div>
              <button
                onClick={() => setShowFhirModal(false)}
                style={{ border: 'none', background: 'transparent', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1rem 1.5rem', overflowY: 'auto', flex: 1, background: '#0f172a' }}>
              {loadingFhir ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'white' }}>
                  <div className="loading-spinner" />
                </div>
              ) : (
                <pre style={{ margin: 0, color: '#38bdf8', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  {JSON.stringify(fhirData, null, 2)}
                </pre>
              )}
            </div>

            <div style={{ padding: '0.875rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Standard LOINC & SNOMED CT coded healthcare record.
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a
                  href={getFhirDownloadUrl(id)}
                  download
                  className="btn-primary"
                  style={{ background: '#0284c7', fontSize: '0.8125rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Download size={14} /> Download JSON
                </a>
                <button
                  onClick={() => setShowFhirModal(false)}
                  className="btn-secondary"
                  style={{ fontSize: '0.8125rem' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
