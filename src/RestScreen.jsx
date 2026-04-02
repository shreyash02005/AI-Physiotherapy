// ============================================================
// Rest Timer Screen (Stitch Design)
// ============================================================
import React, { useEffect } from 'react';
import { Timer, Heart, Wind, Zap, SkipForward, ArrowLeft } from 'lucide-react';
import { getScoreColor } from './utils.js';

export default function RestScreen({ state, dispatch }) {
  const { restTime, currentSet, customSets, setHistory, isMuted } = state;
  const lastSet = setHistory[setHistory.length - 1];

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
  const progress = ((30 - restTime) / 30) * 100;
  const circumference = 2 * Math.PI * 140;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Nav */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-2xl shadow-indigo-500/5">
        <nav className="flex items-center justify-between px-8 h-16 max-w-[1440px] mx-auto w-full">
          <div className="flex items-center gap-4">
            <button onClick={() => dispatch({ type: 'RESET' })} className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </button>
            <span className="text-xl font-bold tracking-tighter bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
              AI Physio Copilot
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 font-medium tracking-tight">
            <span className="text-indigo-400 border-b-2 border-indigo-500 pb-1">Training</span>
          </div>
        </nav>
      </header>

      <main className="pt-16 min-h-screen relative flex items-center justify-center">
        {/* Background Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] timer-glow opacity-60" />
        </div>

        <section className="max-w-4xl w-full px-6 py-12 relative z-10 flex flex-col items-center text-center">
          {/* Heading */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 text-on-surface">Rest Period</h1>
            <p className="text-indigo-400 font-medium text-lg">Set {currentSet} of {customSets} completed!</p>
          </div>

          {/* Timer Circle */}
          <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center mb-16">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                className="text-surface-container-highest/30"
                cx="50%" cy="50%" r="48%" fill="transparent"
                stroke="currentColor" strokeWidth="8"
              />
              <circle
                cx="50%" cy="50%" r="48%" fill="transparent"
                stroke="url(#timer-gradient)" strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
              <defs>
                <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#6366f1' }} />
                  <stop offset="100%" style={{ stopColor: '#8b5cf6' }} />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex flex-col items-center justify-center">
              <span className="text-8xl md:text-[100px] font-black tracking-tighter text-on-surface leading-none">
                {timeStr}
              </span>
              <span className="text-slate-500 font-bold uppercase tracking-[0.3em] text-sm mt-2">Remaining</span>
            </div>
          </div>

          {/* Scorecard */}
          {lastSet && (
            <div className="w-full max-w-2xl glass-panel p-8 rounded-[2rem] mb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Last Set Scorecard</h2>
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
                  <Zap size={14} /> AI ANALYZED
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {lastSet.repScores.map((score, i) => {
                  const color = getScoreColor(score);
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 p-3 bg-surface-container-lowest/50 rounded-2xl">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Rep {i + 1}</span>
                      <div className={`w-12 h-12 flex items-center justify-center rounded-full ${color.bg} ${color.text} font-bold text-sm border ${color.border}`}>
                        {score}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Motivational Message */}
          <div className="mb-12 flex flex-col items-center gap-3">
            <div className="text-2xl font-bold text-on-surface">
              {lastSet && lastSet.avgScore >= 85
                ? 'Great form! Keep up the intensity 💪'
                : lastSet && lastSet.avgScore >= 70
                ? 'Good effort! Focus on technique 👍'
                : 'Keep pushing! You\'ve got this 🔥'}
            </div>
            <p className="text-slate-500 max-w-sm">
              Take deep breaths and focus on muscle recovery for the final push.
            </p>
          </div>

          {/* Skip Rest */}
          <div className="flex flex-col items-center gap-6 w-full">
            <button
              onClick={() => dispatch({ type: 'END_REST' })}
              className="px-12 py-4 border-2 border-indigo-500/50 text-indigo-400 font-bold rounded-2xl hover:bg-indigo-500/10 hover:border-indigo-500 transition-all duration-300 active:scale-95"
            >
              Skip Rest
            </button>
            <div className="flex items-center gap-8 text-slate-500 text-xs font-semibold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Heart size={18} className="text-indigo-400" />
                <span>Recovery Phase</span>
              </div>
              <div className="flex items-center gap-2">
                <Wind size={18} className="text-indigo-400" />
                <span>Breathe Deeply</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
