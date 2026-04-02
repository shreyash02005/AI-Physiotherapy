// ============================================================
// AI Physio Copilot — Exercise Configurations & Constants
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
    ],
    phases: {
      down: { angle: 75, direction: 'below' },
      up: { angle: 125, direction: 'above' },
    },
    primaryAngleLandmarks: [12, 14, 16],
    compensationRules: [
      {
        id: 'elbow-flare',
        name: 'Elbow Flare',
        check: (lm) => {
          if (!lm[14] || !lm[24]) return false;
          return Math.abs(lm[14].x - lm[24].x) > 0.12;
        },
        message: 'Keep your elbows close to your body',
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
    side: 'right',
  },
  {
    id: 'squats',
    name: 'Squats',
    description: 'Full body mobility focus targeting glutes, quads, and core alignment.',
    icon: 'Activity',
    targetReps: 12,
    targetSets: 3,
    jointAngles: [
      { landmarks: [24, 26, 28], minAngle: 70, maxAngle: 170, label: 'Right Knee' },
      { landmarks: [23, 25, 27], minAngle: 70, maxAngle: 170, label: 'Left Knee' },
    ],
    phases: {
      down: { angle: 115, direction: 'below' },
      up: { angle: 140, direction: 'above' },
    },
    primaryAngleLandmarks: [24, 26, 28],
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
    ],
    phases: {
      down: { angle: 135, direction: 'above' },
      up: { angle: 105, direction: 'below' },
    },
    primaryAngleLandmarks: [24, 12, 14],
    compensationRules: [
      {
        id: 'trunk-lean',
        name: 'Trunk Lean',
        check: (lm) => {
          if (!lm[11] || !lm[12] || !lm[23] || !lm[24]) return false;
          const shoulderMidY = (lm[11].y + lm[12].y) / 2;
          const hipMidY = (lm[23].y + lm[24].y) / 2;
          const shoulderMidX = (lm[11].x + lm[12].x) / 2;
          const hipMidX = (lm[23].x + lm[24].x) / 2;
          return Math.abs(shoulderMidX - hipMidX) > 0.06;
        },
        message: 'Keep your torso straight, avoid leaning',
      },
    ],
    side: 'right',
  },
  {
    id: 'lunges',
    name: 'Lunges',
    description: 'Enhance balance and unilateral leg strength for gait improvement.',
    icon: 'PersonStanding',
    targetReps: 12,
    targetSets: 3,
    jointAngles: [
      { landmarks: [24, 26, 28], minAngle: 70, maxAngle: 170, label: 'Right Knee' },
    ],
    phases: {
      down: { angle: 115, direction: 'below' },
      up: { angle: 140, direction: 'above' },
    },
    primaryAngleLandmarks: [24, 26, 28],
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
    side: 'right',
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
    ],
    phases: {
      down: { angle: 55, direction: 'above' },
      up: { angle: 45, direction: 'below' },
    },
    primaryAngleLandmarks: [24, 12, 16],
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
    side: 'right',
  },
  {
    id: 'knee-extensions',
    name: 'Knee Extensions',
    description: 'Controlled extension to reinforce knee joint and quadriceps.',
    icon: 'Footprints',
    targetReps: 12,
    targetSets: 3,
    jointAngles: [
      { landmarks: [24, 26, 28], minAngle: 70, maxAngle: 170, label: 'Right Knee' },
    ],
    phases: {
      down: { angle: 135, direction: 'above' },
      up: { angle: 115, direction: 'below' },
    },
    primaryAngleLandmarks: [24, 26, 28],
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
    side: 'right',
  },
];

// Initial reducer state
export const INITIAL_STATE = {
  screen: 'home',
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
  sessionHistory: [],
  isMuted: false,
  restTime: 30,
  cameraError: null,
};
