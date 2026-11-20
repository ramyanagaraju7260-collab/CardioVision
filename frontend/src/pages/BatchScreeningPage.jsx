import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers, Play, Download, CheckCircle2, AlertTriangle,
  Users, Activity, Eye, Search, Filter, ChevronRight, FileSpreadsheet
} from 'lucide-react';
import { runCohortScreening, getCohortExportUrl, getPredictions } from '../services/api';

export default function BatchScreeningPage() {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const loadCohortData = () => {
    setLoading(true);
    getPredictions({ limit: 100 })
      .then((res) => {
        setPredictions(res.data.predictions || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCohortData();
  }, []);

  const handleRunBatch = async () => {
    setRunning(true);
    setBatchResult(null);
    try {
      const res = await runCohortScreening();
      setBatchResult(res.data);
      loadCohortData();
    } catch (err) {
      console.error('Batch screening failed:', err);
    } finally {
      setRunning(false);
    }
  };

  const filteredPredictions = predictions.filter((p) => {
    const matchesSearch =
      (p.patient_code || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.patient_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesRisk =
      riskFilter === 'ALL' ||
      (riskFilter === 'HIGH' && p.risk_level === 'HIGH_RISK') ||
      (riskFilter === 'MEDIUM' && p.risk_level === 'MEDIUM_RISK') ||
      (riskFilter === 'LOW' && p.risk_level === 'LOW_RISK');
    return matchesSearch && matchesRisk;
  });

  const totalPatients = predictions.length;
  const highRiskCount = predictions.filter((p) => p.risk_level === 'HIGH_RISK').length;
  const mediumRiskCount = predictions.filter((p) => p.risk_level === 'MEDIUM_RISK').length;
  const lowRiskCount = predictions.filter((p) => p.risk_level === 'LOW_RISK').length;
  const highRiskPct = totalPatients > 0 ? ((highRiskCount / totalPatients) * 100).toFixed(1) : 0;

  return (
    <div style={{ maxWidth: '1250px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-deep-teal)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Layers size={28} color="#004d40" /> Cohort Batch Screening Studio
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Automated high-throughput screening of clinical EHR datasets and retinal fundus imaging cohorts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a
            href={getCohortExportUrl()}
            download
            className="btn-secondary"
            style={{ background: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #cbd5e1' }}
          >
            <Download size={16} /> Export Cohort CSV
          </a>
          <button
            onClick={handleRunBatch}
            disabled={running}
            className="btn-primary"
            style={{ background: '#004d40', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Play size={16} />
            {running ? 'Screening Cohort (Extracting Biomarkers)...' : 'Run Cohort Batch Screening'}
          </button>
        </div>
      </div>

      {/* Batch Execution Notification */}
      {batchResult && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px',
          padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(22, 163, 74, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={24} color="#16a34a" />
            <div>
              <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.9375rem' }}>
                Batch Screening Completed Successfully
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#15803d' }}>
                Screened {batchResult.total_screened} patient cases ({batchResult.high_risk_count} High Risk, {batchResult.low_risk_count} Low Risk).
              </div>
            </div>
          </div>
          <button
            onClick={() => setBatchResult(null)}
            style={{ border: 'none', background: 'transparent', color: '#166534', cursor: 'pointer', fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Total Cohort Patients</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#004d40', margin: '0.25rem 0' }}>
            {totalPatients}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
            Screened via multimodal inference
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>High Risk Prevalence</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626', margin: '0.25rem 0' }}>
            {highRiskPct}%
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
            {highRiskCount} patients flagged for cardiology review
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Medium Risk Cohort</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706', margin: '0.25rem 0' }}>
            {mediumRiskCount}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
            Early microvascular / borderline markers
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Low Risk Cohort</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a', margin: '0.25rem 0' }}>
            {lowRiskCount}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
            Preserved microvascular & clinical profile
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Ingestion Source</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileSpreadsheet size={18} color="#004d40" /> clinical_data_dummy.xlsx
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
            Paired with 15 synthetic fundus scans
          </div>
        </div>
      </div>

      {/* Cohort Table & Filters */}
      <div className="card" style={{ background: 'white', borderRadius: '14px', padding: '1.25rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by patient code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2rem', fontSize: '0.8125rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.35rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '6px' }}>
            {[
              { id: 'ALL', label: 'All Patients' },
              { id: 'HIGH', label: 'High Risk' },
              { id: 'MEDIUM', label: 'Medium Risk' },
              { id: 'LOW', label: 'Low Risk' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setRiskFilter(f.id)}
                style={{
                  border: 'none', background: riskFilter === f.id ? 'white' : 'transparent',
                  color: riskFilter === f.id ? '#004d40' : '#64748b',
                  fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="loading-spinner" />
          </div>
        ) : filteredPredictions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.875rem' }}>
            No cohort patients match your search. Click "Run Cohort Batch Screening" above to ingest records.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Prediction ID</th>
                  <th>Patient Code</th>
                  <th>Patient Name</th>
                  <th>Risk Tier</th>
                  <th>Probability</th>
                  <th>Model Version</th>
                  <th>Assessment Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPredictions.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700 }}>#{p.id}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.patient_code}</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{p.patient_name}</td>
                    <td>
                      <span className={`badge ${p.risk_level === 'HIGH_RISK' ? 'badge-high' : (p.risk_level === 'MEDIUM_RISK' ? 'badge-medium' : 'badge-low')}`}>
                        {p.risk_level === 'HIGH_RISK' ? 'High Risk' : (p.risk_level === 'MEDIUM_RISK' ? 'Medium Risk' : 'Low Risk')}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: p.risk_level === 'HIGH_RISK' ? '#dc2626' : (p.risk_level === 'MEDIUM_RISK' ? '#d97706' : '#16a34a') }}>
                      {(p.risk_probability * 100).toFixed(1)}%
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>v{p.model_version}</td>
                    <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <button
                        className="btn-ghost"
                        onClick={() => navigate(`/predictions/${p.id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        Review <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
