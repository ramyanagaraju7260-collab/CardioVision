import { useNavigate, Link } from 'react-router-dom';
import { 
  HeartPulse, Home, FileText, Users, TrendingUp, ShieldAlert, Bell, 
  ArrowRight, ShieldCheck, Eye, BrainCircuit, PlayCircle, Lock, User, Activity
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      
      {/* LANDING PAGE NAV BAR */}
      <nav style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '1rem 2rem', background: 'white', borderBottom: '1px solid var(--color-mist)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        {/* LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ color: 'var(--color-mint-dark)' }}>
            <HeartPulse size={32} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-ink)', lineHeight: 1 }}>CardioVision <span style={{ fontWeight: 400 }}>Clinical</span></span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-slate)', fontWeight: 600 }}>AI-Powered Cardiovascular Intelligence</span>
          </div>
        </div>

        {/* CENTER NAV LINKS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem', background: 'rgba(34, 197, 94, 0.1)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
            <Home size={16} /> Home
          </Link>
          <Link to="/history" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-ink)', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
            <FileText size={16} /> Assessments
          </Link>
          <Link to="/patients" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-ink)', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
            <Users size={16} /> Patients
          </Link>
          <Link to="/model-insights" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-ink)', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
            <TrendingUp size={16} /> Analytics
          </Link>
          <Link to="/reports" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-ink)', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
            <FileText size={16} /> Reports
          </Link>
          <Link to="/alerts" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-ink)', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
            <Bell size={16} /> Alerts <span style={{ background: '#ef4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700 }}>2</span>
          </Link>
        </div>

        {/* RIGHT ACTION BUTTONS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <a href="#" style={{ color: 'var(--color-slate)', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>For Clinicians</a>
          <div style={{ width: '1px', height: '16px', background: 'var(--color-mist)' }} />
          <a href="#" style={{ color: 'var(--color-slate)', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>Validation</a>
          <button onClick={() => navigate('/dashboard')} style={{ background: '#022c22', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '30px', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: 'pointer' }}>
            Access Portal <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      <main style={{ padding: '0 2rem' }}>
        {/* HERO SECTION */}
        <div style={{ 
          position: 'relative',
          padding: '6rem 2rem 4rem 2rem', 
          maxWidth: '1400px', 
          margin: '0 auto', 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem',
          alignItems: 'center',
          overflow: 'hidden'
        }}>
          {/* Subtle Background Gradient */}
          <div style={{ position: 'absolute', top: 0, left: '50%', right: 0, bottom: 0, background: 'radial-gradient(circle at 70% 40%, rgba(34, 197, 94, 0.15) 0%, transparent 60%)', zIndex: 0 }} />

          {/* Left Text Content */}
          <div style={{ zIndex: 2 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', padding: '0.375rem 1rem', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '2rem' }}>
              ✦ ADVANCED PREDICTIVE ANALYTICS
            </div>
            
            <h1 style={{ fontSize: '3.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
              Transforming Cardiovascular <span style={{ color: '#16a34a' }}>Risk Stratification</span>
            </h1>
            
            <p style={{ fontSize: '1.125rem', color: '#475569', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '540px' }}>
              Traditional risk assessment models rely on late-stage systemic biomarkers. CardioVision introduces a paradigm shift by utilizing the retinal fundus—the non-invasive window to the microvascular system—combined with explainable deep learning to detect subclinical cardiovascular pathology years before acute events occur.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => navigate('/dashboard')} style={{ background: '#16a34a', color: 'white', padding: '1rem 2rem', borderRadius: '30px', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)' }}>
                Launch Clinical Portal <ArrowRight size={18} />
              </button>
              <button style={{ background: 'white', color: '#0f172a', padding: '1rem 2rem', borderRadius: '30px', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                Learn More <PlayCircle size={18} />
              </button>
            </div>
          </div>

          {/* Right Imagery */}
          <div style={{ zIndex: 2, position: 'relative', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
             {/* 3D Heart */}
             <img src="/hero-heart.png" alt="3D Heart" style={{ position: 'absolute', right: '150px', height: '400px', filter: 'drop-shadow(0 20px 40px rgba(22,163,74,0.3)) hue-rotate(-20deg)' }} />
             
             {/* Retinal Fundus Overlay */}
             <div style={{ position: 'absolute', right: '-20px', top: '10%', background: 'white', padding: '1rem', borderRadius: '50%', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
               <img src="/hero-retina.png" alt="Retina Scan" style={{ width: '220px', height: '220px', borderRadius: '50%', objectFit: 'cover' }} />
             </div>

             {/* Floating Info Card */}
             <div style={{ position: 'absolute', right: '0', bottom: '50px', background: 'white', padding: '1rem 1.5rem', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', padding: '0.5rem', borderRadius: '8px' }}>
                 <ShieldCheck size={24} />
               </div>
               <div>
                 <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Early Detection</div>
                 <div style={{ fontSize: '0.875rem', color: '#475569' }}>Better Outcomes</div>
               </div>
             </div>
          </div>
        </div>

        {/* STATS STRIP */}
        <div style={{ maxWidth: '1400px', margin: '0 auto 4rem auto' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={24} color="#16a34a" />
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1, marginBottom: '0.5rem' }}>2,480</div>
                <div style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 500, marginBottom: '0.5rem' }}>Patients Analyzed</div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>↑ 12.5% <span style={{ color: '#64748b', fontWeight: 400 }}>vs last 30 days</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={24} color="#2563eb" />
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1, marginBottom: '0.5rem' }}>1,842</div>
                <div style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 500, marginBottom: '0.5rem' }}>Assessments Completed</div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>↑ 18.3% <span style={{ color: '#64748b', fontWeight: 400 }}>vs last 30 days</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={24} color="#dc2626" />
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1, marginBottom: '0.5rem' }}>112</div>
                <div style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 500, marginBottom: '0.5rem' }}>High-Risk Cases</div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>↓ 8.1% <span style={{ color: '#64748b', fontWeight: 400 }}>vs last 30 days</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={24} color="#9333ea" />
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1, marginBottom: '0.5rem' }}>96.7%</div>
                <div style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 500, marginBottom: '0.5rem' }}>Model Accuracy</div>
                <div style={{ fontSize: '0.75rem', color: '#9333ea', fontWeight: 700 }}>Validated Performance</div>
              </div>
            </div>

          </div>
        </div>

        {/* BENTO GRID SECTIONS */}
        <div style={{ maxWidth: '1400px', margin: '0 auto 4rem auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          
          {/* Why CardioVision */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '2rem' }}>Why CardioVision?</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ color: '#16a34a', background: 'rgba(34, 197, 94, 0.1)', padding: '0.75rem', borderRadius: '10px', height: 'fit-content' }}><HeartPulse size={20} /></div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Early Detection</h4>
                  <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>Identify cardiovascular risk years before clinical symptoms appear.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ color: '#16a34a', background: 'rgba(34, 197, 94, 0.1)', padding: '0.75rem', borderRadius: '10px', height: 'fit-content' }}><Eye size={20} /></div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Non-Invasive</h4>
                  <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>Leverage retinal imaging for safe, quick, and painless assessment.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ color: '#16a34a', background: 'rgba(34, 197, 94, 0.1)', padding: '0.75rem', borderRadius: '10px', height: 'fit-content' }}><BrainCircuit size={20} /></div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Explainable AI</h4>
                  <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>Transparent deep learning models with clinical interpretability.</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Capabilities */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '2rem' }}>System Capabilities</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>
                <div style={{ background: '#16a34a', color: 'white', borderRadius: '50%', padding: '2px' }}><ShieldCheck size={14} /></div> Retinal Microvascular Analysis
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>
                <div style={{ background: '#16a34a', color: 'white', borderRadius: '50%', padding: '2px' }}><ShieldCheck size={14} /></div> Deep Learning Risk Prediction
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>
                <div style={{ background: '#16a34a', color: 'white', borderRadius: '50%', padding: '2px' }}><ShieldCheck size={14} /></div> Risk Stratification & Scoring
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>
                <div style={{ background: '#16a34a', color: 'white', borderRadius: '50%', padding: '2px' }}><ShieldCheck size={14} /></div> Longitudinal Patient Monitoring
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>
                <div style={{ background: '#16a34a', color: 'white', borderRadius: '50%', padding: '2px' }}><ShieldCheck size={14} /></div> Clinical Decision Support
              </div>
            </div>
            
            {/* Embedded Monitor Graphic */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', height: '120px', background: 'white', borderRadius: '8px', border: '4px solid #334155', borderBottomWidth: '12px', position: 'relative' }}>
                <div style={{ position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)', width: '30px', height: '15px', background: '#e2e8f0' }} />
                <div style={{ position: 'absolute', bottom: '-24px', left: '50%', transform: 'translateX(-50%)', width: '60px', height: '4px', background: '#cbd5e1', borderRadius: '2px' }} />
                {/* Abstract UI lines inside monitor */}
                <div style={{ padding: '0.5rem', display: 'grid', gridTemplateRows: '1fr 1fr', gap: '0.25rem', height: '100%' }}>
                  <div style={{ background: '#f1f5f9', borderRadius: '4px' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                    <div style={{ background: '#f1f5f9', borderRadius: '4px' }} />
                    <div style={{ background: '#f1f5f9', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trusted & Validated */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '2rem' }}>Trusted & Validated</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ color: '#16a34a', background: 'rgba(34, 197, 94, 0.1)', padding: '0.75rem', borderRadius: '10px', height: 'fit-content' }}><ShieldCheck size={20} /></div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Clinically Validated</h4>
                  <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>Models validated on diverse multi-center datasets.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ color: '#16a34a', background: 'rgba(34, 197, 94, 0.1)', padding: '0.75rem', borderRadius: '10px', height: 'fit-content' }}><Lock size={20} /></div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Secure & Compliant</h4>
                  <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>HIPAA compliant with enterprise-grade data security.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ color: '#16a34a', background: 'rgba(34, 197, 94, 0.1)', padding: '0.75rem', borderRadius: '10px', height: 'fit-content' }}><User size={20} /></div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Built for Clinicians</h4>
                  <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>Designed by clinicians, for seamless clinical workflows.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
        
        {/* FOOTER BANNER */}
        <div style={{ maxWidth: '1400px', margin: '0 auto 2rem auto', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '16px', padding: '1.5rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#16a34a', fontWeight: 600, fontSize: '0.875rem' }}>
            <Users size={20} /> Empowering clinicians with AI-driven insights for a healthier tomorrow.
          </div>
          <a href="#" style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Request a Demo <ArrowRight size={16} />
          </a>
        </div>

      </main>
    </div>
  );
}
