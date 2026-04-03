// ============================================================
// VIZO — Dashboard Tab
// ============================================================
import React, { useMemo } from 'react';
import {
  Dumbbell, Activity, ArrowUp, PersonStanding, Move, Footprints,
  Target, Flame, Zap, Clock,
} from 'lucide-react';
import { EXERCISES } from './constants.js';
import { getGrade, formatDate } from './utils.js';

const ICON_MAP = { Dumbbell, Activity, ArrowUp, PersonStanding, Move, Footprints };

export default function DashboardTab({ state, dispatch }) {
  const { sessionHistory, settings, customReps, customSets } = state;
  const userName = settings?.userName || 'User';

  const stats = useMemo(() => {
    const totalSessions = sessionHistory.length;
    const avgForm = totalSessions > 0
      ? Math.round(sessionHistory.reduce((s, h) => s + (h.avgScore || 0), 0) / totalSessions)
      : 0;
    let currentStreak = 0;
    if (totalSessions > 0) {
      const sorted = [...sessionHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
      const today = new Date(); today.setHours(0, 0, 0, 0);
      let checkDate = new Date(today);
      for (const sess of sorted) {
        const sessDate = new Date(sess.date); sessDate.setHours(0, 0, 0, 0);
        const diff = Math.floor((checkDate - sessDate) / (1000 * 60 * 60 * 24));
        if (diff <= 1) { currentStreak++; checkDate = sessDate; } else break;
      }
    }
    const totalExercises = sessionHistory.reduce((s, h) => s + (h.totalReps || 0), 0);
    return { totalSessions, avgForm, currentStreak, totalExercises };
  }, [sessionHistory]);

  const improvement = useMemo(() => {
    if (sessionHistory.length < 2) return null;
    const recent = sessionHistory.slice(-5);
    const older = sessionHistory.slice(0, Math.max(1, sessionHistory.length - 5));
    const recentAvg = recent.reduce((s, h) => s + h.avgScore, 0) / recent.length;
    const olderAvg = older.reduce((s, h) => s + h.avgScore, 0) / older.length;
    return Math.round(recentAvg - olderAvg);
  }, [sessionHistory]);

  const recentSessions = useMemo(() => [...sessionHistory].reverse().slice(0, 5), [sessionHistory]);

  const startExercise = (exercise) => {
    dispatch({ type: 'SELECT_EXERCISE', payload: exercise });
    dispatch({ type: 'START_SESSION' });
  };

  const statCards = [
    { icon: Dumbbell, label: 'GLOBAL TOTAL', sublabel: 'Total Sessions', value: stats.totalSessions, iconColor: '#34d399', iconBg: 'rgba(16, 185, 129, 0.1)' },
    { icon: Target, label: 'PRECISION', sublabel: 'Avg Form Score', value: `${stats.avgForm}%`, iconColor: '#2dd4bf', iconBg: 'rgba(20, 184, 166, 0.1)' },
    { icon: Zap, label: 'CONSISTENCY', sublabel: 'Current Streak', value: `${stats.currentStreak} Days`, iconColor: '#fbbf24', iconBg: 'rgba(245, 158, 11, 0.1)' },
    { icon: Activity, label: 'VOLUME', sublabel: 'Exercises Completed', value: stats.totalExercises, iconColor: '#22d3ee', iconBg: 'rgba(6, 182, 212, 0.1)' },
  ];

  return (
    <div style={{ padding: '2rem 2.5rem 5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Hero Section */}
      <section className="glass-card" style={{ padding: '3rem', marginBottom: '2.5rem', position: 'relative', overflow: 'hidden', borderRadius: '1.5rem' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '50%', height: '150%', background: 'rgba(16, 185, 129, 0.06)', borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4edea3', animation: 'pulse-glow 2s infinite' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#4edea3' }}>
              AI Personal Therapy Live
            </span>
          </div>
          <h1 className="font-headline" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--gb-text)', marginBottom: '0.75rem', lineHeight: 1.1 }}>
            Welcome back, <span className="text-gradient">{userName}</span>
          </h1>
          <p style={{ color: 'var(--gb-text-dim)', fontSize: '1rem', maxWidth: '540px' }}>
            {improvement !== null && improvement > 0 ? `Your form accuracy improved by ${improvement}% recently. ` : ''}
            Ready to start your daily recovery routine?
          </p>
        </div>
      </section>

      {/* Stats Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
        {statCards.map(({ icon: Icon, label, sublabel, value, iconColor, iconBg }, i) => (
          <div key={i} className="stat-card stat-card-shimmer animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '0.75rem', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={iconColor} />
              </div>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--gb-text-muted)' }}>{label}</span>
            </div>
            <p className="font-headline" style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--gb-text)', lineHeight: 1, marginBottom: '0.25rem' }}>{value}</p>
            <span style={{ fontSize: '0.75rem', color: 'var(--gb-text-dim)' }}>{sublabel}</span>
          </div>
        ))}
      </section>

      {/* Quick Start + Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
        {/* Quick Start */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 className="section-title">Quick Start Session</h2>
            <button onClick={() => dispatch({ type: 'SET_TAB', payload: 'exercises' })} style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4edea3', background: 'none', border: 'none', cursor: 'pointer' }}>
              View Library →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {EXERCISES.map((ex) => {
              const IconComp = ICON_MAP[ex.icon] || Activity;
              return (
                <div key={ex.id} className="exercise-card">
                  <div style={{ marginBottom: '0.75rem' }}>
                    <IconComp size={22} color="var(--gb-text-dim)" />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gb-text)', marginBottom: '0.25rem' }}>{ex.name}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gb-text-muted)', marginBottom: '1rem' }}>
                    {customSets} Sets | {customReps} Reps
                  </p>
                  <button className="btn-start" onClick={() => startExercise(ex)}>Start</button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>Recent Activity</h2>
          <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '1rem' }}>
            {recentSessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <Clock size={32} color="var(--gb-text-muted)" style={{ margin: '0 auto 0.75rem' }} />
                <p style={{ color: 'var(--gb-text-dim)', fontSize: '0.875rem' }}>No sessions yet.</p>
                <p style={{ color: 'var(--gb-text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>Start your first exercise to see activity here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {recentSessions.map((sess, i) => {
                  const grade = getGrade(sess.avgScore || 0);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '0.75rem', transition: 'background 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4edea3' }} />
                        <div>
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gb-text)' }}>{sess.exercise}</p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--gb-text-muted)' }}>{formatDate(sess.date)} • {sess.totalReps || 0} Reps</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#4edea3' }}>{sess.avgScore || 0}%</span>
                        <p style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gb-text-muted)' }}>Formscore</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* Bio-Tip */}
          <div className="glass-card" style={{ padding: '1.25rem', marginTop: '1rem', borderRadius: '1rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--gb-text)', marginBottom: '0.5rem' }}>Daily Bio-Tip</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--gb-text-dim)', lineHeight: 1.6 }}>
              Increasing your hydration by 500ml today can improve muscle elasticity for your next session.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
