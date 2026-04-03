// ============================================================
// VIZO — Rest Timer Screen
// ============================================================
import React, { useEffect } from 'react';
import { Heart, Wind, Zap, ArrowLeft } from 'lucide-react';
import { getScoreColor } from './utils.js';

export default function RestScreen({ state, dispatch }) {
  const { restTime, currentSet, customSets, setHistory } = state;
  const lastSet = setHistory[setHistory.length - 1];
  const totalRestDuration = state.settings?.restDuration || 30;

  // Countdown timer
  useEffect(() => {
    if (restTime <= 0) {
      dispatch({ type: 'END_REST' });
      return;
    }
    const interval = setInterval(() => {
      dispatch({ type: 'TICK_REST' });
    }, 1000);
    return () => clearInterval(interval);
  }, [restTime, dispatch]);

  const minutes = Math.floor(restTime / 60);
  const seconds = restTime % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const progress = ((totalRestDuration - restTime) / totalRestDuration) * 100;
  const circumference = 2 * Math.PI * 140;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--gb-bg)' }}>
      {/* Top Nav */}
      <header className="navbar">
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', height: '64px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => dispatch({ type: 'RESET' })} style={{ color: 'var(--gb-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <ArrowLeft size={24} />
            </button>
            <span className="text-gradient font-headline" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              VIZO
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--gb-primary)', borderBottom: '2px solid var(--gb-primary)', paddingBottom: '0.25rem' }}>RESTING</span>
          </div>
        </nav>
      </header>

      <main style={{ paddingTop: '64px', minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Background Glow */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div className="timer-glow" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', opacity: 0.6 }} />
        </div>

        <section style={{ maxWidth: '896px', width: '100%', padding: '3rem 1.5rem', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {/* Heading */}
          <div style={{ marginBottom: '3rem' }}>
            <h1 className="font-headline" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, color: 'var(--gb-text)', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
              Rest Period
            </h1>
            <p style={{ color: 'var(--gb-primary)', fontWeight: 600, fontSize: '1.125rem' }}>Set {currentSet} of {customSets} completed!</p>
          </div>

          {/* Timer Circle */}
          <div style={{ position: 'relative', width: '320px', height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4rem' }}>
            <svg style={{ position: 'absolute', width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle
                cx="50%" cy="50%" r="140" fill="transparent"
                stroke="rgba(40, 56, 49, 0.3)" strokeWidth="8"
              />
              <circle
                cx="50%" cy="50%" r="140" fill="transparent"
                stroke="url(#rest-grad)" strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
              <defs>
                <linearGradient id="rest-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#4edea3" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span className="font-headline" style={{ fontSize: '7rem', fontWeight: 900, color: 'var(--gb-text)', lineHeight: 1 }}>
                {timeStr}
              </span>
              <span style={{ color: 'var(--gb-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', fontSize: '0.875rem', marginTop: '0.5rem' }}>Remaining</span>
            </div>
          </div>

          {/* Scorecard */}
          {lastSet && (
            <div className="glass-panel" style={{ width: '100%', maxWidth: '672px', padding: '2rem', borderRadius: '2rem', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--gb-text-muted)' }}>Last Set Scorecard</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gb-primary)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '999px' }}>
                  <Zap size={14} /> AI ANALYZED
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
                {lastSet.repScores.map((score, i) => {
                  const color = getScoreColor(score);
                  // color object has bg, text, border keys (defined in utils.js)
                  // but we need actual hex/rgba for our direct style approach
                  // utils.js colors: good: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' }
                  // Since we can't easily map those to hex in components, I'll rely on the CSS classes defined in index.css
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(3, 17, 11, 0.3)', borderRadius: '1rem' }}>
                      <span style={{ fontSize: '0.625rem', color: 'var(--gb-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Rep {i + 1}</span>
                      <div className={score >= 85 ? 'score-bg-good score-good' : score >= 70 ? 'score-bg-ok score-ok' : 'score-bg-bad score-bad'}
                        style={{ width: '3rem', height: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 700, fontSize: '0.875rem' }}>
                        {score}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Motivational Message */}
          <div style={{ marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gb-text)' }}>
              {lastSet && lastSet.avgScore >= 85
                ? 'Great form! Keep up the intensity 💪'
                : lastSet && lastSet.avgScore >= 70
                ? 'Good effort! Focus on technique 👍'
                : 'Keep pushing! You\'ve got this 🔥'}
            </div>
            <p style={{ color: 'var(--gb-text-muted)', maxWidth: '384px', margin: '0 auto', fontSize: '0.875rem' }}>
              Take deep breaths and focus on muscle recovery for the final push.
            </p>
          </div>

          {/* Skip Rest */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
            <button
              onClick={() => dispatch({ type: 'END_REST' })}
              style={{ padding: '1rem 3rem', background: 'transparent', border: '2px solid rgba(78, 222, 163, 0.4)', borderRadius: '1rem', color: 'var(--gb-primary)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s' }}
            >
              Skip Rest
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', color: 'var(--gb-text-muted)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Heart size={16} color="var(--gb-primary)" />
                <span>Recovery</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wind size={16} color="var(--gb-primary)" />
                <span>Breathe</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
