import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, History, BrainCircuit } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/patients', icon: Users, label: 'Patients' },
  { to: '/assessment/new', icon: Activity, label: 'Assess' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/model-insights', icon: BrainCircuit, label: 'Model' },
];

export default function FloatingDock() {
  return (
    <div className="floating-dock-container">
      <nav className="floating-dock">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `dock-item ${isActive ? 'active' : ''}`}
          >
            <div className="dock-icon-wrapper">
              <item.icon size={22} strokeWidth={2} />
            </div>
            <div className="dock-tooltip">{item.label}</div>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
