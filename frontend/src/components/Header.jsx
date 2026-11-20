import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HeartPulse, 
  Home, 
  Users, 
  FileText, 
  TrendingUp, 
  ShieldAlert, 
  Bell, 
  Search, 
  User,
  Layers 
} from 'lucide-react';

export default function Header() {
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: Home },
    { name: 'Patients', path: '/patients', icon: Users },
    { name: 'Assessments', path: '/history', icon: FileText },
    { name: 'Cohort Screening', path: '/batch', icon: Layers },
    { name: 'Analytics', path: '/model-insights', icon: TrendingUp },
    { name: 'Risk Stratification', path: '/risk', icon: ShieldAlert },
  ];

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 2rem',
      background: 'white',
      borderBottom: '1px solid var(--color-mist)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* LOGO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ color: 'var(--color-mint-dark)' }}>
          <HeartPulse size={32} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-ink)', lineHeight: 1 }}>CardioVision</span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-slate)', fontWeight: 600 }}>AI Intelligence</span>
        </div>
      </div>

      {/* NAV LINKS */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        {navItems.map(item => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link 
              key={item.name}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: isActive ? 'var(--color-mint-dark)' : 'var(--color-slate)',
                fontWeight: isActive ? 600 : 500,
                textDecoration: 'none',
                fontSize: '0.875rem',
                background: isActive ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-full)'
              }}
            >
              <Icon size={16} />
              {item.name}
            </Link>
          );
        })}
        
        {/* Alerts with Badge */}
        <Link to="/alerts" style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-slate)',
          fontWeight: 500, textDecoration: 'none', fontSize: '0.875rem', padding: '0.5rem 1rem'
        }}>
          <Bell size={16} />
          Alerts
          <span style={{ background: '#ef4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700 }}>2</span>
        </Link>
        
        <Link to="/reports" style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-slate)',
          fontWeight: 500, textDecoration: 'none', fontSize: '0.875rem', padding: '0.5rem 1rem'
        }}>
          <FileText size={16} />
          Reports
        </Link>
      </nav>

      {/* RIGHT CONTROLS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} color="var(--color-slate)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search anything..." 
            style={{
              padding: '0.5rem 1rem 0.5rem 2.5rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--color-mist)',
              fontSize: '0.875rem',
              outline: 'none',
              width: '200px'
            }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setProfileOpen(!profileOpen)}
            style={{ 
              width: '36px', height: '36px', borderRadius: '50%', 
              background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-mint-dark)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              border: profileOpen ? '2px solid var(--color-mint-dark)' : 'none'
            }}
          >
            <User size={18} />
          </div>

          {/* PROFILE DROPDOWN */}
          {profileOpen && (
            <div style={{
              position: 'absolute',
              top: '48px',
              right: 0,
              width: '280px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              border: '1px solid var(--color-mist)',
              padding: '1.5rem',
              zIndex: 1000
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-mist)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-mint-dark)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.25rem' }}>
                  SJ
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-ink)' }}>Dr. Sarah Jenkins</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-slate)', fontWeight: 600 }}>Chief Cardiologist</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-slate)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Facility</div>
                <div style={{ fontWeight: 600, color: 'var(--color-ink)', fontSize: '0.875rem' }}>Mount Sinai Cardiology Center</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-slate)' }}>1425 Madison Ave, New York, NY</div>
                
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-slate)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem' }}>System Access</div>
                <div style={{ fontSize: '0.8125rem', color: '#16a34a', fontWeight: 600, background: 'rgba(34, 197, 94, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', width: 'fit-content' }}>
                  Level 4 Clinical Administrator
                </div>
              </div>

              <button 
                onClick={() => setProfileOpen(false)}
                style={{ width: '100%', marginTop: '1.5rem', padding: '0.5rem', background: '#f1f5f9', border: 'none', borderRadius: '6px', color: 'var(--color-slate)', fontWeight: 600, cursor: 'pointer' }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
