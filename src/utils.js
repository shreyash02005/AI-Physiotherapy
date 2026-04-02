// ============================================================
// AI Physio Copilot — Utility Functions
// ============================================================

/**
 * Calculate angle at point B given three 2D points A, B, C.
 * Returns angle in degrees (0-180).
 */
export function calculateAngle(a, b, c) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

/**
 * Normalize an angle value to a 0–100 score based on expected min/max range.
 */
export function normalizeScore(angle, min, max) {
  if (angle <= min) return 100;
  if (angle >= max) return 0;
  const range = max - min;
  const mid = (min + max) / 2;
  const dist = Math.abs(angle - mid);
  return Math.max(0, Math.min(100, 100 - (dist / (range / 2)) * 100));
}

/**
 * Compute overall form score (0–100) based on how well current joint angles
 * match the exercise configuration ranges.
 */
export function getFormScore(landmarks, exercise) {
  if (!landmarks || !exercise || !exercise.jointAngles) return 0;
  let totalScore = 0;
  let count = 0;

  for (const ja of exercise.jointAngles) {
    const [iA, iB, iC] = ja.landmarks;
    const a = landmarks[iA];
    const b = landmarks[iB];
    const c = landmarks[iC];
    if (!a || !b || !c) continue;

    const angle = calculateAngle(a, b, c);
    // Score based on how within the min-max range the angle is
    let score;
    if (angle >= ja.minAngle && angle <= ja.maxAngle) {
      score = 100;
    } else if (angle < ja.minAngle) {
      score = Math.max(0, 100 - ((ja.minAngle - angle) / ja.minAngle) * 120);
    } else {
      score = Math.max(0, 100 - ((angle - ja.maxAngle) / (180 - ja.maxAngle)) * 120);
    }
    totalScore += score;
    count++;
  }

  return count > 0 ? Math.round(totalScore / count) : 0;
}

/**
 * Get the primary joint angle for rep counting.
 */
export function getPrimaryAngle(landmarks, exercise) {
  if (!landmarks || !exercise || !exercise.primaryAngleLandmarks) return null;
  const [iA, iB, iC] = exercise.primaryAngleLandmarks;
  const a = landmarks[iA];
  const b = landmarks[iB];
  const c = landmarks[iC];
  if (!a || !b || !c) return null;
  return calculateAngle(a, b, c);
}

/**
 * Get color based on score value.
 */
export function getScoreColor(score) {
  if (score >= 85) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' };
  if (score >= 70) return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
  return { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' };
}

/**
 * Get letter grade from average score.
 */
export function getGrade(avgScore) {
  if (avgScore >= 90) return { letter: 'A', color: 'from-emerald-400 to-teal-500' };
  if (avgScore >= 80) return { letter: 'B', color: 'from-blue-400 to-indigo-500' };
  if (avgScore >= 70) return { letter: 'C', color: 'from-amber-400 to-orange-500' };
  return { letter: 'D', color: 'from-rose-400 to-red-500' };
}

/**
 * Get form quality bar gradient CSS based on percentage.
 */
export function getFormBarColor(score) {
  if (score >= 80) return 'from-green-400 to-emerald-500';
  if (score >= 60) return 'from-yellow-400 to-amber-500';
  return 'from-red-400 to-rose-500';
}

// ============================================================
// Audio Coach — Web Speech API
// ============================================================
let speechQueue = [];
let isSpeaking = false;
let currentUtterance = null; // Prevent Chrome garbage collection bug

function processSpeechQueue() {
  if (isSpeaking || speechQueue.length === 0) return;
  const { text } = speechQueue.shift();
  
  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.rate = 1.0;
  currentUtterance.pitch = 1.0;
  currentUtterance.volume = 0.8;
  
  currentUtterance.onend = () => {
    isSpeaking = false;
    currentUtterance = null;
    processSpeechQueue();
  };
  currentUtterance.onerror = () => {
    isSpeaking = false;
    currentUtterance = null;
    processSpeechQueue();
  };
  
  isSpeaking = true;
  window.speechSynthesis.speak(currentUtterance);
}

/**
 * Speak text with priority queuing.
 * Priority: 1 = corrections (highest), 2 = rep counts, 3 = encouragement
 */
export function speak(text, priority = 2, muted = false) {
  if (muted || typeof window === 'undefined' || !window.speechSynthesis) return;

  if (priority === 1) {
    // High priority: cancel current and speak immediately
    window.speechSynthesis.cancel();
    isSpeaking = false;
    speechQueue = [{ text, priority }];
    processSpeechQueue();
  } else {
    speechQueue.push({ text, priority });
    // Sort by priority (lower number = higher priority)
    speechQueue.sort((a, b) => a.priority - b.priority);
    if (!isSpeaking) processSpeechQueue();
  }
}

/**
 * Play a short chime using AudioContext oscillator.
 */
export function playChime(type = 'success') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
    } else {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
    }
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // AudioContext not available
  }
}
