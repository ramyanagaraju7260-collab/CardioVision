import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Filter, Search, User, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { getReports } from '../services/api';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');

  useEffect(() => {
    getReports()
      .then((res) => {
        setReports(res.data.reports || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      r.patient_code.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = filterRisk === 'ALL' || r.risk_level === filterRisk;
    return matchesSearch && matchesRisk;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', minHeight: 'calc(100vh - 73px)', background: '#f8fafc' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '14px', color: '#2563eb' }}>
            <FileText size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Clinical Assessment Reports</h1>
            <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>
              Comprehensive multi-page clinical reports with microvascular biomarkers, traditional risk comparisons, and ocular imaging.
            </p>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search patient or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '0.625rem 1rem 0.625rem 2.25rem', borderRadius: '8px', border: '1px solid #cbd5e1',
                fontSize: '0.875rem', background: 'white', outline: 'none', width: '220px'
              }}
            />
          </div>

          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            style={{
              padding: '0.625rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1',
              fontSize: '0.875rem', background: 'white', outline: 'none', color: '#334155'
            }}
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="HIGH_RISK">High Risk Only</option>
            <option value="MEDIUM_RISK">Medium Risk Only</option>
            <option value="LOW_RISK">Low Risk Only</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="loading-spinner" />
          </div>
        ) : filteredReports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
            <FileText size={48} style={{ opacity: 0.3, margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>No matching clinical reports found</h3>
            <p style={{ fontSize: '0.875rem', maxWidth: '400px', margin: '0.5rem auto' }}>
              Assessments generated through the assessment portal or batch cohort screening will automatically appear here.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '1.25rem 1.5rem', fontWeight: 700, color: '#475569' }}>Report ID</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontWeight: 700, color: '#475569' }}>Patient & Assessment</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontWeight: 700, color: '#475569' }}>Risk Stratification</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontWeight: 700, color: '#475569' }}>Date Generated</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontWeight: 700, color: '#475569' }}>Format</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report, idx) => (
                  <tr
                    key={report.id || idx}
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                    onMouseOver={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'white')}
                  >
                    <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600, color: '#0f172a' }}>
                      {report.id}
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{report.patient_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{report.patient_code} • Assessment #{report.prediction_id}</div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span style={{
                        padding: '0.25rem 0.625rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                        background: report.risk_level === 'HIGH_RISK' ? '#fee2e2' : (report.risk_level === 'MEDIUM_RISK' ? '#fef3c7' : '#dcfce7'),
                        color: report.risk_level === 'HIGH_RISK' ? '#dc2626' : (report.risk_level === 'MEDIUM_RISK' ? '#d97706' : '#16a34a')
                      }}>
                        {report.risk_level === 'HIGH_RISK' ? 'High Risk' : (report.risk_level === 'MEDIUM_RISK' ? 'Medium Risk' : 'Low Risk')} ({((report.risk_probability || 0) * 100).toFixed(1)}%)
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', color: '#64748b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={14} /> {report.date}
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 700 }}>
                        PDF
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                      <a
                        href={report.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          textDecoration: 'none', color: '#004d40', fontWeight: 700,
                          display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                          background: '#f0fdf4', padding: '0.4rem 0.875rem', borderRadius: '6px',
                          border: '1px solid #bbf7d0'
                        }}
                      >
                        <Download size={14} /> Download PDF
                      </a>
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
