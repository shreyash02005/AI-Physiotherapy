// ============================================================
// VIZO — Session State Reducer
// ============================================================

import { INITIAL_STATE, DEFAULT_SETTINGS } from './constants.js';

// Persist to localStorage
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable or full
  }
}

export function sessionReducer(state, action) {
  switch (action.type) {
    case 'SET_TAB':
      return {
        ...state,
        tab: action.payload,
      };

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
        restTime: state.settings?.restDuration || 30,
      };
    }

    case 'START_REST':
      return {
        ...state,
        screen: 'rest',
        restTime: state.settings?.restDuration || 30,
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

    case 'UPDATE_SETTINGS': {
      const newSettings = { ...state.settings, ...action.payload };
      saveToStorage('gb_settings', newSettings);
      return {
        ...state,
        settings: newSettings,
        customReps: action.payload.defaultReps ?? state.customReps,
        customSets: action.payload.defaultSets ?? state.customSets,
      };
    }

    case 'RESET': {
      const sessionEntry = {
        date: new Date().toISOString(),
        exercise: state.selectedExercise?.name,
        exerciseId: state.selectedExercise?.id,
        setHistory: state.setHistory,
        totalReps: state.setHistory.reduce((sum, s) => sum + s.repScores.length, 0),
        avgScore: state.setHistory.length > 0
          ? Math.round(
              state.setHistory.reduce((a, s) => a + s.avgScore, 0) /
                state.setHistory.length
            )
          : 0,
        compensationCount: state.compensationLog.length,
        setsCompleted: state.setHistory.length,
        targetSets: state.customSets,
      };

      const newSessionHistory = state.setHistory.length > 0
        ? [...state.sessionHistory, sessionEntry]
        : state.sessionHistory;

      // Persist session history
      saveToStorage('gb_sessionHistory', newSessionHistory);

      return {
        ...INITIAL_STATE,
        sessionHistory: newSessionHistory,
        bestStreak: state.bestStreak,
        bestAvgScore: state.bestAvgScore,
        settings: state.settings,
        tab: state.tab,
      };
    }

    case 'CLEAR_HISTORY': {
      saveToStorage('gb_sessionHistory', []);
      return {
        ...state,
        sessionHistory: [],
      };
    }

    default:
      return state;
  }
}
