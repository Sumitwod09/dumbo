# 🐘 Dumbo — Private 2-User Native Mobile Application

**Dumbo** is a premium, private 2-user native mobile application crafted specifically for paired partners (*Kirti Chaudhari* & *Sumit Wod*). It acts as an intimate digital sanctuary providing real-time 1-on-1 messaging, synchronized music playback, live collaborative doodle drawing, joint Pomodoro focus timers, and mutual daily hydration tracking — all powered by a **100% Offline-First Native Mobile Architecture**.

---

## 📱 Mobile Native Architecture & Core Capabilities

### 1. ⚡ 100% Offline-First Mobile Engine & Automatic Re-Sync
- **Local Persistence Storage**: Uses an offline local storage engine (`storageEngine.ts`) caching chat messages, couple data, doodles, hydration logs, and pending actions.
- **Background Sync Queue**: When internet connectivity drops, outbound messages, photo uploads, hydration logs, and doodle saves are queued in `dumbo_offline_pending_queue`.
- **Automatic Reconnection Engine**: Upon regaining cellular data or Wi-Fi (`navigator.onLine` events), `syncEngine.ts` automatically flushes pending actions to Supabase sequentially without user intervention.

### 2. 📱 In-App Background Cellular SMS Fallback
- **Android Native Manifest Permissions**: Configured with `SEND_SMS`, `RECEIVE_SMS`, `READ_SMS`, and `INTERNET` inside `android/app/src/main/AndroidManifest.xml`.
- **Seamless SMS Transition**: Allows mobile users to continue sending and receiving messages via background cellular SMS when data connectivity is absent. Users **never leave the Dumbo app**.

### 3. 🔍 User Search, `@username` & Connection Gating
- **Unique `@username` Selection**: Each user selects a unique username (e.g. `@kirti`, `@sumit`, `@gaurai`) on their Profile screen with live availability checking.
- **User Search Bar**: Search registered accounts by `@username`, display name, or email.
- **Connection Request Flow**:
  - Clicking **`[ + Connect ]`** sends a pending partner invitation.
  - The recipient receives an **Incoming Connection Request** notification with **`[ Accept Connection ]`** and **`[ Decline ]`** controls.
- **Activity Gating**: Private Chat, Shared Music, Canvas Doodles, Focus Timer, and Hydration Tracker remain **strictly locked** until the invitation is accepted.

### 4. 💬 1-on-1 Private Chat & Native WebRTC Calls
- Real-time instant messaging with photo attachments and read receipts.
- Visual **Pending ⏳** sync badges on bubbles sent while offline.
- High-definition 1-on-1 WebRTC Video and Audio calling.

### 5. 🎵 Shared Audio Howler Player
- Persistent docked audio player allowing synchronized background music streaming between both paired users.
- Mutual track queue management, play/pause controls, and volume adjustments.

### 6. 🎨 Real-Time Collaborative Canvas
- Touch-optimized doodle canvas supporting multi-touch gestures, custom stroke colors, stroke width selectors, and direct doodle saves.

### 7. ⏱️ Joint Pomodoro Focus Timer & Hydration Tracker
- Shared 25-minute focus session timer with sound alerts and DND (Do Not Disturb) status indicators.
- Mutual daily water intake tracker (target: 2000ml each) with instant `+250ml` and `+500ml` quick-log buttons.

---

## 🎨 Mobile Navigation & Adaptive Aesthetics

- **Touch-Optimized Bottom Tab Bar**: Native mobile navigation tabs:
  - 🏠 **Home**: Live presence banner, partner DND toggle, activity shortcuts, and APK download card.
  - 🎵 **Music**: Synchronized audio queue & Howler playback.
  - 🎨 **Canvas**: Collaborative touch doodle drawing.
  - 💬 **Chat**: 1-on-1 private messaging and call launcher.
  - ⏱️ **Focus**: Shared Pomodoro focus session.
  - 💧 **Water**: Mutual daily hydration tracker.
  - 👤 **Profile**: Unique `@username` selection, display name settings, user search, partner request management, and pairing code.
- **Dynamic Time-Based Theme Engine**: Automatically transitions UI themes based on local device time:
  - 🌅 **Morning** (06:00 - 11:59): Warm Amber Sunburst
  - ☀️ **Day** (12:00 - 17:59): Sky Blue Gradient
  - 🌇 **Evening** (18:00 - 21:59): Rose Sunset Dusk
  - 🌃 **Night** (22:00 - 05:59): Indigo Twilight

---

## 🛠️ Mobile Tech Stack & Android Build Engine

| Component | Technology / Library |
| :--- | :--- |
| **Mobile Core Framework** | Next.js 14 + React 18 (App Router) |
| **Native Mobile Wrapper** | Capacitor 5 (`com.dumbo.app`) |
| **Android Build Engine** | Android Studio Gradle (AGP `8.2.2`, JDK 17, Compile SDK `34`) |
| **State Management** | Zustand (Offline-Persisted Stores) |
| **Realtime Backend** | Supabase PostgreSQL + Realtime Channels |
| **Authentication** | Clerk Auth (`@clerk/nextjs`) |
| **Audio Engine** | Howler.js |
| **Styling & Motion** | Tailwind CSS + Lucide Icons + Framer Motion |
| **CI/CD Mobile Pipeline** | GitHub Actions (`.github/workflows/android-apk.yml`) |

---

## 📦 Automated Mobile APK CI/CD Pipeline

Every code push to `main` triggers automated Android compilation on GitHub Actions:
1. Provisions Ubuntu CI runner with **JDK 17** & **Android SDK 34**.
2. Executes Capacitor sync: `npx cap sync android`.
3. Runs native Gradle compilation: `./gradlew assembleDebug`.
4. Publishes compiled **`dumbo-app-debug.apk`** artifact and releases on GitHub.
