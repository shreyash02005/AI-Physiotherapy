// ============================================================
// VIZO — History Tab
// ============================================================
import React, { useMemo, useState } from 'react';
import { Clock, Calendar, Target, Dumbbell, ChevronDown, ChevronUp, TrendingUp, AlertTriangle, Award } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getGrade, formatDate } from './utils.js';

export default function HistoryTab({ state, dispatch }) {
  const { sessionHistory } = state;
  const [expandedIndex, setExpandedIndex] = useState(null);
  const reversedHistory = useMemo(() => [...sessionHistory].reverse(), [sessionHistory]);

  const progressData = useMemo(() => sessionHistory.map((s, i) => ({ session: i + 1, score: s.avgScore || 0 })), [sessionHistory]);

  const overallStats = useMemo(() => {
    if (sessionHistory.length === 0) return null;
    return {
      totalReps: sessionHistory.reduce((s, h) => s + (h.totalReps || 0), 0),
      avgScore: Math.round(sessionHistory.reduce((s, h) => s + (h.avgScore || 0), 0) / sessionHistory.length),
      bestScore: Math.max(...sessionHistory.map(h => h.avgScore || 0)),
      totalComps: sessionHistory.reduce((s, h) => s + (h.compensationCount || 0), 0),
    };
  }, [sessionHistory]);

  if (sessionHistory.length === 0) {
    return (
      <div style={{ padding: '2rem 2.5rem 5rem', maxWidth: '1440px', margin: '0 auto' }}>
        <section style={{ marginBottom: '2rem' }}>
          <h1 className="font-headline" style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--gb-text)', marginBottom: '0.5rem' }}>Workout History</h1>
          <p style={{ color: 'var(--gb-text-dim)' }}>Track your progress over time.</p>
        </section>
        <div style={{ textAlign: 'center', padding: '6rem 0' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--gb-surface-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Clock size={36} color="var(--gb-text-muted)" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gb-text)', marginBottom: '0.5rem' }}>No sessions recorded yet</h2>
          <p style={{ color: 'var(--gb-text-dim)', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>Complete your first exercise session to start tracking your progress here.</p>
          <button className="btn-gradient" onClick={() => dispatch({ type: 'SET_TAB', payload: 'exercises' })} style={{ padding: '0.75rem 2rem', borderRadius: '0.75rem', fontSize: '0.875rem', cursor: 'pointer' }}>
            Start Your First Session
          </button>
        </div>
      </div>
    );
  }

  const statItems = [
    { icon: Dumbbell, label: 'Total Reps', value: overallStats.totalReps, color: '#34d399' },
    { icon: Target, label: 'Avg Score', value: `${overallStats.avgScore}%`, color: '#2dd4bf' },
    { icon: Award, label: 'Best Score', value: `${overallStats.bestScore}%`, color: '#fbbf24' },
    { icon: AlertTriangle, label: 'Compensations', value: overallStats.totalComps, color: '#fb7185' },
  ];

  return (
    <div style={{ padding: '2rem 2.5rem 5rem', maxWidth: '1440px', margin: '0 auto' }}>
      <section style={{ marginBottom: '2rem' }}>
        <h1 className="font-headline" style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--gb-text)', marginBottom: '0.5rem' }}>Workout History</h1>
        <p style={{ color: 'var(--gb-text-dim)' }}>{sessionHistory.length} session{sessionHistory.length !== 1 ? 's' : ''} recorded</p>
      </section>

      {/* Summary Stats */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
        {statItems.map(({ icon: Icon, label, value, color }, i) => (
          <div key={i} className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderRadius: '1rem' }}>
            <Icon size={20} color={color} />
            <div>
              <p className="font-headline" style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--gb-text)' }}>{value}</p>
              <span style={{ fontSize: '0.7rem', color: 'var(--gb-text-muted)' }}>{label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Progress Chart */}
      {progressData.length > 1 && (
        <section className="glass-card" style={{ padding: '1.5rem', marginBottom: '2.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <TrendingUp size={18} color="#4edea3" />
            <h3 style={{ fontWeight: 700, color: 'var(--gb-text)' }}>Progress Over Time</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3c4a42" />
              <XAxis dataKey="session" stroke="#86948a" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#86948a" fontSize={11} />
              <Tooltip contentStyle={{ background: '#13231c', border: '1px solid #3c4a42', borderRadius: '12px', color: '#d4e7dd' }} />
              <defs><linearGradient id="hGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
              <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} fill="url(#hGrad)" dot={{ fill: '#4edea3', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* Session List */}
      <section>
        <h3 style={{ fontWeight: 700, color: 'var(--gb-text)', marginBottom: '1rem' }}>All Sessions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {reversedHistory.map((sess, i) => {
            const grade = getGrade(sess.avgScore || 0);
            const isExpanded = expandedIndex === i;
            return (
              <div key={i} className="glass-card" style={{ overflow: 'hidden', borderRadius: '1rem' }}>
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `linear-gradient(135deg, ${grade.letter === 'A' ? '#34d399, #2dd4bf' : grade.letter === 'B' ? '#2dd4bf, #22d3ee' : '#fbbf24, #f97316'})`,
                    }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 900, color: '#fff' }}>{grade.letter}</span>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--gb-text)' }}>{sess.exercise || 'Session'}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--gb-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={12} /> {formatDate(sess.date)} • {sess.totalReps || 0} reps • {sess.setsCompleted || 0}/{sess.targetSets || 0} sets
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#4edea3' }}>{sess.avgScore || 0}%</span>
                    {isExpanded ? <ChevronUp size={16} color="var(--gb-text-muted)" /> : <ChevronDown size={16} color="var(--gb-text-muted)" />}
                  </div>
                </button>
                {isExpanded && sess.setHistory && (
                  <div className="animate-fade-in" style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid var(--gb-outline-dim)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1rem' }}>
                      {sess.setHistory.map((set, si) => (
                        <div key={si} style={{ background: 'rgba(15, 31, 24, 0.5)', borderRadius: '0.75rem', padding: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gb-text-muted)' }}>Set {set.setNumber}</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#4edea3' }}>{set.avgScore}%</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                            {set.repScores.map((score, ri) => (
                              <div key={ri} className={score >= 85 ? 'score-bg-good score-good' : score >= 70 ? 'score-bg-ok score-ok' : 'score-bg-bad score-bad'}
                                style={{ width: 28, height: 28, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700 }}>
                                {score}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
