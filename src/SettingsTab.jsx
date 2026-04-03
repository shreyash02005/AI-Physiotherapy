// ============================================================
// VIZO — Settings Tab
// ============================================================
import React, { useState } from 'react';
import { User, Dumbbell, Volume2, Camera, Accessibility, Database, Save, RotateCcw, Trash2, Download, Check } from 'lucide-react';
import { DEFAULT_SETTINGS } from './constants.js';

function Toggle({ value, onChange }) {
  return (
    <button className={`toggle-switch ${value ? 'on' : 'off'}`} onClick={onChange}>
      <div className="toggle-knob" />
    </button>
  );
}

function SettingsSection({ icon: Icon, title, children }) {
  return (
    <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Icon size={20} color="#4edea3" />
        <h2 style={{ fontWeight: 700, color: 'var(--gb-text)' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function SettingsTab({ state, dispatch }) {
  const settings = state.settings || DEFAULT_SETTINGS;
  const [local, setLocal] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  const update = (key, value) => { setLocal(p => ({ ...p, [key]: value })); setSaved(false); };

  const handleSave = () => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: local });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => { setLocal({ ...DEFAULT_SETTINGS }); dispatch({ type: 'UPDATE_SETTINGS', payload: DEFAULT_SETTINGS }); };

  const handleClearHistory = () => {
    if (window.confirm('Clear all session history? This cannot be undone.')) dispatch({ type: 'CLEAR_HISTORY' });
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ settings: local, sessionHistory: state.sessionHistory, exportDate: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `vizo-${new Date().toISOString().split('T')[0]}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '2rem 2.5rem 5rem', maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="font-headline" style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--gb-text)', marginBottom: '0.5rem' }}>Settings</h1>
          <p style={{ color: 'var(--gb-text-dim)' }}>Customize your therapy experience.</p>
        </div>
        <button className={saved ? '' : 'btn-gradient'} onClick={handleSave}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
            ...(saved ? { background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)' } : {}),
          }}>
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? 'Saved!' : 'Save'}
        </button>
      </section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Profile */}
        <SettingsSection icon={User} title="Profile">
          <label style={{ fontSize: '0.875rem', color: 'var(--gb-text-dim)', display: 'block', marginBottom: '0.5rem' }}>Display Name</label>
          <input type="text" value={local.userName} onChange={(e) => update('userName', e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'var(--gb-surface-container)', border: '1px solid var(--gb-outline-dim)', color: 'var(--gb-text)', fontSize: '0.875rem', outline: 'none' }} />
          <p style={{ fontSize: '0.7rem', color: 'var(--gb-text-muted)', marginTop: '0.5rem' }}>Shown on the dashboard greeting.</p>
        </SettingsSection>

        {/* Workout Defaults */}
        <SettingsSection icon={Dumbbell} title="Workout Defaults">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[
              { label: 'Default Repetitions', key: 'defaultReps', min: 3, max: 30, suffix: '' },
              { label: 'Default Sets', key: 'defaultSets', min: 1, max: 10, suffix: '' },
              { label: 'Rest Duration (seconds)', key: 'restDuration', min: 10, max: 120, suffix: 's' },
            ].map(({ label, key, min, max, suffix }) => (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--gb-text-dim)' }}>{label}</label>
                  <span style={{ color: '#4edea3', fontWeight: 700 }}>{local[key]}{suffix}</span>
                </div>
                <input type="range" min={min} max={max} value={local[key]} onChange={(e) => update(key, parseInt(e.target.value))} />
              </div>
            ))}
          </div>
        </SettingsSection>

        {/* Audio */}
        <SettingsSection icon={Volume2} title="Audio Coach">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--gb-text)' }}>AI Voice Coach</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--gb-text-muted)', marginTop: '0.125rem' }}>Spoken cues during exercises</p>
              </div>
              <Toggle value={local.audioEnabled} onChange={() => update('audioEnabled', !local.audioEnabled)} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--gb-text-dim)' }}>Volume</label>
                <span style={{ color: '#4edea3', fontWeight: 700 }}>{Math.round(local.audioVolume * 100)}%</span>
              </div>
              <input type="range" min="0" max="100" value={Math.round(local.audioVolume * 100)} onChange={(e) => update('audioVolume', parseInt(e.target.value) / 100)} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--gb-text-dim)' }}>Speech Speed</label>
                <span style={{ color: '#4edea3', fontWeight: 700 }}>{local.audioSpeed}x</span>
              </div>
              <input type="range" min="5" max="20" value={Math.round(local.audioSpeed * 10)} onChange={(e) => update('audioSpeed', parseInt(e.target.value) / 10)} />
            </div>
          </div>
        </SettingsSection>

        {/* Camera */}
        <SettingsSection icon={Camera} title="Camera">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--gb-text-dim)', display: 'block', marginBottom: '0.5rem' }}>Preferred Resolution</label>
              <select value={local.cameraResolution} onChange={(e) => update('cameraResolution', e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.875rem', outline: 'none' }}>
                <option value="640x480">640 × 480 (SD)</option>
                <option value="1280x720">1280 × 720 (HD)</option>
                <option value="1920x1080">1920 × 1080 (Full HD)</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--gb-text)' }}>Front Camera (Selfie)</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--gb-text-muted)', marginTop: '0.125rem' }}>Toggle to use rear camera</p>
              </div>
              <Toggle value={local.cameraFacing === 'user'} onChange={() => update('cameraFacing', local.cameraFacing === 'user' ? 'environment' : 'user')} />
            </div>
          </div>
        </SettingsSection>

        {/* Accessibility */}
        <SettingsSection icon={Accessibility} title="Accessibility">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'High Contrast Mode', desc: 'Increase contrast for better visibility', key: 'highContrast' },
              { label: 'Larger Text', desc: 'Increase base font size', key: 'largerText' },
            ].map(({ label, desc, key }) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gb-text)' }}>{label}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--gb-text-muted)', marginTop: '0.125rem' }}>{desc}</p>
                </div>
                <Toggle value={local[key]} onChange={() => update(key, !local[key])} />
              </div>
            ))}
          </div>
        </SettingsSection>

        {/* Data Management */}
        <SettingsSection icon={Database} title="Data Management">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'Export Data', desc: 'Download all sessions as JSON', action: handleExport, btnText: 'Export', btnIcon: Download, style: { background: 'transparent', border: '1px solid rgba(78,222,163,0.3)', color: '#4edea3' } },
              { label: 'Reset Settings', desc: 'Restore default values', action: handleReset, btnText: 'Reset', btnIcon: RotateCcw, style: { background: 'transparent', border: '1px solid var(--gb-outline-dim)', color: 'var(--gb-text-dim)' } },
              { label: 'Clear History', desc: `${state.sessionHistory.length} sessions stored`, action: handleClearHistory, btnText: 'Clear All', btnIcon: Trash2, style: { background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.3)', color: '#fb7185' } },
            ].map(({ label, desc, action, btnText, btnIcon: BtnIcon, style: btnStyle }, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '0.75rem', background: 'rgba(15, 31, 24, 0.5)' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gb-text)' }}>{label}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--gb-text-muted)', marginTop: '0.125rem' }}>{desc}</p>
                </div>
                <button onClick={action} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', ...btnStyle }}>
                  <BtnIcon size={14} /> {btnText}
                </button>
              </div>
            ))}
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
