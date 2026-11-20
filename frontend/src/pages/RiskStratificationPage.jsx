import { useState, useEffect } from 'react';
import { ShieldAlert, Activity, Users, AlertTriangle, PlayCircle, Download, RefreshCw, CheckCircle2, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Legend } from 'recharts';
import { getDemographics, runCohortScreening, getCohortExportUrl } from '../services/api';

export default function RiskStratificationPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [screeningLoading, setScreeningLoading] = useState(false);
  const [screeningMessage, setScreeningMessage] = useState(null);

  const fetchData = () => {
    setLoading(true);
    getDemographics()
      .then((res) => {
        setData(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunCohort = async () => {
    setScreeningLoading(true);
    setScreeningMessage(null);
    try {
      const res = await runCohortScreening();
      setScreeningMessage(`Successfully screened ${res.data.total_screened} cohort patients! (${res.data.high_risk_count} High Risk, ${res.data.medium_risk_count ?? 0} Medium Risk, ${res.data.low_risk_count} Low Risk)`);
      fetchData();
    } catch (err) {
      setScreeningMessage(err.response?.data?.detail || 'Cohort screening failed');
    } finally {
      setScreeningLoading(false);
    }
  };

  const riskData = data?.risk_data || [
    { name: 'Low Risk', value: 50, count: 0, color: '#22c55e' },
    { name: 'Medium Risk', value: 30, count: 0, color: '#f59e0b' },
    { name: 'High Risk', value: 20, count: 0, color: '#ef4444' },
  ];

  const demographicData = data?.demographic_data || [
    { age: '30-40', low: 4, medium: 2, high: 1 },
    { age: '41-50', low: 5, medium: 3, high: 2 },
    { age: '51-60', low: 3, medium: 4, high: 3 },
    { age: '60+', low: 2, medium: 3, high: 4 },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', minHeight: 'calc(100vh - 73px)', background: '#f8fafc' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '14px', color: '#ef4444' }}>
            <ShieldAlert size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Population Risk Stratification</h1>
            <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>
              Epidemiological overview and demographic clustering of patient cardiovascular risk tiers.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a
            href={getCohortExportUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', textDecoration: 'none' }}
          >
            <Download size={16} /> Export Dataset (CSV)
          </a>
          <button
            onClick={handleRunCohort}
            disabled={screeningLoading}
            style={{
              background: '#004d40', color: 'white', border: 'none',
              padding: '0.75rem 1.25rem', borderRadius: '8px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: screeningLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {screeningLoading ? <RefreshCw size={16} className="animate-spin" /> : <PlayCircle size={16} />}
            {screeningLoading ? 'Screening Cohort...' : 'Run 15-Patient Cohort Screening'}
          </button>
        </div>
      </div>

      {/* Screening Success Toast / Alert */}
      {screeningMessage && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #16a34a', borderRadius: '10px',
          padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
          color: '#15803d', fontWeight: 600, marginBottom: '1.5rem'
        }}>
          <CheckCircle2 size={20} color="#16a34a" />
          <span>{screeningMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Assessed Cohort', value: data?.total_cases ?? '—', icon: Users, color: '#0284c7' },
          { label: 'High-Risk Cases', value: data?.high_risk_count ?? '—', icon: ShieldAlert, color: '#dc2626' },
          { label: 'Medium-Risk Cases', value: data?.medium_risk_count ?? '—', icon: AlertTriangle, color: '#d97706' },
          { label: 'Low-Risk Cases', value: data?.low_risk_count ?? '—', icon: Activity, color: '#16a34a' },
          { label: 'Elevated Risk %', value: data?.total_cases ? `${((((data.high_risk_count || 0) + (data.medium_risk_count || 0)) / data.total_cases) * 100).toFixed(1)}%` : '—', icon: TrendingUp, color: '#9333ea' },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: 'white', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.8125rem', fontWeight: 600 }}>
              <span>{kpi.label}</span>
              <kpi.icon size={18} color={kpi.color} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: kpi.color, marginTop: '0.5rem' }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Pie Chart Card */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1.5rem 0', color: '#0f172a' }}>
            Overall Risk Distribution
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ width: '240px', height: '240px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskData} innerRadius={75} outerRadius={105} paddingAngle={3} dataKey="value" stroke="none">
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{data?.total_cases || 0}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Patients</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minWidth: '180px' }}>
              {riskData.map((item) => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between', background: '#f8fafc', padding: '0.875rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: item.color }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{item.name}</span>
                  </div>
                  <span style={{ fontSize: '1.125rem', color: '#0f172a', fontWeight: 800 }}>{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Chart Card */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1.5rem 0', color: '#0f172a' }}>
            Risk Stratification by Age Demographic
          </h3>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demographicData} margin={{ top: 20, right: 30, left: -10, bottom: 0 }}>
                <XAxis dataKey="age" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Bar dataKey="low" name="Low Risk" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="medium" name="Medium Risk" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="high" name="High Risk" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
