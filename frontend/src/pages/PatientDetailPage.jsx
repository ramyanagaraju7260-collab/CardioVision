import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  UserRound, Activity, ChevronRight, Calendar, TrendingUp,
  TrendingDown, Minus, ShieldAlert, HeartPulse, PlusCircle,
  Eye, CheckCircle2, AlertTriangle, Clock
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import { getPatient, getPatientTrajectory, simulateFollowUpVisit } from '../services/api';

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [trajectoryData, setTrajectoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState('all'); // 'all', 'risk', 'bp', 'biomarkers'

  // Follow-up modal state
  const [showModal, setShowModal] = useState(false);
  const [submittingVisit, setSubmittingVisit] = useState(false);
  const [visitForm, setVisitForm] = useState({
    systolic_bp: 125,
    diastolic_bp: 80,
    cholesterol: 190,
    bmi: 24.5,
    diabetes: false,
    smoking_status: 'never'
  });

  const loadData = () => {
    Promise.all([
      getPatient(id),
      getPatientTrajectory(id),
    ])
      .then(([pRes, trajRes]) => {
        setPatient(pRes.data);
        setTrajectoryData(trajRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSimulateSubmit = async (e) => {
    e.preventDefault();
    setSubmittingVisit(true);
    try {
      await simulateFollowUpVisit(id, visitForm);
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to log follow-up visit:', err);
    } finally {
      setSubmittingVisit(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--color-slate)' }}>Patient not found.</p>
      </div>
    );
  }

  const kpis = trajectoryData?.kpis || {};
  const trajectory = trajectoryData?.trajectory || [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-deep-teal)', margin: 0 }}>
            {patient.name}
          </h1>
          <p className="page-subtitle" style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            MRN: {patient.patient_code} • Longitudinal Health Trajectory
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            onClick={() => setShowModal(true)}
            style={{ background: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #cbd5e1' }}
          >
            <PlusCircle size={16} color="#004d40" /> Log / Simulate Follow-Up Visit
          </button>
          <button
            className="btn-primary"
            onClick={() => navigate('/assessment/new', { state: { patient } })}
            style={{ background: '#004d40', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Activity size={16} /> New Full Assessment
          </button>
        </div>
      </div>

      {/* Patient Demographic Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Patient ID', value: patient.patient_code, icon: UserRound },
          { label: 'Age', value: `${patient.age} years`, icon: Calendar },
          { label: 'Gender', value: patient.gender, icon: UserRound },
          { label: 'Registered', value: new Date(patient.created_at).toLocaleDateString(), icon: Calendar },
        ].map((item) => (
          <div className="card-compact" key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'white', borderRadius: '10px' }}>
            <item.icon size={18} style={{ color: '#004d40' }} />
            <div>
              <div style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>{item.label}</div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Longitudinal Trajectory KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        
        {/* Current Risk Card */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Current CVD Risk Probability</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.25rem 0' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: kpis.current_risk >= 50 ? '#dc2626' : '#16a34a' }}>
              {kpis.current_risk != null ? `${kpis.current_risk}%` : '—'}
            </span>
            {kpis.total_risk_change !== 0 && (
              <span style={{
                fontSize: '0.75rem', fontWeight: 700,
                color: kpis.total_risk_change > 0 ? '#dc2626' : '#16a34a',
                display: 'flex', alignItems: 'center'
              }}>
                {kpis.total_risk_change > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {kpis.total_risk_change > 0 ? `+${kpis.total_risk_change}%` : `${kpis.total_risk_change}%`}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
            Baseline: {kpis.baseline_risk}% ({trajectoryData?.total_assessments || 0} visits total)
          </div>
        </div>

        {/* Velocity Status Card */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Progression Velocity</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: kpis.velocity_status === 'Accelerating Risk' ? '#dc2626' : '#16a34a', margin: '0.35rem 0' }}>
            {kpis.velocity_status || 'Stable'}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
            {kpis.velocity_status === 'Accelerating Risk' ? 'Rapid risk accumulation across visits' : 'Hemodynamically responding to treatment'}
          </div>
        </div>

        {/* Blood Pressure Trend */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Blood Pressure Control</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: kpis.bp_status?.includes('Controlled') ? '#16a34a' : '#d97706', margin: '0.35rem 0' }}>
            {kpis.bp_status || 'Evaluating'}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
            Target: &lt;130/80 mmHg (AHA/ACC 2017)
          </div>
        </div>

        {/* Microvascular Status */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Retinal Microvasculature</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: kpis.microvascular_status?.includes('Preserved') ? '#16a34a' : '#dc2626', margin: '0.35rem 0' }}>
            {kpis.microvascular_status || 'Preserved'}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
            Arteriolar caliber status & stability
          </div>
        </div>
      </div>

      {/* LONGITUDINAL PROGRESSION CHART */}
      <div className="card" style={{ background: 'white', borderRadius: '14px', marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-deep-teal)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} color="#004d40" /> Longitudinal Multi-Parameter Progression
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.8125rem', margin: '0.25rem 0 0 0' }}>
              Tracking risk probability, blood pressure, and retinal AVR across sequential patient visits.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', background: '#f1f5f9', padding: '0.2rem', borderRadius: '6px' }}>
            {[
              { id: 'all', label: 'All Metrics' },
              { id: 'risk', label: 'CVD Risk %' },
              { id: 'bp', label: 'Blood Pressure' },
              { id: 'biomarkers', label: 'Retinal AVR' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveMetric(tab.id)}
                style={{
                  border: 'none', background: activeMetric === tab.id ? 'white' : 'transparent',
                  color: activeMetric === tab.id ? '#004d40' : '#64748b',
                  fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {trajectory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.875rem' }}>
            No assessment points available to chart. Click "Log / Simulate Follow-Up Visit" above to add visits.
          </div>
        ) : (
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trajectory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: 'white', fontSize: '0.75rem' }}
                />
                <Legend />
                {(activeMetric === 'all' || activeMetric === 'risk') && (
                  <Line type="monotone" dataKey="risk_percentage" name="CVD Risk %" stroke="#dc2626" strokeWidth={3} dot={{ r: 5 }} />
                )}
                {(activeMetric === 'all' || activeMetric === 'bp') && (
                  <Line type="monotone" dataKey="systolic_bp" name="Systolic BP (mmHg)" stroke="#0284c7" strokeWidth={2} dot={{ r: 4 }} />
                )}
                {(activeMetric === 'all' || activeMetric === 'bp') && (
                  <Line type="monotone" dataKey="diastolic_bp" name="Diastolic BP (mmHg)" stroke="#38bdf8" strokeWidth={2} strokeDasharray="4 4" />
                )}
                {(activeMetric === 'all' || activeMetric === 'biomarkers') && (
                  <Line type="monotone" dataKey="cholesterol" name="Cholesterol (mg/dL)" stroke="#f59e0b" strokeWidth={2} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Assessment History Table */}
      <div className="card" style={{ background: 'white', borderRadius: '14px', padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-deep-teal)', margin: '0 0 1rem 0' }}>
          Assessment History ({trajectory.length} Records)
        </h3>
        {trajectory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-slate)', fontSize: '0.875rem' }}>
            No assessments yet for this patient.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Visit</th>
                  <th>Date</th>
                  <th>Risk Level</th>
                  <th>Probability</th>
                  <th>Blood Pressure</th>
                  <th>Cholesterol</th>
                  <th>Retinal AVR</th>
                  <th>Delta (Baseline)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {trajectory.map((p) => (
                  <tr key={p.prediction_id}>
                    <td style={{ fontWeight: 700 }}>#{p.visit_index}</td>
                    <td style={{ fontSize: '0.8125rem' }}>{p.date}</td>
                    <td>
                      <span className={`badge ${p.risk_level === 'HIGH_RISK' ? 'badge-high' : (p.risk_level === 'MEDIUM_RISK' ? 'badge-medium' : 'badge-low')}`}>
                        {p.risk_level === 'HIGH_RISK' ? 'High Risk' : (p.risk_level === 'MEDIUM_RISK' ? 'Medium Risk' : 'Low Risk')}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{p.risk_percentage}%</td>
                    <td>{p.systolic_bp} / {p.diastolic_bp} mmHg</td>
                    <td>{p.cholesterol} mg/dL</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.avr.toFixed(2)}</td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 700,
                        color: p.delta_baseline > 0 ? '#dc2626' : (p.delta_baseline < 0 ? '#16a34a' : '#64748b')
                      }}>
                        {p.delta_baseline > 0 ? `+${p.delta_baseline}%` : `${p.delta_baseline}%`}
                      </span>
                    </td>
                    <td>
                      <button className="btn-ghost" onClick={() => navigate(`/predictions/${p.prediction_id}`)}>
                        View <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SIMULATE FOLLOW-UP VISIT MODAL */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            background: 'white', borderRadius: '14px', width: '100%', maxWidth: '500px',
            padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: 800, color: '#004d40' }}>
              Log Follow-Up Clinical Assessment
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.8125rem', margin: '0 0 1.25rem 0' }}>
              Simulate or record sequential visit data to view updated longitudinal trajectory and risk velocity.
            </p>

            <form onSubmit={handleSimulateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={visitForm.systolic_bp}
                    onChange={(e) => setVisitForm({ ...visitForm, systolic_bp: parseFloat(e.target.value) })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={visitForm.diastolic_bp}
                    onChange={(e) => setVisitForm({ ...visitForm, diastolic_bp: parseFloat(e.target.value) })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Total Cholesterol (mg/dL)</label>
                  <input
                    type="number"
                    value={visitForm.cholesterol}
                    onChange={(e) => setVisitForm({ ...visitForm, cholesterol: parseFloat(e.target.value) })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>BMI (kg/m²)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={visitForm.bmi}
                    onChange={(e) => setVisitForm({ ...visitForm, bmi: parseFloat(e.target.value) })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Diabetes</label>
                  <select
                    value={visitForm.diabetes ? 'yes' : 'no'}
                    onChange={(e) => setVisitForm({ ...visitForm, diabetes: e.target.value === 'yes' })}
                    className="form-input"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Smoking Status</label>
                  <select
                    value={visitForm.smoking_status}
                    onChange={(e) => setVisitForm({ ...visitForm, smoking_status: e.target.value })}
                    className="form-input"
                  >
                    <option value="never">Never</option>
                    <option value="former">Former</option>
                    <option value="current">Current</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={submittingVisit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ background: '#004d40' }}
                  disabled={submittingVisit}
                >
                  {submittingVisit ? 'Processing...' : 'Save & Compute Trajectory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
