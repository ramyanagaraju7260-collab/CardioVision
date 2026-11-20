import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, Info, ShieldAlert, CheckCircle2, RefreshCw, ChevronRight } from 'lucide-react';
import { getAlerts } from '../services/api';

export default function AlertsPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = () => {
    setLoading(true);
    getAlerts()
      .then((res) => {
        setAlerts(res.data.alerts || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const getColor = (type) => {
    switch (type) {
      case 'critical': return { bg: '#fee2e2', text: '#991b1b', icon: '#ef4444', border: '#fca5a5' };
      case 'warning': return { bg: '#fef3c7', text: '#92400e', icon: '#f59e0b', border: '#fcd34d' };
      case 'info': return { bg: '#e0e7ff', text: '#3730a3', icon: '#6366f1', border: '#a5b4fc' };
      case 'success': return { bg: '#dcfce3', text: '#166534', icon: '#22c55e', border: '#86efac' };
      default: return { bg: '#f1f5f9', text: '#334155', icon: '#64748b', border: '#cbd5e1' };
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'critical': return ShieldAlert;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
      case 'success': return CheckCircle2;
      default: return Bell;
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', minHeight: 'calc(100vh - 73px)', background: '#f8fafc' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '14px', color: '#f59e0b' }}>
            <Bell size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Clinical & System Alerts</h1>
            <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>
              Real-time physiological anomalies, severe hypertension flags, and model telemetry notifications.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAlerts}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="loading-spinner" />
        </div>
      ) : alerts.length === 0 ? (
        <div style={{ background: 'white', padding: '3rem', borderRadius: '16px', textAlign: 'center', color: '#64748b' }}>
          <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>No Active Alerts</h3>
          <p style={{ fontSize: '0.875rem' }}>All patient risk parameters and telemetry nodes are currently operating within normal baselines.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {alerts.map((alert) => {
            const colors = getColor(alert.type);
            const Icon = getIcon(alert.type);
            return (
              <div
                key={alert.id}
                style={{
                  background: 'white', borderRadius: '14px', border: `1px solid ${colors.border}`,
                  padding: '1.5rem', display: 'flex', gap: '1.25rem', boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{
                  background: colors.bg, width: '48px', height: '48px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Icon size={24} color={colors.icon} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.375rem' }}>
                    <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      {alert.title}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{alert.time}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
                    {alert.message}
                  </p>
                  {alert.prediction_id && (
                    <button
                      onClick={() => navigate(`/predictions/${alert.prediction_id}`)}
                      style={{
                        marginTop: '0.875rem', background: alert.type === 'critical' ? '#dc2626' : '#004d40',
                        color: 'white', border: 'none', padding: '0.45rem 1rem', borderRadius: '6px',
                        fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', display: 'inline-flex',
                        alignItems: 'center', gap: '0.375rem'
                      }}
                    >
                      Review Assessment #{alert.prediction_id} <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
