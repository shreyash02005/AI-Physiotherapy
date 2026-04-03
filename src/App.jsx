// ============================================================
// VIZO — Main App Component
// ============================================================

import React, { useReducer, useRef } from 'react';
import { INITIAL_STATE } from './constants.js';
import { sessionReducer } from './reducer.js';
import { cancelAllSpeech, enableSpeech } from './utils.js';
import Layout from './Layout.jsx';
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

  // Helper to stop camera
  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Reset refs when going back to home
  const handleDispatch = (action) => {
    if (action.type === 'START_SESSION') {
      repPhaseRef.current = 'idle';
      lastCompensationTimeRef.current = {};
      frameScoresRef.current = [];
      formScoreRef.current = 0;
      compensationAlertRef.current = null;
      enableSpeech();
    }

    // Stop camera and speech when leaving exercise
    if (action.type === 'COMPLETE_SET' || action.type === 'END_SESSION') {
      stopCamera();
      cancelAllSpeech();
    }

    if (action.type === 'RESET') {
      stopCamera();
      cancelAllSpeech();
    }

    dispatch(action);
  };

  // Render current screen
  switch (state.screen) {
    case 'home':
      return <Layout state={state} dispatch={handleDispatch} />;

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
      return <Layout state={state} dispatch={handleDispatch} />;
  }
}
