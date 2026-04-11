// ============================================================
// VIZO — Exercise Session HUD Screen
// ============================================================
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Volume2, VolumeX, AlertTriangle, Square, ArrowLeft, Play, Timer } from 'lucide-react';
import { LANDMARK_CONNECTIONS } from './constants.js';
import { calculateAngle, getFormScore, getPrimaryAngle, smoothAngle, speak, playChime, cancelAllSpeech } from './utils.js';

// Skeleton drawing colors
const JOINT_COLORS = { good: '#10b981', moderate: '#f59e0b', poor: '#ef4444' };

// Min time between reps (ms)
const MIN_REP_DURATION = 600;
// Min time in down phase before counting (ms)
const MIN_DOWN_PHASE_DURATION = 200;
// Slow down warning threshold (ms between reps)
const SLOW_DOWN_THRESHOLD = 1500;
// Slow down audio throttle (ms)
const SLOW_DOWN_AUDIO_INTERVAL = 8000;

export default function ExerciseScreen({ state, dispatch, videoRef, canvasRef, poseLandmarkerRef, animFrameRef, repPhaseRef, lastCompensationTimeRef, frameScoresRef, formScoreRef, compensationAlertRef }) {
  const { selectedExercise, currentSet, currentRep, customSets, customReps, isMuted, streak, settings } = state;
  const [hasStarted, setHasStarted] = useState(false);
  const hasStartedRef = useRef(false);
  const [showSlowDown, setShowSlowDown] = useState(false);
  const compensationTimersRef = useRef({});
  const processFrameRef = useRef(null);
  const lastRepTimeRef = useRef(0);
  const downPhaseStartRef = useRef(0);
  const angleBufferRef = useRef([]);
  const lastSlowDownSpeechRef = useRef(0);
  const slowDownTimerRef = useRef(null);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  }, [animFrameRef, videoRef]);

  // Start camera + detection loop on mount
  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        const [w, h] = (settings?.cameraResolution || '1280x720').split('x').map(Number);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: settings?.cameraFacing || 'user',
            width: w || 1280,
            height: h || 720,
          },
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
      const detectPose = () => {
        if (!mounted || !videoRef.current || !canvasRef.current) {
          animFrameRef.current = requestAnimationFrame(detectPose);
          return;
        }
        const video = videoRef.current;
        if (video.readyState < 2) {
          animFrameRef.current = requestAnimationFrame(detectPose);
          return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // 1. Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 2. Draw the Video Frame FIRST (mirrored)
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        // 3. Draw the Skeleton SECOND
        if (hasStartedRef.current && poseLandmarkerRef.current) {
          const startTimeMs = performance.now();
          const result = poseLandmarkerRef.current.detectForVideo(video, startTimeMs);
          if (result?.landmarks?.length > 0) {
            const landmarks = result.landmarks[0];
            drawSkeleton(landmarks, canvas, ctx);
            if (processFrameRef.current) processFrameRef.current(landmarks);
          }
        }

        animFrameRef.current = requestAnimationFrame(detectPose);
      };
      animFrameRef.current = requestAnimationFrame(detectPose);
    };

    const initAndStart = async () => {
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
      stopCamera();
      cancelAllSpeech();
    };
  }, []);

  // Draw skeleton on canvas
  const drawSkeleton = useCallback((landmarks, canvas, ctx) => {
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    const w = canvas.width;
    const h = canvas.height;

    // Draw connections in emerald green
    ctx.strokeStyle = 'rgba(78, 222, 163, 0.6)';
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

    // Angle smoothing
    const rawAngle = getPrimaryAngle(landmarks, selectedExercise);
    if (rawAngle !== null) {
      angleBufferRef.current.push(rawAngle);
      if (angleBufferRef.current.length > 5) angleBufferRef.current.shift();
      const smoothedAngle = smoothAngle(angleBufferRef.current);

      if (hasStarted) {
        countRep(smoothedAngle, score);
      }
    }

    // Compensation detection
    if (hasStarted) {
      detectCompensation(landmarks);
    }
  }, [selectedExercise, currentRep, currentSet, customReps, customSets, isMuted, hasStarted, dispatch]);

  useEffect(() => {
    processFrameRef.current = processFrame;
  }, [processFrame]);

  // Improved rep counting state machine
  const countRep = useCallback((angle, currentScore) => {
    const { phases } = selectedExercise;
    const phase = repPhaseRef.current;
    const HYSTERESIS = 4; // Reduced from 8 for better sensitivity
    const now = Date.now();

    if (phase === 'idle' || phase === 'up') {
      const threshold = phases.down.angle;
      const crossed = phases.down.direction === 'below'
        ? angle < threshold - HYSTERESIS
        : angle > threshold + HYSTERESIS;
      if (crossed) {
        repPhaseRef.current = 'down';
        downPhaseStartRef.current = now;
      }
    } else if (phase === 'down') {
      // Require minimum time in down phase
      const downDuration = now - downPhaseStartRef.current;
      if (downDuration < MIN_DOWN_PHASE_DURATION) return;

      const threshold = phases.up.angle;
      const crossed = phases.up.direction === 'below'
        ? angle < threshold - HYSTERESIS
        : angle > threshold + HYSTERESIS;
      if (crossed) {
        // Enforce minimum rep duration
        const timeSinceLastRep = now - lastRepTimeRef.current;
        if (lastRepTimeRef.current > 0 && timeSinceLastRep < MIN_REP_DURATION) {
          return; // Too fast, ignore
        }

        repPhaseRef.current = 'up';
        lastRepTimeRef.current = now;

        // Check if user is going too fast — slow down prompt
        if (lastRepTimeRef.current > 0 && timeSinceLastRep < SLOW_DOWN_THRESHOLD && timeSinceLastRep >= MIN_REP_DURATION) {
          setShowSlowDown(true);
          if (slowDownTimerRef.current) clearTimeout(slowDownTimerRef.current);
          slowDownTimerRef.current = setTimeout(() => setShowSlowDown(false), 3000);

          // Throttled audio
          if (now - lastSlowDownSpeechRef.current > SLOW_DOWN_AUDIO_INTERVAL) {
            lastSlowDownSpeechRef.current = now;
            speak('Slow down for better form', 1, isMuted,
              settings?.audioVolume || 0.8, settings?.audioSpeed || 1.0);
          }
        }

        // Count the rep
        const avgFrameScore = frameScoresRef.current.length > 0
          ? Math.round(frameScoresRef.current.reduce((a, b) => a + b, 0) / frameScoresRef.current.length)
          : currentScore;

        dispatch({ type: 'COUNT_REP', payload: { score: avgFrameScore } });
        frameScoresRef.current = [];
        angleBufferRef.current = [];

        // Correctly calculate local count for speech feedback
        const newRepCount = (currentRep || 0) + 1;
        speak(`Rep ${newRepCount} of ${customReps}`, 2, isMuted,
          settings?.audioVolume || 0.8, settings?.audioSpeed || 1.0);

        if (avgFrameScore >= 85) {
          playChime('success');
        }

        // Check if set is complete
        if (newRepCount >= customReps) {
          setTimeout(() => {
            speak(
              currentSet >= customSets
                ? 'Session complete! Great work!'
                : `Great set! Rest for ${settings?.restDuration || 30} seconds.`,
              2, isMuted, settings?.audioVolume || 0.8, settings?.audioSpeed || 1.0
            );
            dispatch({ type: 'COMPLETE_SET' });
            repPhaseRef.current = 'idle';
          }, 500);
        }
      }
    }
  }, [selectedExercise, currentRep, customReps, currentSet, customSets, isMuted, dispatch, settings]);

  // Compensation detection
  const detectCompensation = useCallback((landmarks) => {
    if (!selectedExercise?.compensationRules) return;
    const now = Date.now();

    for (const rule of selectedExercise.compensationRules) {
      if (rule.check(landmarks)) {
        if (!compensationTimersRef.current[rule.id]) {
          compensationTimersRef.current[rule.id] = now;
        } else if (now - compensationTimersRef.current[rule.id] > 500) {
          const lastTime = lastCompensationTimeRef.current[rule.id] || 0;
          if (now - lastTime > 5000) {
            lastCompensationTimeRef.current[rule.id] = now;
            compensationAlertRef.current = { message: rule.message, time: now };
            dispatch({ type: 'ADD_COMPENSATION', payload: { ruleId: rule.id, name: rule.name, message: rule.message } });
            speak(rule.message, 1, isMuted,
              settings?.audioVolume || 0.8, settings?.audioSpeed || 1.0);
            setTimeout(() => {
              if (compensationAlertRef.current?.time === now) {
                compensationAlertRef.current = null;
              }
            }, 3000);
          }
        }
      } else {
        compensationTimersRef.current[rule.id] = null;
      }
    }
  }, [selectedExercise, isMuted, dispatch, settings]);

  const handleEndSession = () => {
    stopCamera();
    cancelAllSpeech();
    dispatch({ type: 'END_SESSION' });
  };

  const handleBackToHome = () => {
    stopCamera();
    cancelAllSpeech();
    dispatch({ type: 'RESET' });
  };

  const formScore = formScoreRef.current;
  const alert = compensationAlertRef.current;
  const showAlert = alert && (Date.now() - alert.time < 3000);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: 'var(--gb-bg)' }}>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        style={{ 
          position: 'absolute', 
          width: '1280px', 
          height: '720px', 
          opacity: 0, 
          pointerEvents: 'none' 
        }} 
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />

      {/* Camera error */}
      {state.cameraError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center" style={{ backgroundColor: 'rgba(7, 22, 16, 0.8)' }}>
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '448px', textAlign: 'center' }}>
            <AlertTriangle size={48} color="#fbbf24" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>Camera Access Required</h3>
            <p style={{ color: 'var(--gb-text-dim)' }}>{state.cameraError}</p>
          </div>
        </div>
      )}

      {/* Top-Left: Exercise Info */}
      <div className="glass-panel animate-fade-in" style={{ position: 'absolute', top: '2rem', left: '2rem', zIndex: 20, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '280px' }}>
        <button
          onClick={handleBackToHome}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gb-primary)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 700 }}
        >
          <ArrowLeft size={18} />
          Back to Home
        </button>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--gb-text-muted)', opacity: 0.7 }}>Current Exercise</span>
        <h2 className="font-headline" style={{ fontSize: '1.875rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>
          {selectedExercise?.name}
        </h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gb-text-muted)' }}>Progress</span>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gb-primary)' }}>Set {currentSet} of {customSets}</p>
          </div>
          <div style={{ height: '40px', width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 0.5rem' }} />
          <div>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gb-text-muted)' }}>Rep Count</span>
            <p className={streak > 3 ? 'animate-streak-pulse' : ''} style={{ fontSize: '2.25rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
              {currentRep}<span style={{ fontSize: '1.125rem', fontWeight: 500, color: 'var(--gb-text-muted)', marginLeft: '0.25rem' }}>/ {customReps}</span>
            </p>
          </div>
        </div>
        {streak > 3 && (
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700 }}>
            🔥 Streak: {streak}
          </div>
        )}
      </div>

      {/* Top-Right: Volume + Form Quality */}
      <div style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_MUTE' })}
          className="glass-panel"
          style={{ padding: '0.75rem 1.25rem', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fff', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {isMuted ? 'Unmute AI' : 'Mute AI'}
          </span>
        </button>

        <div className="glass-panel" style={{ padding: '1.5rem', minWidth: '240px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gb-text-muted)' }}>Form Quality</span>
            <span style={{ color: 'var(--gb-primary)', fontWeight: 900, fontSize: '1.125rem' }}>{formScore}%</span>
          </div>
          <div style={{ width: '100%', height: '12px', background: 'var(--gb-surface-highest)', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${formScore}%`,
                background: formScore >= 80 ? 'linear-gradient(90deg, #34d399, #10b981)' : formScore >= 60 ? 'linear-gradient(90deg, #fbbf24, #f59e0b)' : 'linear-gradient(90deg, #fb7185, #f43f5e)',
                transition: 'width 0.3s ease-out',
              }}
            />
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: formScore >= 80 ? '#34d399' : formScore >= 60 ? '#fbbf24' : '#fb7185', animation: 'pulse-glow 2s infinite' }} />
            <span style={{ fontSize: '0.625rem', color: 'var(--gb-text-dim)', fontWeight: 500 }}>
              {formScore >= 80 ? 'Optimal Form' : formScore >= 60 ? 'Moderate — Adjust form' : 'Needs Correction'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom-Center: Compensation Alert */}
      {showAlert && (
        <div className="animate-slide-in" style={{ position: 'absolute', bottom: '7rem', left: '50%', transform: 'translateX(-50%)', zIndex: 20, width: '100%', maxWidth: '576px', padding: '0 1rem' }}>
          <div className="glass-panel animate-bounce-subtle" style={{ border: '1px solid rgba(255,179,175,0.3)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'rgba(255,179,175,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={24} color="#ffb3af" />
            </div>
            <div>
              <h4 style={{ color: '#ffb3af', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Compensation Alert</h4>
              <p style={{ color: '#fff', fontSize: '1.125rem', fontWeight: 500 }}>{alert.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Slow Down Warning */}
      {showSlowDown && (
        <div className="animate-fade-in" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 30 }}>
          <div className="glass-panel" style={{ border: '1px solid rgba(245,158,11,0.3)', padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Timer size={28} color="#fbbf24" className="animate-pulse" />
            <div>
              <h4 style={{ color: '#fbbf24', fontWeight: 700, fontSize: '1rem' }}>Slow Down!</h4>
              <p style={{ color: 'var(--gb-text-dim)', fontSize: '0.875rem' }}>Control your movement for better form</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom-Right: Session Action */}
      <div style={{ position: 'absolute', bottom: '3rem', right: '2rem', zIndex: 20, display: 'flex', gap: '1rem' }}>
        {!hasStarted ? (
          <button
            onClick={() => {
              hasStartedRef.current = true;
              setHasStarted(true);
            }}
            className="animate-pulse-glow"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.5)',
              padding: '1rem 2rem', borderRadius: '999px', cursor: 'pointer', transition: 'all 0.2s', activeScale: '0.95', backdropFilter: 'blur(12px)'
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4edea3' }} className="animate-pulse" />
            <span style={{ color: '#fff', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '1rem' }}>Start Exercise</span>
            <Play size={20} color="#fff" fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={handleEndSession}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.5)',
              padding: '1rem 2rem', borderRadius: '999px', cursor: 'pointer', transition: 'all 0.2s', activeScale: '0.95', backdropFilter: 'blur(12px)'
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171' }} className="animate-pulse" />
            <span style={{ color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.875rem' }}>Quit Exercise</span>
            <Square size={20} color="#fff" />
          </button>
        )}
      </div>
    </div>
  );
}
