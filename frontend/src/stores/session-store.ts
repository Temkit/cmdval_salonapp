"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SideEffect {
  description: string;
  severity?: "mild" | "moderate" | "severe";
  photos: string[]; // base64 or URLs
}

export interface ActiveSession {
  // Practitioner info
  praticienId: string;
  praticienName: string;
  // Patient info
  patientId: string;
  patientName: string;
  // Zone info
  patientZoneId: string;
  zoneName: string;
  sessionNumber: number;
  totalSessions: number;
  // Optiskin laser parameters
  typeLaser: string;
  spotSize?: string;
  fluence?: string;
  pulseDurationMs?: string;
  frequencyHz?: string;
  // Session state
  startedAt: number; // timestamp
  pausedAt?: number; // timestamp when paused
  totalPausedTime: number; // accumulated pause time in ms
  isPaused: boolean;
  // Capture
  notes: string;
  photos: string[]; // base64 or URLs
  voiceNotes: string[]; // base64 or URLs
  // Side effects
  sideEffects: SideEffect[];
  // Additional
  tolerance?: string;
}

interface SessionState {
  // Hydration state for SSR
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  // Sessions keyed by practitioner ID
  activeSessions: Record<string, ActiveSession>;

  // Start a new session for a practitioner
  startSession: (
    praticienId: string,
    praticienName: string,
    session: Omit<ActiveSession, "praticienId" | "praticienName" | "startedAt" | "totalPausedTime" | "isPaused" | "notes" | "photos" | "voiceNotes">
  ) => void;

  // Get session for a practitioner
  getSession: (praticienId: string) => ActiveSession | null;

  // Get all active sessions
  getAllSessions: () => ActiveSession[];

  // Get session by patient ID (to check if patient has active session)
  getSessionByPatient: (patientId: string) => ActiveSession | null;

  // Pause/resume
  togglePause: (praticienId: string) => void;

  // Add notes/photos
  addNote: (praticienId: string, note: string) => void;
  addPhoto: (praticienId: string, photo: string) => void;
  addVoiceNote: (praticienId: string, voiceNote: string) => void;
  addSideEffect: (praticienId: string, sideEffect: SideEffect) => void;

  // End session and get data
  endSession: (praticienId: string) => { session: ActiveSession; durationSeconds: number } | null;

  // Clear without saving
  clearSession: (praticienId: string) => void;

  // Get elapsed time for a practitioner
  getElapsedSeconds: (praticienId: string) => number;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      activeSessions: {},

      startSession: (praticienId, praticienName, sessionData) => {
        set((state) => ({
          activeSessions: {
            ...state.activeSessions,
            [praticienId]: {
              ...sessionData,
              praticienId,
              praticienName,
              startedAt: Date.now(),
              totalPausedTime: 0,
              isPaused: false,
              notes: "",
              photos: [],
              voiceNotes: [],
              sideEffects: [],
            },
          },
        }));
      },

      getSession: (praticienId) => {
        return get().activeSessions[praticienId] || null;
      },

      getAllSessions: () => {
        return Object.values(get().activeSessions);
      },

      getSessionByPatient: (patientId) => {
        const sessions = Object.values(get().activeSessions);
        return sessions.find((s) => s.patientId === patientId) || null;
      },

      togglePause: (praticienId) => {
        const session = get().activeSessions[praticienId];
        if (!session) return;

        if (session.isPaused && session.pausedAt) {
          // Resuming - add paused duration to total
          const pauseDuration = Date.now() - session.pausedAt;
          set((state) => ({
            activeSessions: {
              ...state.activeSessions,
              [praticienId]: {
                ...session,
                isPaused: false,
                pausedAt: undefined,
                totalPausedTime: session.totalPausedTime + pauseDuration,
              },
            },
          }));
        } else {
          // Pausing
          set((state) => ({
            activeSessions: {
              ...state.activeSessions,
              [praticienId]: {
                ...session,
                isPaused: true,
                pausedAt: Date.now(),
              },
            },
          }));
        }
      },

      addNote: (praticienId, note) => {
        const session = get().activeSessions[praticienId];
        if (!session) return;
        set((state) => ({
          activeSessions: {
            ...state.activeSessions,
            [praticienId]: {
              ...session,
              notes: session.notes ? `${session.notes}\n${note}` : note,
            },
          },
        }));
      },

      addPhoto: (praticienId, photo) => {
        const session = get().activeSessions[praticienId];
        if (!session) return;
        set((state) => ({
          activeSessions: {
            ...state.activeSessions,
            [praticienId]: {
              ...session,
              photos: [...session.photos, photo],
            },
          },
        }));
      },

      addVoiceNote: (praticienId, voiceNote) => {
        const session = get().activeSessions[praticienId];
        if (!session) return;
        set((state) => ({
          activeSessions: {
            ...state.activeSessions,
            [praticienId]: {
              ...session,
              voiceNotes: [...session.voiceNotes, voiceNote],
            },
          },
        }));
      },

      addSideEffect: (praticienId, sideEffect) => {
        const session = get().activeSessions[praticienId];
        if (!session) return;
        set((state) => ({
          activeSessions: {
            ...state.activeSessions,
            [praticienId]: {
              ...session,
              sideEffects: [...session.sideEffects, sideEffect],
            },
          },
        }));
      },

      endSession: (praticienId) => {
        const session = get().activeSessions[praticienId];
        if (!session) return null;

        const durationSeconds = get().getElapsedSeconds(praticienId);
        const result = { session, durationSeconds };

        set((state) => {
          const { [praticienId]: _, ...rest } = state.activeSessions;
          return { activeSessions: rest };
        });

        return result;
      },

      clearSession: (praticienId) => {
        set((state) => {
          const { [praticienId]: _, ...rest } = state.activeSessions;
          return { activeSessions: rest };
        });
      },

      getElapsedSeconds: (praticienId) => {
        const session = get().activeSessions[praticienId];
        if (!session) return 0;

        let elapsed = Date.now() - session.startedAt - session.totalPausedTime;

        // If currently paused, subtract current pause duration
        if (session.isPaused && session.pausedAt) {
          elapsed -= (Date.now() - session.pausedAt);
        }

        return Math.floor(elapsed / 1000);
      },
    }),
    {
      name: "sessions-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
