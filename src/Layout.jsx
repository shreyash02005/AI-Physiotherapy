// ============================================================
// VIZO — Layout with Tab Navigation
// ============================================================
import React from 'react';
import { LayoutDashboard, Dumbbell, Clock, Settings } from 'lucide-react';
import DashboardTab from './DashboardTab.jsx';
import ExercisesTab from './ExercisesTab.jsx';
import HistoryTab from './HistoryTab.jsx';
import SettingsTab from './SettingsTab.jsx';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'exercises', label: 'Exercises', icon: Dumbbell },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Layout({ state, dispatch }) {
  const activeTab = state.tab || 'dashboard';

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab state={state} dispatch={dispatch} />;
      case 'exercises':
        return <ExercisesTab state={state} dispatch={dispatch} />;
      case 'history':
        return <HistoryTab state={state} dispatch={dispatch} />;
      case 'settings':
        return <SettingsTab state={state} dispatch={dispatch} />;
      default:
        return <DashboardTab state={state} dispatch={dispatch} />;
    }
  };

  return (
    <div className="antialiased" style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Fixed Top Navigation */}
      <header className="navbar">
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', height: '64px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '0.5rem', background: 'linear-gradient(135deg, #10b981, #0d9668)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Dumbbell size={18} color="#fff" />
            </div>
            <span className="text-gradient font-headline" style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              VIZO
            </span>
          </div>

          {/* Desktop Tab Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => dispatch({ type: 'SET_TAB', payload: tab.id })}
                  className={`nav-tab ${isActive ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Tab Content — 64px top padding to clear fixed navbar */}
      <main style={{ paddingTop: '64px', minHeight: '100vh' }}>
        {renderTab()}
      </main>

      {/* Background Ambient Glows */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '50%', background: 'rgba(16, 185, 129, 0.04)', borderRadius: '50%', filter: 'blur(120px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: 'rgba(20, 184, 166, 0.04)', borderRadius: '50%', filter: 'blur(120px)' }} />
      </div>
    </div>
  );
}
