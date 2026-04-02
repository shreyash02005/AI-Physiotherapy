// ============================================================
// AI Physio Copilot — Session State Reducer
// ============================================================

import { INITIAL_STATE } from './constants.js';

export function sessionReducer(state, action) {
  switch (action.type) {
    case 'SELECT_EXERCISE':
      return {
        ...state,
        selectedExercise: action.payload,
      };

    case 'CUSTOMIZE_SETS_REPS':
      return {
        ...state,
        customReps: action.payload.reps ?? state.customReps,
        customSets: action.payload.sets ?? state.customSets,
      };

    case 'START_SESSION':
      return {
        ...state,
        screen: 'exercise',
        currentSet: 1,
        currentRep: 0,
        repScores: [],
        setHistory: [],
        compensationLog: [],
        streak: 0,
        bestStreak: state.bestStreak,
        bestAvgScore: state.bestAvgScore,
      };

    case 'COUNT_REP': {
      const newRep = state.currentRep + 1;
      const newScores = [...state.repScores, action.payload.score];
      const newStreak = action.payload.score >= 80 ? state.streak + 1 : 0;
      const newBestStreak = Math.max(state.bestStreak, newStreak);
      return {
        ...state,
        currentRep: newRep,
        repScores: newScores,
        streak: newStreak,
        bestStreak: newBestStreak,
      };
    }

    case 'COMPLETE_SET': {
      const avgScore = state.repScores.length > 0
        ? Math.round(state.repScores.reduce((a, b) => a + b, 0) / state.repScores.length)
        : 0;
      const setData = {
        setNumber: state.currentSet,
        repScores: [...state.repScores],
        compensations: state.compensationLog.filter(
          (c) => c.set === state.currentSet
        ),
        avgScore,
      };
      const newHistory = [...state.setHistory, setData];
      const newBestAvg = Math.max(state.bestAvgScore, avgScore);

      // Check if all sets are done
      if (state.currentSet >= state.customSets) {
        return {
          ...state,
          screen: 'summary',
          setHistory: newHistory,
          bestAvgScore: newBestAvg,
          repScores: [],
        };
      }

      return {
        ...state,
        screen: 'rest',
        setHistory: newHistory,
        bestAvgScore: newBestAvg,
        repScores: [],
        restTime: 30,
      };
    }

    case 'START_REST':
      return {
        ...state,
        screen: 'rest',
        restTime: 30,
      };

    case 'TICK_REST':
      return {
        ...state,
        restTime: Math.max(0, state.restTime - 1),
      };

    case 'END_REST':
      return {
        ...state,
        screen: 'exercise',
        currentSet: state.currentSet + 1,
        currentRep: 0,
        repScores: [],
      };

    case 'END_SESSION': {
      const avgScore = state.repScores.length > 0
        ? Math.round(state.repScores.reduce((a, b) => a + b, 0) / state.repScores.length)
        : 0;
      const setData = {
        setNumber: state.currentSet,
        repScores: [...state.repScores],
        compensations: state.compensationLog.filter(
          (c) => c.set === state.currentSet
        ),
        avgScore,
      };
      const newHistory = state.repScores.length > 0
        ? [...state.setHistory, setData]
        : [...state.setHistory];
      return {
        ...state,
        screen: 'summary',
        setHistory: newHistory,
      };
    }

    case 'ADD_COMPENSATION':
      return {
        ...state,
        compensationLog: [
          ...state.compensationLog,
          {
            ...action.payload,
            set: state.currentSet,
            timestamp: Date.now(),
          },
        ],
      };

    case 'TOGGLE_MUTE':
      return {
        ...state,
        isMuted: !state.isMuted,
      };

    case 'SET_CAMERA_ERROR':
      return {
        ...state,
        cameraError: action.payload,
      };

    case 'RESET':
      return {
        ...INITIAL_STATE,
        sessionHistory: [
          ...state.sessionHistory,
          {
            date: new Date().toISOString(),
            exercise: state.selectedExercise?.name,
            setHistory: state.setHistory,
            avgScore: state.setHistory.length > 0
              ? Math.round(
                  state.setHistory.reduce((a, s) => a + s.avgScore, 0) /
                    state.setHistory.length
                )
              : 0,
          },
        ],
        bestStreak: state.bestStreak,
        bestAvgScore: state.bestAvgScore,
      };

    default:
      return state;
  }
}
