Build a complete AI-powered physical therapy web app from an empty repository. The app uses the device camera with MediaPipe Pose Landmarker for real-time skeletal tracking to guide users through PT exercises with form scoring, rep counting, compensation detection, and audio coaching. All app logic lives in a single App.jsx file within a Vite + React project.
Project Structure
AI-Physiotherapy/
├── index.html # Entry point, loads MediaPipe CDN
├── package.json # Vite + React + Tailwind v4 + Recharts + Lucide
├── vite.config.js # Vite config with @tailwindcss/vite plugin
├── src/
│ ├── main.jsx # React DOM render entry
│ ├── index.css # @import "tailwindcss" + custom styles
│ └── App.jsx # ALL app logic (~2500-3000 lines)
└── README.md # Project documentation
Implementation Steps
Step 1: Scaffold Vite + React Project

Create package.json with dependencies: react, react-dom, recharts, lucide-react, tailwindcss, @tailwindcss/vite, @vitejs/plugin-react, vite
Create vite.config.js with React + Tailwind plugins
Create index.html with <script> tag for MediaPipe CDN (vision_bundle.js)
Create src/main.jsx (standard React DOM render)
Create src/index.css with @import "tailwindcss" + custom keyframe animations (pulse, confetti, slide-in)
Run npm install

Step 2: Exercise Configuration Data
Define 6 exercises in App.jsx as a constant array, each with:

id, name, description, icon (lucide icon name), targetReps, targetSets
jointAngles: array of { landmarks: [A, B, C], minAngle, maxAngle, label } — defines which 3 landmarks form the angle to track
phases: { down: { angle: <threshold>, direction: 'below'|'above' }, up: { angle: <threshold>, direction: 'above'|'below' } } — for rep counting state machine
compensationRules: array of { id, name, check: (landmarks) => bool, message: string } — functions that detect cheating
side: 'left' | 'right' | 'both' — which side of body

MediaPipe Landmark Indices used:

11/12: Left/Right Shoulder
13/14: Left/Right Elbow
15/16: Left/Right Wrist
23/24: Left/Right Hip
25/26: Left/Right Knee
27/28: Left/Right Ankle

Step 3: App State Architecture
Use useReducer for session state with actions:

SELECT_EXERCISE, CUSTOMIZE_SETS_REPS, START_SESSION
COUNT_REP (with form score), COMPLETE_SET, START_REST, END_REST
END_SESSION, RESET
ADD_COMPENSATION (log detected compensations)

State shape:
js{
screen: 'home' | 'exercise' | 'rest' | 'summary',
selectedExercise: null | exerciseConfig,
customReps: 12, customSets: 3,
currentSet: 0, currentRep: 0,
repScores: [], // form scores per rep in current set
setHistory: [], // array of { repScores, compensations, avgScore }
compensationLog: [], // { ruleId, message, timestamp }
streak: 0, bestStreak: 0, bestAvgScore: 0,
sessionHistory: [], // for progress charts
isMuted: false
}
Use useRef for:

videoRef, canvasRef — DOM elements
poseLandmarkerRef — MediaPipe instance
animFrameRef — requestAnimationFrame ID
repPhaseRef — current rep phase ('idle' | 'down' | 'up')
lastCompensationTimeRef — throttle map for audio cues
frameScoresRef — rolling window of per-frame form scores

Step 4: MediaPipe Initialization & Camera Setup

initPoseLandmarker(): Use FilesetResolver.forVisionTasks(CDN_WASM_URL) then PoseLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: LITE_MODEL_URL, delegate: 'GPU' }, runningMode: 'VIDEO', numPoses: 1 })
startCamera(): navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 } }) — handle permission denial with user-friendly message
Detection loop via requestAnimationFrame: call poseLandmarker.detectForVideo(video, timestamp) each frame, process results

Step 5: Skeleton Drawing & Visualization

drawSkeleton(landmarks, canvas, ctx):

Clear canvas, set ctx.translate(canvas.width, 0); ctx.scale(-1, 1) for mirror effect
Draw connections (lines between connected landmarks) in semi-transparent white
Draw landmark dots: compute form quality per joint, color green/yellow/red
Landmark connections array defines which landmarks connect (MediaPipe standard)

Step 6: Angle Calculation Utilities
Pure functions:

calculateAngle(a, b, c) — given 3 {x,y} points, return angle at point b in degrees using Math.atan2
getFormScore(landmarks, exercise) — compute 0-100% based on how well current angles match exercise config ranges
normalizeScore(angle, min, max) — maps angle to 0-100 within expected range

Step 7: Rep Counting State Machine

Track phase in repPhaseRef: 'idle' → 'down' → 'up' → increment rep
Each frame, compute primary joint angle from exercise config
Phase transitions:

idle → down: angle crosses DOWN threshold
down → up: angle crosses UP threshold → rep counted, compute rep score from rolling frame scores

Hysteresis: require angle to pass threshold by 5° margin before allowing transition
Debounce: minimum 300ms between phase transitions

Step 8: Compensation Detection System
Each frame during exercise:

Iterate exercise's compensationRules
Each rule's check(landmarks) returns true if compensation detected
If detected:

Flash visual warning banner (slide-in from top, auto-dismiss after 3s)
Trigger speech synthesis cue (throttled: max once per 4s per rule via lastCompensationTimeRef)
Log to compensationLog in state

Example rules:

Bicep Curl elbow flare: |elbow.x - hip.x| > threshold
Squat knee cave: |leftKnee.x - rightKnee.x| < |leftHip.x - rightHip.x| \* 0.7
Shoulder abduction trunk tilt: |shoulder.y - hip.y| lateral deviation check

Step 9: Audio Coach (Web Speech API)

speak(text, priority) function using window.speechSynthesis
Priority queue: corrections > rep counts > encouragement
Announcements:

Rep counted: "Rep {n} of {total}"
Compensation: specific correction message
Set complete: "Great set! Rest for 30 seconds"
Session complete: summary with grade

Mute toggle in UI updates isMuted state

Step 10: UI Screens
Home Screen (exercise selector):

Header with gradient text logo "AI Physio Copilot"
Grid of exercise cards (3x2): icon, name, description, target badges
Selected card gets indigo ring + gradient border
Set/rep customization sliders below selection
"Start Session" button (gradient, large)

Exercise Screen (during workout):

Full-width video canvas with skeleton overlay (mirrored)
Glass-morphism floating panels:

Top-left: Exercise name + set/rep counter (large text)
Top-right: Form Quality gauge (animated gradient bar 0-100%)
Bottom-center: Compensation alert banner (slide-in, warning colors)

Mute button, Stop button overlaid

Rest Screen:

Countdown timer (large, centered, circular progress)
Last set scorecard: rep-by-rep scores in a grid
Motivational message
"Skip Rest" button

Summary Screen:

Session grade badge (A/B/C/D with color)
Stat cards: total reps, avg form score, exercises completed, best streak
Compensation frequency table
Recharts LineChart: form score per rep across session
Recharts BarChart: average score per set
"New Session" button
Progress history chart (if multiple sessions in state)

Step 11: Gamification

Streak counter: increment on reps with >80% form, reset on <80%
Personal bests: track in state — highest streak, best avg form score per exercise
Celebrations:

Confetti CSS animation when completing set with avg >85%
Pulsing glow effect on rep counter when on a streak >3
Subtle chime sound effect (optional, using AudioContext oscillator)

Step 12: Progress Charts (Recharts)

LineChart for form score trend across reps in session
BarChart for average score per set
AreaChart for session-over-session progress (stored in component state array)
Use indigo/violet color scheme matching the UI

Verification

npm install completes without errors
npm run dev starts the dev server
Camera permission prompt appears and webcam feed displays
Skeleton overlay draws on the canvas (mirrored)
Selecting an exercise and starting → rep counting works with form scoring
Compensation detection triggers visual + audio warnings
Set completion → rest timer → next set flow works
Session summary shows scores, charts, and grade
Audio coach speaks rep counts and corrections (when unmuted)
