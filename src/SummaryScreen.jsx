// ============================================================
// VIZO — Session Summary Screen
// ============================================================
import React, { useMemo, useEffect, useState } from 'react';
import {
  Dumbbell, Target, Flame, CheckCircle2, PlusCircle, AlertTriangle, ArrowLeft
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getGrade } from './utils.js';

// Confetti component
function Confetti() {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    const colors = ['#10b981', '#4edea3', '#14b8a6', '#6ffbbe', '#f59e0b', '#9ed2b5'];
    const newPieces = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
      duration: 2 + Math.random() * 2,
    }));
    setPieces(newPieces);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50, overflow: 'hidden' }}>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            position: 'absolute',
            top: '-20px',
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function SummaryScreen({ state, dispatch }) {
  const { setHistory, compensationLog, bestStreak, selectedExercise, sessionHistory } = state;
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Compute stats
  const totalReps = useMemo(() =>
    setHistory.reduce((sum, s) => sum + s.repScores.length, 0), [setHistory]);

  const overallAvg = useMemo(() => {
    const allScores = setHistory.flatMap((s) => s.repScores);
    return allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;
  }, [setHistory]);

  const grade = getGrade(overallAvg);

  // Chart data: form score per rep
  const repChartData = useMemo(() => {
    const data = [];
    let repIndex = 1;
    for (const set of setHistory) {
      for (const score of set.repScores) {
        data.push({ rep: repIndex++, score, name: `Rep ${repIndex - 1}` });
      }
    }
    return data;
  }, [setHistory]);

  // Chart data: avg per set
  const setChartData = useMemo(() =>
    setHistory.map((s, i) => ({ set: `Set ${i + 1}`, avg: s.avgScore })), [setHistory]);

  // Compensation frequency
  const compensationFreq = useMemo(() => {
    const freq = {};
    compensationLog.forEach((c) => {
      if (!freq[c.name]) freq[c.name] = { name: c.name, count: 0, message: c.message };
      freq[c.name].count++;
    });
    return Object.values(freq);
  }, [compensationLog]);

  const maxCompCount = compensationFreq.length > 0 ? Math.max(...compensationFreq.map((c) => c.count)) : 1;

  // Session history chart
  const historyData = useMemo(() =>
    sessionHistory.map((s, i) => ({
      session: i + 1,
      score: s.avgScore,
      name: `Session ${i + 1}`,
    })), [sessionHistory]);

  const chartStyle = {
    background: '#13231c',
    border: '1px solid #3c4a42',
    borderRadius: '12px',
    color: '#d4e7dd',
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '6rem', backgroundColor: 'var(--gb-bg)' }}>
      {showConfetti && <Confetti />}

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
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gb-primary)' }}>
            SESSION COMPLETE
          </div>
        </nav>
      </header>

      <main style={{ paddingTop: '100px', paddingLeft: '1.5rem', paddingRight: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
        {/* Hero: Grade Badge */}
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '4rem', position: 'relative' }}>
          <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-2rem', left: '-2rem', right: '-2rem', bottom: '-2rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', filter: 'blur(40px)' }} />
            <div className="animate-fade-in" style={{ width: '128px', height: '128px', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: grade.letter === 'A' ? 'linear-gradient(135deg, #34d399, #10b981)' : grade.letter === 'B' ? 'linear-gradient(135deg, #2dd4bf, #22d3ee)' : 'linear-gradient(135deg, #fbbf24, #f97316)', boxShadow: '0 0 40px rgba(16, 185, 129, 0.3)', position: 'relative', zIndex: 1 }}>
              <span className="font-headline" style={{ fontSize: '3.5rem', fontWeight: 900, color: '#fff', fontStyle: 'italic', letterSpacing: '-0.05em' }}>{grade.letter}</span>
            </div>
          </div>
          <h1 className="font-headline animate-fade-in-up" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, color: '#fff', marginBottom: '1rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Session <span className="text-gradient">Complete!</span>
          </h1>
          <p className="animate-fade-in-up" style={{ color: 'var(--gb-text-dim)', fontSize: '1.125rem', maxWidth: '512px', margin: '0 auto', animationDelay: '0.1s' }}>
            {overallAvg >= 85
              ? `Outstanding consistency. You maintained peak form alignment throughout ${overallAvg}% of your movements today.`
              : overallAvg >= 70
              ? `Good work! Your average form score was ${overallAvg}%. Keep focusing on technique.`
              : `Session recorded with ${overallAvg}% average form. Focus on controlled movements next time.`}
          </p>
        </section>

        {/* Stats Grid */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '3rem' }}>
          {[
            { icon: Dumbbell, value: totalReps, label: 'Total Reps', color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)' },
            { icon: Target, value: `${overallAvg}%`, label: 'Avg Form Score', color: '#2dd4bf', bg: 'rgba(45, 212, 191, 0.1)' },
            { icon: Flame, value: bestStreak, label: 'Best Streak', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.1)' },
            { icon: CheckCircle2, value: `${setHistory.length}/${state.customSets}`, label: 'Sets Completed', color: '#22d3ee', bg: 'rgba(6, 182, 212, 0.1)' },
          ].map(({ icon: Icon, value, label, color, bg }, i) => (
            <div key={i} className="glass-card animate-fade-in-up" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderRadius: '1.5rem', animationDelay: `${0.2 + i * 0.1}s` }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '1rem', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, marginBottom: '1rem' }}>
                <Icon size={22} />
              </div>
              <span className="font-headline" style={{ fontSize: '1.875rem', fontWeight: 900, color: '#fff' }}>{value}</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--gb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: '0.25rem' }}>{label}</span>
            </div>
          ))}
        </section>

        {/* Compensation + Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
          {/* Compensation List */}
          <div className="glass-card" style={{ gridColumn: 'span 5', padding: '2rem', borderRadius: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} color="#fbbf24" />
              Compensation Summary
            </h3>
            {compensationFreq.length === 0 ? (
              <p style={{ color: 'var(--gb-text-muted)', fontSize: '0.875rem' }}>No compensations detected — perfect form! 🎉</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {compensationFreq.map((comp, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--gb-text)', fontWeight: 600 }}>{comp.name}</span>
                      <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.875rem' }}>{comp.count} times</span>
                    </div>
                    <div style={{ height: '12px', width: '100%', background: 'var(--gb-surface-highest)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{ height: '100%', width: `${(comp.count / maxCompCount) * 100}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: '999px' }}
                      />
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gb-text-dim)', marginTop: '0.5rem' }}>{comp.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Charts */}
          <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Line Chart */}
            <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1.5rem', flex: 1 }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--gb-text-dim)', marginBottom: '1.5rem' }}>Form Score Per Rep</h4>
              {repChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={repChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3c4a42" />
                    <XAxis dataKey="rep" stroke="#86948a" fontSize={10} />
                    <YAxis domain={[0, 100]} stroke="#86948a" fontSize={10} />
                    <Tooltip contentStyle={chartStyle} />
                    <defs>
                      <linearGradient id="lineGradSummary" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#4edea3" /></linearGradient>
                    </defs>
                    <Line type="monotone" dataKey="score" stroke="url(#lineGradSummary)" strokeWidth={3} dot={{ fill: '#4edea3', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: 'var(--gb-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>No data available</p>
              )}
            </div>

            {/* Bar Chart */}
            <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1.5rem', flex: 1 }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--gb-text-dim)', marginBottom: '1.5rem' }}>Average Score Per Set</h4>
              {setChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={setChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3c4a42" />
                    <XAxis dataKey="set" stroke="#86948a" fontSize={10} />
                    <YAxis domain={[0, 100]} stroke="#86948a" fontSize={10} />
                    <Tooltip contentStyle={chartStyle} />
                    <Bar dataKey="avg" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: 'var(--gb-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>No data available</p>
              )}
            </div>
          </div>
        </div>

        {/* New Session Button */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '3rem' }}>
          <button
            onClick={() => dispatch({ type: 'RESET' })}
            className="btn-start"
            style={{ padding: '1rem 4rem', fontSize: '1.125rem', fontWeight: 900, borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', transform: 'scale(1.1)' }}
          >
            <PlusCircle size={22} />
            New Session
          </button>
        </div>
      </main>
    </div>
  );
}
