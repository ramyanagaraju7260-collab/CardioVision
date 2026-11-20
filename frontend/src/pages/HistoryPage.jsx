import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, ChevronRight, History as HistoryIcon, Trash2 } from 'lucide-react';
import { getPredictions, getReportUrl, deletePrediction } from '../services/api';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [page, setPage] = useState(0);
  const limit = 20;

  const fetchData = () => {
    setLoading(true);
    getPredictions({
      search: search || undefined,
      risk_level: riskFilter || undefined,
      skip: page * limit,
      limit,
    })
      .then((res) => {
        setPredictions(res.data.predictions || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page, riskFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchData();
  };

  const totalPages = Math.ceil(total / limit);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assessment?')) return;
    try {
      await deletePrediction(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Assessment History</h1>
        <p className="page-subtitle">{total} assessment{total !== 1 ? 's' : ''} recorded</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '200px', maxWidth: '400px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate)' }} />
            <input className="input" placeholder="Search patient..." value={search}
              onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem' }} />
          </div>
          <button type="submit" className="btn-secondary">Search</button>
        </form>
        <select className="input" value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setPage(0); }}
          style={{ width: 'auto', minWidth: '150px' }}>
          <option value="">All Risk Levels</option>
          <option value="LOW_RISK">Low Risk</option>
          <option value="MEDIUM_RISK">Medium Risk</option>
          <option value="HIGH_RISK">High Risk</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="loading-spinner" />
          </div>
        ) : predictions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-slate)' }}>
            <HistoryIcon size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
            <p>No assessments found.</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Patient</th>
                    <th>Risk Level</th>
                    <th>Probability</th>
                    <th>Model</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>#{p.id}</td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--color-ink)' }}>{p.patient_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-slate)' }}>{p.patient_code}</div>
                      </td>
                      <td>
                        <span className={`badge ${p.risk_level === 'HIGH_RISK' ? 'badge-high' : (p.risk_level === 'MEDIUM_RISK' ? 'badge-medium' : 'badge-low')}`}>
                          {p.risk_level === 'HIGH_RISK' ? 'High Risk' : (p.risk_level === 'MEDIUM_RISK' ? 'Medium Risk' : 'Low Risk')}
                        </span>
                      </td>
                      <td>{(p.risk_probability * 100).toFixed(1)}%</td>
                      <td style={{ fontSize: '0.8125rem' }}>v{p.model_version}</td>
                      <td style={{ fontSize: '0.8125rem' }}>
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <button className="btn-ghost" onClick={() => navigate(`/predictions/${p.id}`)}>
                            View <ChevronRight size={14} />
                          </button>
                          <a href={getReportUrl(p.id)} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ textDecoration: 'none' }}>
                            <Download size={14} />
                          </a>
                          <button className="btn-ghost" onClick={() => handleDelete(p.id)} style={{ color: 'var(--color-risk-high)' }} title="Delete Assessment">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn-ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-slate)', display: 'flex', alignItems: 'center' }}>
                  Page {page + 1} of {totalPages}
                </span>
                <button className="btn-ghost" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
