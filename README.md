# VIZO — AI-Powered Physical Therapy Copilot

<div align="center">
  <img src="https://img.shields.io/badge/AI-Physical_Therapy-4edea3?style=for-the-badge&logo=mediamarkt&logoColor=white" alt="AI PT" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/MediaPipe-007ACC?style=for-the-badge&logo=google&logoColor=white" alt="MediaPipe" />
  <img src="https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
</div>

---

## 🌟 Overview

**VIZO** is a premium, real-time physical therapy assistant designed to guide users through rehabilitation and strengthening exercises with medical-grade precision. Using advanced Computer Vision via **MediaPipe Pose Landmarker**, VIZO tracks skeletal movement directly in the browser to provide instant form correction, rep counting, and performance analytics.

With **Dynamic Side Detection**, VIZO automatically identifies which limb you are using, eliminating the need for manual configuration and ensuring a seamless workout experience.

---

## ✨ Key Features

- **🛡️ Real-time Form Scoring**: proprietary algorithm calculates a 0-100% score for every repetition based on joint angles and stability.
- **🔄 Snappy Rep Counting**: Hybrid state-machine logic with 4° hysteresis for high-precision movement detection.
- **🌓 Dynamic Side Detection**: Intelligent visibility sensing automatically tracks either the left or right side based on camera orientation.
- **🔈 Audio Coaching**: Real-time Text-to-Speech (TTS) guidance for corrections like "Keep your elbows tucked" or "Slow down."
- **📊 Performance Analytics**: Detailed post-session summaries featuring form accuracy trends and rep-by-rep breakdowns via Recharts.
- **🌑 Obsidian Kinetic UI**: A state-of-the-art dark mode interface with glassmorphism effects and smooth micro-animations.
- **💾 Persistence**: Full session history and user settings persist across sessions using localized storage.

---

## 🏗️ Technical Workflow

### 1. Vision Engine
VIZO utilizes the **MediaPipe Pose Landmarker (WASM)** to extract 33 3D skeletal landmarks from the device's camera feed at ~30-60 FPS.

### 2. Geometric Analysis
For each exercise, VIZO calculates specific joint angles (e.g., Elbow Flexion for Curls, Knee Extension for Squats) using 3-point vector trigonometry:
```javascript
Angle(A, B, C) = arccos((BA·BC) / (|BA|*|BC|))
```

### 3. State Machine Counting
Reps are counted using a dual-phase state machine:
- **Phase UP**: User enters the "target" zone (e.g., Squat depth).
- **Phase DOWN**: User returns to the starting position.
- **Logic**: Reps only increment once both phases are successfully traversed with a minimum hold duration to prevent false positives.

### 4. Compensation Detection
Real-time checks for common biomechanical errors:
- **Elbow Flare**: Tracking shoulder-to-elbow lateral deviation.
- **Shoulder Shrug**: Monitoring vertical displacement of the acromion.
- **Knee Cave**: Checking inter-patellar distance relative to hip width.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0 or higher
- **Browser**: Chrome/Edge/Safari (Camera access required)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/[your-repo]/VIZO.git
   cd VIZO
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the development server:
   ```bash
   npm run dev
   ```

---

## 🏋️ Exercise Library

| Exercise | Primary Joint | Focus |
| :--- | :--- | :--- |
| **Bicep Curls** | Elbow | Muscle Hypertrophy & Stability |
| **Squats** | Hip/Knee | Functional Lower Body Strength |
| **Shoulder Press** | Shoulder | Overhead Mobility & Power |
| **Lunges** | Knee | Balance & Unilateral Strength |
| **Lateral Raises** | Shoulder | Scapular Rhythm & Deltoid Control |
| **Knee Extensions** | Knee | Patellar Tracking & Quad Reinforcement |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS v4 (Custom Obsidian Kinetic Theme)
- **AI/ML**: Google MediaPipe Pose (WASM)
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: React `useReducer` + `Context API`

---

## 📜 License
*Project created for Personal/Educational purposes. Built by [Your Name].*
