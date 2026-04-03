// ============================================================
// VIZO — Exercise Configurations & Constants
// ============================================================

// MediaPipe CDN URLs
export const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
export const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

// Landmark connections for skeleton drawing
export const LANDMARK_CONNECTIONS = [
  [11, 12], // shoulders
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [11, 23], [12, 24], // torso sides
  [23, 24], // hips
  [23, 25], [25, 27], // left leg
  [24, 26], [26, 28], // right leg
];

// 6 Exercise configurations
export const EXERCISES = [
  {
    id: 'bicep-curls',
    name: 'Bicep Curls',
    description: 'Isolate brachii and improve upper arm stability with controlled movements.',
    icon: 'Dumbbell',
    targetReps: 12,
    targetSets: 3,
    jointAngles: [
      { landmarks: [12, 14, 16], minAngle: 30, maxAngle: 160, label: 'Right Elbow' },
      { landmarks: [11, 13, 15], minAngle: 30, maxAngle: 160, label: 'Left Elbow' },
    ],
    phases: {
      down: { angle: 85, direction: 'below' }, // Contracted peak (target)
      up: { angle: 135, direction: 'above' },  // Returns to start
    },
    primaryAngleLandmarks: [[11, 13, 15], [12, 14, 16]], // Left/Right arms
    compensationRules: [
      {
        id: 'elbow-flare',
        name: 'Elbow Flare',
        check: (lm) => {
          if (!lm[14] || !lm[24]) return false;
          const lMove = Math.abs(lm[13]?.y - lm[15]?.y || 0);
          const rMove = Math.abs(lm[14]?.y - lm[16]?.y || 0);
          if (rMove > lMove) return Math.abs(lm[14].x - lm[24].x) > 0.14;
          return Math.abs(lm[13].x - lm[23].x) > 0.14;
        },
        message: 'Keep your elbows tucked into your sides',
      },
      {
        id: 'shoulder-swing',
        name: 'Shoulder Swing',
        check: (lm) => {
          if (!lm[12] || !lm[24]) return false;
          return Math.abs(lm[12].y - lm[24].y) < 0.15;
        },
        message: 'Avoid swinging your shoulders',
      },
    ],
    side: 'both',
  },
  {
    id: 'squats',
    name: 'Squats',
    description: 'Full body mobility focus targeting glutes, quads, and core alignment.',
    icon: 'Activity',
    targetReps: 12,
    targetSets: 3,
    jointAngles: [
      { landmarks: [24, 26, 28], minAngle: 70, maxAngle: 175, label: 'Right Knee' },
      { landmarks: [23, 25, 27], minAngle: 70, maxAngle: 175, label: 'Left Knee' },
    ],
    phases: {
      down: { angle: 120, direction: 'below' }, 
      up: { angle: 145, direction: 'above' },
    },
    primaryAngleLandmarks: [[23, 25, 27], [24, 26, 28]],
    compensationRules: [
      {
        id: 'knee-cave',
        name: 'Knee Cave',
        check: (lm) => {
          if (!lm[25] || !lm[26] || !lm[23] || !lm[24]) return false;
          const kneeWidth = Math.abs(lm[25].x - lm[26].x);
          const hipWidth = Math.abs(lm[23].x - lm[24].x);
          return kneeWidth < hipWidth * 0.65;
        },
        message: 'Push your knees outward, avoid caving in',
      },
      {
        id: 'forward-lean',
        name: 'Forward Lean',
        check: (lm) => {
          if (!lm[12] || !lm[24]) return false;
          return (lm[12].x - lm[24].x) > 0.08;
        },
        message: 'Keep your chest upright',
      },
    ],
    side: 'both',
  },
  {
    id: 'shoulder-press',
    name: 'Shoulder Press',
    description: 'Overhead strengthening for deltoid health and scapular rhythm.',
    icon: 'ArrowUp',
    targetReps: 12,
    targetSets: 3,
    jointAngles: [
      { landmarks: [24, 12, 14], minAngle: 60, maxAngle: 170, label: 'Right Shoulder' },
      { landmarks: [23, 11, 13], minAngle: 60, maxAngle: 170, label: 'Left Shoulder' },
    ],
    phases: {
      down: { angle: 150, direction: 'above' }, 
      up: { angle: 110, direction: 'below' },
    },
    primaryAngleLandmarks: [[23, 11, 13], [24, 12, 14]],
    compensationRules: [
      {
        id: 'trunk-lean',
        name: 'Trunk Lean',
        check: (lm) => {
          if (!lm[11] || !lm[12] || !lm[23] || !lm[24]) return false;
          const shoulderMidX = (lm[11].x + lm[12].x) / 2;
          const hipMidX = (lm[23].x + lm[24].x) / 2;
          return Math.abs(shoulderMidX - hipMidX) > 0.06;
        },
        message: 'Keep your torso straight, avoid leaning',
      },
    ],
    side: 'both',
  },
  {
    id: 'lunges',
    name: 'Lunges',
    description: 'Enhance balance and unilateral leg strength for gait improvement.',
    icon: 'PersonStanding',
    targetReps: 12,
    targetSets: 3,
    jointAngles: [
      { landmarks: [24, 26, 28], minAngle: 70, maxAngle: 175, label: 'Right Knee' },
      { landmarks: [23, 25, 27], minAngle: 70, maxAngle: 175, label: 'Left Knee' },
    ],
    phases: {
      down: { angle: 120, direction: 'below' }, 
      up: { angle: 145, direction: 'above' },
    },
    primaryAngleLandmarks: [[23, 25, 27], [24, 26, 28]],
    compensationRules: [
      {
        id: 'knee-over-toe',
        name: 'Knee Over Toe',
        check: (lm) => {
          if (!lm[26] || !lm[28]) return false;
          return lm[26].x > lm[28].x + 0.05;
        },
        message: 'Keep your knee behind your toes',
      },
    ],
    side: 'both',
  },
  {
    id: 'lateral-raises',
    name: 'Lateral Raises',
    description: 'Targeted lateral deltoid activation for posture and width.',
    icon: 'Move',
    targetReps: 12,
    targetSets: 3,
    jointAngles: [
      { landmarks: [24, 12, 16], minAngle: 10, maxAngle: 100, label: 'Right Shoulder Abduction' },
      { landmarks: [23, 11, 15], minAngle: 10, maxAngle: 100, label: 'Left Shoulder Abduction' },
    ],
    phases: {
      down: { angle: 65, direction: 'above' }, 
      up: { angle: 35, direction: 'below' },
    },
    primaryAngleLandmarks: [[23, 11, 15], [24, 12, 16]],
    compensationRules: [
      {
        id: 'shrug',
        name: 'Shoulder Shrug',
        check: (lm) => {
          if (!lm[11] || !lm[12]) return false;
          return lm[12].y < lm[11].y - 0.03;
        },
        message: 'Relax your shoulders, avoid shrugging',
      },
    ],
    side: 'both',
  },
  {
    id: 'knee-extensions',
    name: 'Knee Extensions',
    description: 'Controlled extension to reinforce knee joint and quadriceps.',
    icon: 'Footprints',
    targetReps: 12,
    targetSets: 3,
    jointAngles: [
      { landmarks: [24, 26, 28], minAngle: 70, maxAngle: 175, label: 'Right Knee' },
      { landmarks: [23, 25, 27], minAngle: 70, maxAngle: 175, label: 'Left Knee' },
    ],
    phases: {
      down: { angle: 140, direction: 'above' }, 
      up: { angle: 115, direction: 'below' },
    },
    primaryAngleLandmarks: [[23, 25, 27], [24, 26, 28]],
    compensationRules: [
      {
        id: 'hip-lift',
        name: 'Hip Lift',
        check: (lm) => {
          if (!lm[23] || !lm[24]) return false;
          return Math.abs(lm[23].y - lm[24].y) > 0.04;
        },
        message: 'Keep your hips level on the seat',
      },
    ],
    side: 'both',
  },
];

// Default settings
export const DEFAULT_SETTINGS = {
  userName: 'User',
  defaultReps: 12,
  defaultSets: 3,
  restDuration: 30,
  audioEnabled: true,
  audioVolume: 0.8,
  audioSpeed: 1.0,
  cameraResolution: '1280x720',
  cameraFacing: 'user',
  highContrast: false,
  largerText: false,
};

// Load persisted data from localStorage
function loadFromStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

// Initial reducer state
export const INITIAL_STATE = {
  screen: 'home',
  tab: 'dashboard',
  selectedExercise: null,
  customReps: 12,
  customSets: 3,
  currentSet: 0,
  currentRep: 0,
  repScores: [],
  setHistory: [],
  compensationLog: [],
  streak: 0,
  bestStreak: 0,
  bestAvgScore: 0,
  sessionHistory: loadFromStorage('vizo_sessionHistory', []),
  isMuted: false,
  restTime: 30,
  cameraError: null,
  settings: loadFromStorage('vizo_settings', DEFAULT_SETTINGS),
};
