// ============================================================
// Exercise Session HUD Screen (Stitch Design)
// ============================================================
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Volume2, VolumeX, AlertTriangle, Square, ArrowLeft, Play } from 'lucide-react';
import { LANDMARK_CONNECTIONS } from './constants.js';
import { calculateAngle, getFormScore, getPrimaryAngle, speak, playChime } from './utils.js';

// Skeleton drawing colors
const JOINT_COLORS = { good: '#10b981', moderate: '#f59e0b', poor: '#ef4444' };

export default function ExerciseScreen({ state, dispatch, videoRef, canvasRef, poseLandmarkerRef, animFrameRef, repPhaseRef, lastCompensationTimeRef, frameScoresRef, formScoreRef, compensationAlertRef }) {
  const { selectedExercise, currentSet, currentRep, customSets, customReps, isMuted, streak } = state;
  const [hasStarted, setHasStarted] = useState(false);
  const compensationTimersRef = useRef({});
  const processFrameRef = useRef(null);

  // Start camera + detection loop on mount
  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 1280, height: 720 },
        });
        if (videoRef.current && mounted) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
            if (canvasRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
            }
            startDetectionLoop();
          };
        }
      } catch (err) {
        dispatch({ type: 'SET_CAMERA_ERROR', payload: err.message || 'Camera access denied' });
      }
    };

    const startDetectionLoop = () => {
      const detect = () => {
        if (!mounted || !videoRef.current || !poseLandmarkerRef.current || !canvasRef.current) {
          animFrameRef.current = requestAnimationFrame(detect);
          return;
        }
        const video = videoRef.current;
        if (video.readyState < 2) {
          animFrameRef.current = requestAnimationFrame(detect);
          return;
        }

        const result = poseLandmarkerRef.current.detectForVideo(video, performance.now());
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Draw video frame (mirrored)
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        if (result?.landmarks?.length > 0) {
          const landmarks = result.landmarks[0];
          drawSkeleton(landmarks, canvas, ctx);
          if (processFrameRef.current) processFrameRef.current(landmarks);
        }

        animFrameRef.current = requestAnimationFrame(detect);
      };
      animFrameRef.current = requestAnimationFrame(detect);
    };

    const initAndStart = async () => {
      // Initialize MediaPipe if not done
      if (!poseLandmarkerRef.current) {
        try {
          const vision = await import(
            /* @vite-ignore */
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14'
          );
          const fileset = await vision.FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
          );
          poseLandmarkerRef.current = await vision.PoseLandmarker.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numPoses: 1,
          });
        } catch (e) {
          console.error('MediaPipe init error:', e);
          dispatch({ type: 'SET_CAMERA_ERROR', payload: 'Failed to load pose detection model' });
          return;
        }
      }
      await startCamera();
    };

    initAndStart();

    return () => {
      mounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Draw skeleton on canvas
  const drawSkeleton = useCallback((landmarks, canvas, ctx) => {
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    const w = canvas.width;
    const h = canvas.height;

    // Draw connections
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (const [i, j] of LANDMARK_CONNECTIONS) {
      const a = landmarks[i];
      const b = landmarks[j];
      if (a && b && a.visibility > 0.5 && b.visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(a.x * w, a.y * h);
        ctx.lineTo(b.x * w, b.y * h);
        ctx.stroke();
      }
    }

    // Draw joints
    const formScore = formScoreRef.current;
    const jointColor = formScore >= 80 ? JOINT_COLORS.good : formScore >= 60 ? JOINT_COLORS.moderate : JOINT_COLORS.poor;

    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      if (lm && lm.visibility > 0.5) {
        // Only draw major landmarks (11-16, 23-28)
        if ((i >= 11 && i <= 16) || (i >= 23 && i <= 28)) {
          ctx.beginPath();
          ctx.arc(lm.x * w, lm.y * h, 6, 0, Math.PI * 2);
          ctx.fillStyle = jointColor;
          ctx.shadowColor = jointColor;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }
    ctx.restore();
  }, []);

  // Process each frame: form score, rep counting, compensation
  const processFrame = useCallback((landmarks) => {
    if (!selectedExercise) return;

    // Form score
    const score = getFormScore(landmarks, selectedExercise);
    formScoreRef.current = score;
    frameScoresRef.current.push(score);
    if (frameScoresRef.current.length > 30) frameScoresRef.current.shift();

    // Rep counting
    const angle = getPrimaryAngle(landmarks, selectedExercise);
    if (angle !== null && hasStarted) {
      countRep(angle, score);
    }

    // Compensation detection
    if (hasStarted) {
      detectCompensation(landmarks);
    }
  }, [selectedExercise, currentRep, currentSet, customReps, customSets, isMuted, hasStarted, dispatch]);

  useEffect(() => {
    processFrameRef.current = processFrame;
  }, [processFrame]);

  // Rep counting state machine
  const countRep = useCallback((angle, currentScore) => {
    const { phases } = selectedExercise;
    const phase = repPhaseRef.current;
    const HYSTERESIS = 10; // Reduced from 15 so reps are easier to hit with the new relaxed angles

    if (phase === 'idle' || phase === 'up') {
      // Check for down phase
      const threshold = phases.down.angle;
      const crossed = phases.down.direction === 'below'
        ? angle < threshold - HYSTERESIS
        : angle > threshold + HYSTERESIS;
      if (crossed) {
        repPhaseRef.current = 'down';
      }
    } else if (phase === 'down') {
      // Check for up phase (rep complete)
      const threshold = phases.up.angle;
      const crossed = phases.up.direction === 'below'
        ? angle < threshold - HYSTERESIS
        : angle > threshold + HYSTERESIS;
      if (crossed) {
        repPhaseRef.current = 'up';
        // Count the rep
        const avgFrameScore = frameScoresRef.current.length > 0
          ? Math.round(frameScoresRef.current.reduce((a, b) => a + b, 0) / frameScoresRef.current.length)
          : currentScore;

        dispatch({ type: 'COUNT_REP', payload: { score: avgFrameScore } });
        frameScoresRef.current = [];

        const newRepCount = currentRep + 1;
        speak(`Rep ${newRepCount} of ${customReps}`, 2, isMuted);

        if (avgFrameScore >= 85) {
          playChime('success');
        }

        // Check if set is complete
        if (newRepCount >= customReps) {
          setTimeout(() => {
            speak(
              currentSet >= customSets
                ? 'Session complete! Great work!'
                : 'Great set! Rest for 30 seconds.',
              2, isMuted
            );
            dispatch({ type: 'COMPLETE_SET' });
            repPhaseRef.current = 'idle';
          }, 500);
        }
      }
    }
  }, [selectedExercise, currentRep, customReps, currentSet, customSets, isMuted, dispatch]);

  // Compensation detection
  const detectCompensation = useCallback((landmarks) => {
    if (!selectedExercise?.compensationRules) return;
    const now = Date.now();

    for (const rule of selectedExercise.compensationRules) {
      if (rule.check(landmarks)) {
        if (!compensationTimersRef.current[rule.id]) {
          compensationTimersRef.current[rule.id] = now;
        } else if (now - compensationTimersRef.current[rule.id] > 500) {
          // If posture is continuously bad for 0.5s, check if we need to alert
          const lastTime = lastCompensationTimeRef.current[rule.id] || 0;
          if (now - lastTime > 5000) { // 5 second timer for AI to remind
            lastCompensationTimeRef.current[rule.id] = now;
            compensationAlertRef.current = { message: rule.message, time: now };
            dispatch({ type: 'ADD_COMPENSATION', payload: { ruleId: rule.id, name: rule.name, message: rule.message } });
            speak(rule.message, 1, isMuted);
            setTimeout(() => {
              if (compensationAlertRef.current?.time === now) {
                compensationAlertRef.current = null;
              }
            }, 3000);
          }
        }
      } else {
        // Reset timer if form corrects
        compensationTimersRef.current[rule.id] = null;
      }
    }
  }, [selectedExercise, isMuted, dispatch]);

  const formScore = formScoreRef.current;
  const alert = compensationAlertRef.current;
  const showAlert = alert && (Date.now() - alert.time < 3000);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: '#0f0f23' }}>
      {/* Hidden video element (must have active dimensions to stream correctly, so opacity-0 is used instead of hidden) */}
      <video ref={videoRef} autoPlay playsInline muted className="opacity-0 absolute w-px h-px pointer-events-none" />

      {/* Canvas with video + skeleton */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />

      {/* Camera loading/error state */}
      {state.cameraError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-surface/80">
          <div className="glass-panel rounded-2xl p-8 max-w-md text-center">
            <AlertTriangle size={48} className="text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Camera Access Required</h3>
            <p className="text-on-surface-variant">{state.cameraError}</p>
          </div>
        </div>
      )}

      {/* Top-Left: Exercise Info */}
      <div className="absolute top-8 left-8 z-20 glass-panel rounded-2xl p-6 flex flex-col gap-1 min-w-[280px]">
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors mb-4 text-sm font-bold w-fit"
        >
          <ArrowLeft size={18} />
          Back to Home
        </button>
        <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest opacity-70">Current Exercise</span>
        <h2 className="text-3xl font-black tracking-tight text-white">{selectedExercise?.name}</h2>
        <div className="flex items-end gap-3 mt-4">
          <div className="flex flex-col">
            <span className="text-on-surface-variant text-[10px] font-bold uppercase">Progress</span>
            <p className="text-xl font-bold text-primary">Set {currentSet} of {customSets}</p>
          </div>
          <div className="h-10 w-[1px] bg-white/10 mx-2" />
          <div className="flex flex-col">
            <span className="text-on-surface-variant text-[10px] font-bold uppercase">Rep Count</span>
            <p className={`text-4xl font-black leading-none text-white ${streak > 3 ? 'animate-streak-pulse' : ''}`}>
              {currentRep}<span className="text-lg font-medium text-on-surface-variant/60 ml-1">/ {customReps}</span>
            </p>
          </div>
        </div>
        {streak > 3 && (
          <div className="mt-2 flex items-center gap-1 text-amber-400 text-xs font-bold">
            🔥 Streak: {streak}
          </div>
        )}
      </div>

      {/* Top-Right: Volume + Form Quality */}
      <div className="absolute top-8 right-8 z-20 flex flex-col items-end gap-4">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_MUTE' })}
          className="glass-panel rounded-full px-5 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX size={20} className="text-white" /> : <Volume2 size={20} className="text-white" />}
          <span className="text-xs font-bold uppercase tracking-widest text-white">
            {isMuted ? 'Unmute AI' : 'Mute AI'}
          </span>
        </button>

        <div className="glass-panel rounded-2xl p-6 min-w-[240px]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Form Quality</span>
            <span className="text-primary font-black text-lg">{formScore}%</span>
          </div>
          <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${formScore >= 80 ? 'from-green-400 to-emerald-500' : formScore >= 60 ? 'from-yellow-400 to-amber-500' : 'from-red-400 to-rose-500'} transition-all duration-300`}
              style={{ width: `${formScore}%` }}
            />
          </div>
          <div className="mt-3 flex gap-2 items-center">
            <span className={`w-2 h-2 rounded-full ${formScore >= 80 ? 'bg-green-400' : formScore >= 60 ? 'bg-amber-400' : 'bg-red-400'} animate-pulse`} />
            <span className="text-[10px] text-on-surface-variant font-medium">
              {formScore >= 80 ? 'Optimal Form' : formScore >= 60 ? 'Moderate — Adjust form' : 'Needs Correction'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom-Center: Compensation Alert */}
      {showAlert && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 w-full max-w-xl px-4 animate-slide-in">
          <div className="glass-panel border-tertiary/30 rounded-2xl p-4 flex items-center gap-4 animate-bounce-subtle">
            <div className="w-12 h-12 rounded-xl bg-tertiary-container/20 flex items-center justify-center">
              <AlertTriangle size={24} className="text-tertiary" />
            </div>
            <div>
              <h4 className="text-tertiary font-bold text-sm uppercase tracking-wide">Compensation Alert</h4>
              <p className="text-white text-lg font-medium tracking-tight">{alert.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom-Right: Session Action */}
      <div className="absolute bottom-12 right-8 z-20 flex gap-4">
        {!hasStarted ? (
          <button
            onClick={() => setHasStarted(true)}
            className="group flex items-center gap-3 bg-emerald-500/20 hover:bg-emerald-500/40 backdrop-blur-md border border-emerald-500/50 px-8 py-4 rounded-full transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-black tracking-widest uppercase text-md">Start Exercise</span>
            <Play size={20} className="text-white fill-current" />
          </button>
        ) : (
          <button
            onClick={() => dispatch({ type: 'END_SESSION' })}
            className="group flex items-center gap-3 bg-error-container/20 hover:bg-error-container/40 backdrop-blur-md border border-error-container/50 px-8 py-4 rounded-full transition-all active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
            <span className="text-white font-bold tracking-wider uppercase text-sm">Quit Exercise</span>
            <Square size={20} className="text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
