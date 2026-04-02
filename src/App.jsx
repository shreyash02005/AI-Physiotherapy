// ============================================================
// AI Physio Copilot — Main App Component
// All-in-one AI physical therapy app with MediaPipe pose tracking,
// real-time form scoring, rep counting, compensation detection,
// and audio coaching.
// ============================================================

import React, { useReducer, useRef } from 'react';
import { INITIAL_STATE } from './constants.js';
import { sessionReducer } from './reducer.js';
import HomeScreen from './HomeScreen.jsx';
import ExerciseScreen from './ExerciseScreen.jsx';
import RestScreen from './RestScreen.jsx';
import SummaryScreen from './SummaryScreen.jsx';

export default function App() {
  const [state, dispatch] = useReducer(sessionReducer, INITIAL_STATE);

  // Refs for MediaPipe, camera, canvas, and detection state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const animFrameRef = useRef(null);
  const repPhaseRef = useRef('idle');
  const lastCompensationTimeRef = useRef({});
  const frameScoresRef = useRef([]);
  const formScoreRef = useRef(0);
  const compensationAlertRef = useRef(null);

  // Reset refs when going back to home
  const handleDispatch = (action) => {
    if (action.type === 'START_SESSION') {
      repPhaseRef.current = 'idle';
      lastCompensationTimeRef.current = {};
      frameScoresRef.current = [];
      formScoreRef.current = 0;
      compensationAlertRef.current = null;
    }
    dispatch(action);
  };

  // Render current screen
  switch (state.screen) {
    case 'home':
      return <HomeScreen state={state} dispatch={handleDispatch} />;

    case 'exercise':
      return (
        <ExerciseScreen
          state={state}
          dispatch={handleDispatch}
          videoRef={videoRef}
          canvasRef={canvasRef}
          poseLandmarkerRef={poseLandmarkerRef}
          animFrameRef={animFrameRef}
          repPhaseRef={repPhaseRef}
          lastCompensationTimeRef={lastCompensationTimeRef}
          frameScoresRef={frameScoresRef}
          formScoreRef={formScoreRef}
          compensationAlertRef={compensationAlertRef}
        />
      );

    case 'rest':
      return <RestScreen state={state} dispatch={handleDispatch} />;

    case 'summary':
      return <SummaryScreen state={state} dispatch={handleDispatch} />;

    default:
      return <HomeScreen state={state} dispatch={handleDispatch} />;
  }
}
