// ============================================================
// VIZO — Utility Functions
// ============================================================

/**
 * Calculate angle at point B given three 2D points A, B, C.
 * Returns angle in degrees (0-180).
 */
export function calculateAngle(a, b, c) {
  if (!a || !b || !c) return 0;
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
  
  // If dual-sided landmarks are provided [[L_A, L_B, L_C], [R_A, R_B, R_C]]
  if (Array.isArray(exercise.primaryAngleLandmarks[0])) {
    const [leftSet, rightSet] = exercise.primaryAngleLandmarks;
    const lVis = (landmarks[leftSet[0]]?.visibility || 0) + (landmarks[leftSet[1]]?.visibility || 0) + (landmarks[leftSet[2]]?.visibility || 0);
    const rVis = (landmarks[rightSet[0]]?.visibility || 0) + (landmarks[rightSet[1]]?.visibility || 0) + (landmarks[rightSet[2]]?.visibility || 0);
    
    const set = rVis > lVis ? rightSet : leftSet;
    const [iA, iB, iC] = set;
    return calculateAngle(landmarks[iA], landmarks[iB], landmarks[iC]);
  }

  // Fallback for legacy single-side [A, B, C]
  const [iA, iB, iC] = exercise.primaryAngleLandmarks;
  return calculateAngle(landmarks[iA], landmarks[iB], landmarks[iC]);
}

/**
 * Smooth angle using rolling median filter to reduce noise.
 * Takes an array of recent angles and returns the median.
 */
export function smoothAngle(angleBuffer) {
  if (!angleBuffer || angleBuffer.length === 0) return 0;
  const sorted = [...angleBuffer].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
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
  if (avgScore >= 80) return { letter: 'B', color: 'from-teal-400 to-cyan-500' };
  if (avgScore >= 70) return { letter: 'C', color: 'from-amber-400 to-orange-500' };
  return { letter: 'D', color: 'from-rose-400 to-red-500' };
}

/**
 * Get form quality bar gradient CSS based on percentage.
 */
export function getFormBarColor(score) {
  if (score >= 80) return 'from-emerald-400 to-green-500';
  if (score >= 60) return 'from-yellow-400 to-amber-500';
  return 'from-red-400 to-rose-500';
}

// ============================================================
// Audio Coach — Web Speech API
// ============================================================
let speechQueue = [];
let isSpeaking = false;
let currentUtterance = null;
let speechStopped = false;

function processSpeechQueue() {
  if (speechStopped || isSpeaking || speechQueue.length === 0) return;
  const { text, volume, rate } = speechQueue.shift();
  
  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.rate = rate || 1.0;
  currentUtterance.pitch = 1.0;
  currentUtterance.volume = volume || 0.8;
  
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
export function speak(text, priority = 2, muted = false, volume = 0.8, rate = 1.0) {
  if (muted || speechStopped || typeof window === 'undefined' || !window.speechSynthesis) return;

  if (priority === 1) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    speechQueue = [{ text, priority, volume, rate }];
    processSpeechQueue();
  } else {
    speechQueue.push({ text, priority, volume, rate });
    speechQueue.sort((a, b) => a.priority - b.priority);
    if (!isSpeaking) processSpeechQueue();
  }
}

/**
 * Cancel all speech and clear queue.
 * Call this when ending a session to prevent lingering audio.
 */
export function cancelAllSpeech() {
  speechStopped = true;
  speechQueue = [];
  isSpeaking = false;
  currentUtterance = null;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Re-enable speech after it was cancelled.
 * Call this when starting a new session.
 */
export function enableSpeech() {
  speechStopped = false;
  speechQueue = [];
  isSpeaking = false;
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

/**
 * Format date to readable string.
 */
export function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
