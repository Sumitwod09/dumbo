# Dumbo Application Change Log

All modifications, additions, and deletions made to the project are tracked in this document to support easy audit and reversion.

---

## Initial Setup & Architecture - [2026-07-29]

### 1. Project Configuration Files
- **Files Created**:
  - `changes.md`: Change tracking log.
  - `package.json`: Project manifest with Next.js, React 18, Tailwind CSS, Zustand, Howler.js, Lucide icons, Supabase client dependencies.
  - `tsconfig.json`: TypeScript compiler options and alias resolution (`@/*`).
  - `next.config.js`: Next.js static export (`output: "export"`, `unoptimized: true`) configuration per TRD 2.6.
  - `postcss.config.js`: PostCSS pipeline for Tailwind CSS and Autoprefixer.
  - `tailwind.config.js`: Tailwind theme tokens, dark mode class setup, and color palettes.

### 2. TypeScript Types & Supabase Database Schema
- **Files Created**:
  - `src/types/index.ts`: TypeScript interfaces for Couple, UserProfile, Song, ChatMessage, HydrationLog, SavedDoodle, PomodoroSession, CanvasStroke.
  - `src/lib/supabase/schema.sql`: Full PostgreSQL DDL script with 6 core tables (`couples`, `users`, `songs`, `chat_messages`, `hydration_logs`, `saved_doodles`) and 2-user `couple_id` Row Level Security (RLS) policies.
  - `src/lib/supabase/client.ts`: Supabase client instantiation.
  - `src/lib/mock/mockData.ts`: Pre-populated mock data for couple, streaming tracks, chat thread, hydration history, and doodles.

### 3. Audio & State Management Stores (Zustand)
- **Files Created**:
  - `src/lib/audio/howler-instance.ts`: Howler.js manager using progressive `html5: true` streaming mode per TRD 2.5.
  - `src/stores/useAudioStore.ts`: Audio state store managing queue, current track, play/pause, seek, volume, and Howler bindings.
  - `src/stores/useTimerStore.ts`: Joint Pomodoro countdown timer store (focus & break phases).
  - `src/stores/useThemeStore.ts`: Dynamic time-of-day theme engine store (Morning, Day, Evening, Night).
  - `src/stores/useCoupleStore.ts`: Persona switcher (Alex 🌸 / Sam 💫), pairing code, DND status store.
  - `src/stores/useChatStore.ts`: Real-time chat messages, photo attachments, read receipts, and WebRTC video call state.
  - `src/stores/useHydrationStore.ts`: Water intake logs, progress calculator, and hourly alert triggers.
  - `src/stores/useCanvasStore.ts`: Stroke state, brush properties, undo history, and saved doodle gallery store.

### 4. Component Shell & Page Routes
- **Files Created**:
  - `src/app/globals.css`: Global Tailwind CSS rules and theme variables.
  - `src/app/layout.tsx`: Root layout mounting `AppShell`.
  - `src/components/shell/AppShell.tsx`: Mobile-first layout with sticky bottom nav (`h-16`) and docked audio drawer (`bottom-16`) with `pb-32` content area.
  - `src/components/shell/TopHeader.tsx`: Partner presence, DND badge, theme indicator, and pairing code modal.
  - `src/components/shell/DockedAudioPlayer.tsx`: Docked mini player above bottom navbar with full-screen queue modal.
  - `src/app/page.tsx`: Home Dashboard overview.
  - `src/app/music/page.tsx`: Shared music player queue & song upload page.
  - `src/app/canvas/page.tsx`: Collaborative stroke drawing canvas & saved doodle gallery.
  - `src/app/chat/page.tsx`: Text messaging, photo attachments, read receipts, and WebRTC call overlay.
  - `src/app/focus/page.tsx`: Joint Pomodoro focus timer & DND toggle banner.
  - `src/app/hydration/page.tsx`: Hydration check-in tracker & hourly reminder system.
