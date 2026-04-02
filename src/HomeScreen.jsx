// ============================================================
// Home Screen — Exercise Selector (Stitch Design)
// ============================================================
import React from 'react';
import {
  Dumbbell, Activity, ArrowUp, PersonStanding, Move, Footprints,
  PlayCircle, Sparkles, Radio,
} from 'lucide-react';
import { EXERCISES } from './constants.js';

const ICON_MAP = {
  Dumbbell, Activity, ArrowUp, PersonStanding, Move, Footprints,
};

export default function HomeScreen({ state, dispatch }) {
  const { selectedExercise, customReps, customSets } = state;

  return (
    <div className="antialiased min-h-screen">
      <header className="bg-background/95 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-white/10 shadow-xl flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
            Luminous Physio
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a className="text-indigo-400 font-semibold transition-colors" href="#">Dashboard</a>
          <a className="text-slate-400 hover:text-white transition-colors" href="#">Workouts</a>
          <a className="text-slate-400 hover:text-white transition-colors" href="#">History</a>
          <a className="text-slate-400 hover:text-white transition-colors" href="#">Settings</a>
        </nav>
      </header>

      <main className="mt-28 pt-4 pb-40 px-6 max-w-7xl mx-auto min-h-screen">
        {/* Hero Header */}
        <section className="mb-16 text-center md:text-left">
          <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-gradient mb-4 py-2 leading-tight">
            AI Physio Copilot
          </h1>
          <p className="text-on-surface-variant text-lg md:text-xl font-medium max-w-2xl">
            Your AI-Powered Physical Therapy Assistant
          </p>
        </section>

        <div className="w-full">
          {/* Exercise Selection Grid */}
          <section className="w-full">
            <div className="flex items-center justify-between mb-8 max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold text-on-surface">Select a Routine</h2>
              <span className="text-tertiary flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
                <Radio size={18} className="fill-current" />
                Live Motion Tracking
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {EXERCISES.map((ex) => {
                const IconComp = ICON_MAP[ex.icon] || Activity;

                return (
                  <div
                    key={ex.id}
                    onClick={() => {
                      dispatch({ type: 'SELECT_EXERCISE', payload: ex });
                      dispatch({ type: 'START_SESSION' });
                    }}
                    className="glass-card p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] group hover:-translate-y-1"
                  >
                    <div className="mb-4 flex justify-between items-start">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-surface-container-highest group-hover:bg-indigo-500/20 transition-colors">
                        <IconComp size={32} className="text-on-surface-variant group-hover:text-indigo-400 transition-colors" />
                      </div>
                    </div>
                    <h3 className="text-xl font-extrabold text-on-surface mb-2">{ex.name}</h3>
                    <p className="text-on-surface-variant text-sm mb-6 leading-relaxed flex-1">{ex.description}</p>
                    <div className="flex gap-3">
                      <span className="bg-surface-container-highest px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface border border-white/5 group-hover:border-indigo-500/30">
                        {customReps} reps
                      </span>
                      <span className="bg-surface-container-highest px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface border border-white/5 group-hover:border-indigo-500/30">
                        {customSets} sets
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-pink-500/5 rounded-full blur-[100px]" />
      </div>
    </div>
  );
}
