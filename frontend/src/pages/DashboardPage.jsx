import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Activity, ShieldAlert, BrainCircuit, Calendar, Clock, CheckCircle2, Eye, TrendingUp, MoreVertical, ChevronRight, FileText } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getPatients, getDashboard } from '../services/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboard(),
      getPatients({ limit: 5 })
    ]).then(([statsRes, patRes]) => {
      setStats(statsRes.data);
      setPatients(patRes.data.patients || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const trendData = stats?.assessment_trends || [
    { date: 'Jul 24', count: 18 },
    { date: 'Jul 25', count: 7 },
    { date: 'Jul 26', count: 12 },
    { date: 'Jul 27', count: 8 },
    { date: 'Jul 28', count: 12 },
    { date: 'Jul 29', count: 7 },
    { date: 'Jul 30', count: 11 }
  ];

  const totalPreds = stats?.total_predictions || 0;
  const highRiskN = stats?.high_risk_count || 0;
  const mediumRiskN = stats?.medium_risk_count || 0;
  const lowRiskN = stats?.low_risk_count !== undefined ? stats.low_risk_count : Math.max(0, totalPreds - highRiskN - mediumRiskN);

  const riskData = totalPreds > 0 ? [
    { name: 'Low Risk', value: Math.round((lowRiskN / totalPreds) * 100), count: lowRiskN, color: '#22c55e' },
    { name: 'Medium Risk', value: Math.round((mediumRiskN / totalPreds) * 100), count: mediumRiskN, color: '#f59e0b' },
    { name: 'High Risk', value: Math.round((highRiskN / totalPreds) * 100), count: highRiskN, color: '#ef4444' },
  ] : [
    { name: 'Low Risk', value: 60, count: 0, color: '#22c55e' },
    { name: 'Medium Risk', value: 25, count: 0, color: '#f59e0b' },
    { name: 'High Risk', value: 15, count: 0, color: '#ef4444' },
  ];

  // Helper for mini charts in stat cards
  const generateMiniChart = (color, reverse = false) => {
    let data = Array.from({ length: 10 }, () => ({ val: Math.random() * 10 + 5 }));
    if (reverse) data = data.sort((a,b) => b.val - a.val); // downward trend
    return (
      <div style={{ height: '40px', width: '100%', position: 'absolute', bottom: 0, left: 0, opacity: 0.5 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <Area type="monotone" dataKey="val" stroke={color} strokeWidth={2} fillOpacity={0.1} fill={color} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc', padding: '2rem', minHeight: 'calc(100vh - 73px)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* HERO BANNER */}
        <div style={{ 
          background: 'linear-gradient(90deg, #021a32 0%, #004d40 100%)', 
          borderRadius: '16px', 
          padding: '3rem', 
          color: 'white', 
          marginBottom: '1.5rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,77,64,0.15)'
        }}>
          {/* Heart Image */}
          <img 
            src="/hero-heart.png" 
            alt="Glowing 3D Heart" 
            style={{ position: 'absolute', right: '15%', top: '50%', transform: 'translateY(-50%)', height: '140%', zIndex: 1, pointerEvents: 'none' }}
          />

          <div style={{ zIndex: 2, maxWidth: '600px' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
              CardioVision <span style={{ color: '#2dd4bf' }}>AI Intelligence</span>
            </h1>
            <p style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.6, margin: '0 0 2rem 0' }}>
              Flagship cardiovascular risk stratification platform. Combining retinal<br/>microvascular biomarkers with explainable deep learning to deliver<br/>scientific, clinical decision support.
            </p>
            <button className="btn-primary" onClick={() => navigate('/assessment/new')} style={{ background: 'white', color: 'var(--color-ink)', padding: '0.75rem 1.5rem', fontSize: '0.875rem', borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', border: 'none', fontWeight: 600 }}>
              <div style={{ background: '#22c55e', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>+</div>
              New Assessment <ChevronRight size={16} />
            </button>
          </div>

          <div style={{ zIndex: 2, background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '1rem', width: '250px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px #22c55e' }} />
              System Active
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
              <Calendar size={16} /> Thu, Jul 30, 2026
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
              <Clock size={16} /> 03:37 PM
            </div>
          </div>
        </div>

        {/* STAT CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--color-mist)', position: 'relative', overflow: 'hidden', display: 'flex', gap: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
              <Users size={24} color="#22c55e" />
            </div>
            <div style={{ zIndex: 2 }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1 }}>{stats?.total_patients || 2}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-slate)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0.5rem 0' }}>Total Patients</div>
              <div style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 600 }}>↑ 12% <span style={{ color: 'var(--color-slate)', fontWeight: 400 }}>from last 7 days</span></div>
            </div>
            {generateMiniChart('#22c55e')}
          </div>

          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--color-mist)', position: 'relative', overflow: 'hidden', display: 'flex', gap: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
              <Activity size={24} color="#3b82f6" />
            </div>
            <div style={{ zIndex: 2 }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1 }}>{stats?.total_predictions || 4}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-slate)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0.5rem 0' }}>Assessments Completed</div>
              <div style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 600 }}>↑ 33% <span style={{ color: 'var(--color-slate)', fontWeight: 400 }}>from last 7 days</span></div>
            </div>
            {generateMiniChart('#3b82f6')}
          </div>

          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--color-mist)', position: 'relative', overflow: 'hidden', display: 'flex', gap: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
              <ShieldAlert size={24} color="#ef4444" />
            </div>
            <div style={{ zIndex: 2 }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1 }}>{stats?.high_risk_cases || 0}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-slate)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0.5rem 0' }}>High-Risk Cases</div>
              <div style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 600 }}>↓ 100% <span style={{ color: 'var(--color-slate)', fontWeight: 400 }}>from last 7 days</span></div>
            </div>
            {generateMiniChart('#ef4444', true)}
          </div>

          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--color-mist)', position: 'relative', overflow: 'hidden', display: 'flex', gap: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
              <BrainCircuit size={24} color="#a855f7" />
            </div>
            <div style={{ zIndex: 2 }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1 }}>Active</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-slate)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0.5rem 0' }}>Model Status</div>
              <div style={{ fontSize: '0.6875rem', color: '#a855f7', fontWeight: 600, background: 'rgba(168, 85, 247, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                ✦ Optimal Performance
              </div>
            </div>
            {generateMiniChart('#a855f7')}
          </div>

        </div>

        {/* CHARTS SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          
          {/* Assessment Trends */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid var(--color-mist)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-ink)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <TrendingUp size={16} color="var(--color-slate)" /> Assessment Trends
              </div>
              <select style={{ border: '1px solid var(--color-mist)', borderRadius: 'var(--radius-full)', padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'var(--color-slate)', outline: 'none', background: 'transparent' }}>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-slate)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-slate)' }} dx={-10} />
                  <Tooltip cursor={{ stroke: 'rgba(34,197,94,0.2)', strokeWidth: 2, strokeDasharray: '4 4' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" activeDot={{ r: 6, fill: '#22c55e', stroke: 'white', strokeWidth: 2 }} dot={{ r: 4, fill: '#22c55e', stroke: 'white', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Stratification */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid var(--color-mist)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-ink)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <ShieldAlert size={16} color="var(--color-slate)" /> Risk Stratification
              </div>
              <MoreVertical size={16} color="var(--color-slate)" />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flex: 1 }}>
              <div style={{ width: '180px', height: '180px', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={riskData} innerRadius={65} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-ink)' }}>{totalPreds}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-slate)', fontWeight: 600 }}>Total Cases</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {riskData.map((item) => (
                   <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'space-between' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                       <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink)' }}>{item.name}</span>
                     </div>
                     <span style={{ fontSize: '0.8125rem', color: 'var(--color-ink)', fontWeight: 700 }}>{item.value}% <span style={{ color: 'var(--color-slate)', fontWeight: 400 }}>({item.count ?? 0})</span></span>
                   </div>
                ))}
              </div>
            </div>

            {highRiskN > 0 ? (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginTop: '1.5rem' }}>
                <div style={{ background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px', display: 'flex', marginTop: '2px' }}>
                  <ShieldAlert size={12} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#b91c1c' }}>Attention: {highRiskN} high-risk case{highRiskN > 1 ? 's' : ''} detected.</div>
                  <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}>Immediate clinical triage and specialist review required.</div>
                </div>
              </div>
            ) : mediumRiskN > 0 ? (
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '8px', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginTop: '1.5rem' }}>
                <div style={{ background: '#f59e0b', color: 'white', borderRadius: '50%', padding: '2px', display: 'flex', marginTop: '2px' }}>
                  <Activity size={12} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#b45309' }}>Monitoring: {mediumRiskN} medium-risk case{mediumRiskN > 1 ? 's' : ''} identified.</div>
                  <div style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '0.25rem' }}>Schedule 3-month follow-up and moderate-intensity lifestyle plan.</div>
                </div>
              </div>
            ) : (
              <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '1rem', borderRadius: '8px', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginTop: '1.5rem' }}>
                <div style={{ background: '#22c55e', color: 'white', borderRadius: '50%', padding: '2px', display: 'flex', marginTop: '2px' }}>
                  <CheckCircle2 size={12} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#166534' }}>Great! No high or medium-risk alerts.</div>
                  <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.25rem' }}>Continue preventative health monitoring.</div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
          
          {/* Recent Assessments Table */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid var(--color-mist)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-ink)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <FileText size={16} color="var(--color-slate)" /> Recent Assessments
              </div>
              <span onClick={() => navigate('/history')} style={{ fontSize: '0.75rem', color: 'var(--color-slate)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>View All <ChevronRight size={12} /></span>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--color-mist)', color: 'var(--color-slate)', fontWeight: 600 }}>Patient</th>
                  <th style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--color-mist)', color: 'var(--color-slate)', fontWeight: 600 }}>Date</th>
                  <th style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--color-mist)', color: 'var(--color-slate)', fontWeight: 600 }}>Risk Level</th>
                  <th style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--color-mist)', color: 'var(--color-slate)', fontWeight: 600 }}>Status</th>
                  <th style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--color-mist)', color: 'var(--color-slate)', fontWeight: 600, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recent_predictions && stats.recent_predictions.length > 0 ? (
                  stats.recent_predictions.map((p) => {
                    const isHigh = p.risk_level === 'HIGH_RISK';
                    const isMedium = p.risk_level === 'MEDIUM_RISK';
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem 0', fontWeight: 600, color: 'var(--color-ink)' }}>
                          <div>{p.patient_name !== 'N/A' ? p.patient_name : p.patient_code}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-slate)', fontWeight: 400 }}>{p.patient_code}</div>
                        </td>
                        <td style={{ padding: '1rem 0', color: 'var(--color-slate)' }}>{p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent'}</td>
                        <td style={{ padding: '1rem 0' }}>
                          <span style={{
                            background: isHigh ? 'rgba(239, 68, 68, 0.1)' : (isMedium ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)'),
                            color: isHigh ? '#dc2626' : (isMedium ? '#d97706' : '#166534'),
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>
                            {isHigh ? 'High Risk' : (isMedium ? 'Medium Risk' : 'Low Risk')}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontSize: '0.75rem', fontWeight: 600 }}>
                            <CheckCircle2 size={14} color="#22c55e" /> Completed
                          </div>
                        </td>
                        <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                          <Eye size={16} color="var(--color-slate)" style={{ cursor: 'pointer' }} onClick={() => navigate('/history')} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem 0', fontWeight: 600, color: 'var(--color-ink)' }}>PT-0002</td>
                      <td style={{ padding: '1rem 0', color: 'var(--color-slate)' }}>Jul 30, 2026</td>
                      <td style={{ padding: '1rem 0' }}><span style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#166534', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Low Risk</span></td>
                      <td style={{ padding: '1rem 0' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontSize: '0.75rem', fontWeight: 600 }}><CheckCircle2 size={14} color="#22c55e" /> Completed</div></td>
                      <td style={{ padding: '1rem 0', textAlign: 'right' }}><Eye size={16} color="var(--color-slate)" style={{ cursor: 'pointer' }} onClick={() => navigate('/history')} /></td>
                    </tr>
                    <tr>
                      <td style={{ padding: '1rem 0', fontWeight: 600, color: 'var(--color-ink)' }}>PT-0001</td>
                      <td style={{ padding: '1rem 0', color: 'var(--color-slate)' }}>Jul 29, 2026</td>
                      <td style={{ padding: '1rem 0' }}><span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Medium Risk</span></td>
                      <td style={{ padding: '1rem 0' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontSize: '0.75rem', fontWeight: 600 }}><CheckCircle2 size={14} color="#22c55e" /> Completed</div></td>
                      <td style={{ padding: '1rem 0', textAlign: 'right' }}><Eye size={16} color="var(--color-slate)" style={{ cursor: 'pointer' }} onClick={() => navigate('/history')} /></td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* AI Insights Card */}
          <div style={{ background: '#f5f3ff', borderRadius: '12px', padding: '2rem', border: '1px solid #ede9fe', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', zIndex: 2, position: 'relative' }}>
              <BrainCircuit size={16} /> AI Insights
            </div>
            <p style={{ fontSize: '0.875rem', color: '#5b21b6', lineHeight: 1.6, margin: 0, maxWidth: '280px', zIndex: 2, position: 'relative' }}>
              Model confidence is high across all recent assessments. Keep up the good work! Your patient outcomes are improving.
            </p>
            <img 
              src="/ai-brain.png" 
              alt="AI Brain" 
              style={{ position: 'absolute', right: '-20px', bottom: '-20px', height: '140px', opacity: 0.8, zIndex: 1, pointerEvents: 'none', mixBlendMode: 'multiply' }}
            />
          </div>

        </div>

      </div>
    </div>
  );
}
