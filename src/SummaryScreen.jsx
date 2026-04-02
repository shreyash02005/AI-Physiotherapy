// ============================================================
// Session Summary Screen (Stitch Design)
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
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#c0c1ff'];
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
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
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

  return (
    <div className="min-h-screen pb-24">
      {showConfetti && <Confetti />}

      {/* Top Nav */}
      <header className="bg-surface/80 backdrop-blur-xl fixed top-0 w-full z-40 flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => dispatch({ type: 'RESET' })} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500 tracking-tight">
            PhysioCopilot
          </span>
        </div>
      </header>

      <main className="pt-24 px-4 md:px-12 max-w-7xl mx-auto bg-confetti min-h-screen">
        {/* Hero: Grade Badge */}
        <section className="flex flex-col items-center text-center mb-16 pt-8 animate-fade-in-up">
          <div className="mb-6 relative">
            <div className="absolute -inset-8 bg-emerald-500/20 blur-3xl rounded-full" />
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${grade.color} flex items-center justify-center border-4 border-white/20 shadow-[0_0_40px_rgba(16,185,129,0.3)]`}>
              <span className="text-5xl font-black text-white italic tracking-tighter">{grade.letter}</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4">Session Complete!</h1>
          <p className="text-on-surface-variant text-lg max-w-lg mx-auto">
            {overallAvg >= 85
              ? `Outstanding consistency. You maintained peak form alignment throughout ${overallAvg}% of your movements today.`
              : overallAvg >= 70
              ? `Good work! Your average form score was ${overallAvg}%. Keep focusing on technique.`
              : `Session recorded with ${overallAvg}% average form. Focus on controlled movements next time.`}
          </p>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { icon: Dumbbell, value: totalReps, label: 'Total Reps', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { icon: Target, value: `${overallAvg}%`, label: 'Avg Form Score', color: 'text-violet-400', bg: 'bg-violet-500/10' },
            { icon: Flame, value: bestStreak, label: 'Best Streak', color: 'text-orange-400', bg: 'bg-orange-500/10' },
            { icon: CheckCircle2, value: `${setHistory.length}/${state.customSets}`, label: 'Sets Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          ].map(({ icon: Icon, value, label, color, bg }, i) => (
            <div key={i} className="p-6 rounded-3xl backdrop-blur-xl bg-white/5 glass-inner-border border border-white/5 flex flex-col items-center text-center animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center ${color} mb-4`}>
                <Icon size={22} />
              </div>
              <span className="text-3xl font-black text-white">{value}</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">{label}</span>
            </div>
          ))}
        </section>

        {/* Compensation + Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Compensation List */}
          <div className="lg:col-span-5 rounded-3xl p-8 border border-white/5 bg-white/5">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <AlertTriangle size={20} className="text-tertiary" />
              Compensation Summary
            </h3>
            {compensationFreq.length === 0 ? (
              <p className="text-slate-500 text-sm">No compensations detected — perfect form! 🎉</p>
            ) : (
              <div className="space-y-8">
                {compensationFreq.map((comp, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-on-surface font-semibold">{comp.name}</span>
                      <span className="text-tertiary-fixed-dim font-bold">{comp.count} times</span>
                    </div>
                    <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-tertiary-container to-tertiary rounded-full shadow-[0_0_12px_rgba(247,81,161,0.4)]"
                        style={{ width: `${(comp.count / maxCompCount) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{comp.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Charts */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            {/* Line Chart */}
            <div className="rounded-3xl p-6 border border-white/5 bg-white/5 flex-1">
              <h4 className="font-bold text-slate-300 mb-6">Form Score Per Rep</h4>
              {repChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={repChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333348" />
                    <XAxis dataKey="rep" stroke="#908fa0" fontSize={10} />
                    <YAxis domain={[0, 100]} stroke="#908fa0" fontSize={10} />
                    <Tooltip contentStyle={{ background: '#1e1e32', border: '1px solid #464554', borderRadius: '8px', color: '#e2e0fc' }} />
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                    <Line type="monotone" dataKey="score" stroke="url(#lineGrad)" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 text-sm text-center py-8">No data available</p>
              )}
            </div>

            {/* Bar Chart */}
            <div className="rounded-3xl p-6 border border-white/5 bg-white/5 flex-1">
              <h4 className="font-bold text-slate-300 mb-6">Average Score Per Set</h4>
              {setChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={setChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333348" />
                    <XAxis dataKey="set" stroke="#908fa0" fontSize={10} />
                    <YAxis domain={[0, 100]} stroke="#908fa0" fontSize={10} />
                    <Tooltip contentStyle={{ background: '#1e1e32', border: '1px solid #464554', borderRadius: '8px', color: '#e2e0fc' }} />
                    <Bar dataKey="avg" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 text-sm text-center py-8">No data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Session History (if available) */}
        {historyData.length > 1 && (
          <div className="rounded-3xl p-6 border border-white/5 bg-white/5 mb-12">
            <h4 className="font-bold text-slate-300 mb-6">Session Progress Over Time</h4>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333348" />
                <XAxis dataKey="session" stroke="#908fa0" fontSize={10} />
                <YAxis domain={[0, 100]} stroke="#908fa0" fontSize={10} />
                <Tooltip contentStyle={{ background: '#1e1e32', border: '1px solid #464554', borderRadius: '8px', color: '#e2e0fc' }} />
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fill="url(#areaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* New Session Button */}
        <div className="pb-12">
          <button
            onClick={() => dispatch({ type: 'RESET' })}
            className="w-full md:w-auto md:min-w-[320px] mx-auto block py-5 px-8 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-black text-lg shadow-[0_20px_50px_rgba(99,102,241,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <PlusCircle size={22} />
            New Session
          </button>
        </div>
      </main>
    </div>
  );
}
