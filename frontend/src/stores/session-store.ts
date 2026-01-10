"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ActiveSession {
  // Patient info
  patientId: string;
  patientName: string;
  // Zone info
  patientZoneId: string;
  zoneName: string;
  sessionNumber: number;
  totalSessions: number;
  // Laser parameters
  typeLaser: string;
  fluence?: string;
  spotSize?: string;
  frequence?: string;
  dureeImpulsion?: string;
  // Session state
  startedAt: number; // timestamp
  pausedAt?: number; // timestamp when paused
  totalPausedTime: number; // accumulated pause time in ms
  isPaused: boolean;
  // Capture
  notes: string;
  photos: string[]; // base64 or URLs
  voiceNotes: string[]; // base64 or URLs
  // Additional
  tolerance?: string;
  effetsImmediats?: string;
}

interface SessionState {
  activeSession: ActiveSession | null;

  // Start a new session
  startSession: (session: Omit<ActiveSession, "startedAt" | "totalPausedTime" | "isPaused" | "notes" | "photos" | "voiceNotes">) => void;

  // Pause/resume
  togglePause: () => void;

  // Add notes/photos
  addNote: (note: string) => void;
  addPhoto: (photo: string) => void;
  addVoiceNote: (voiceNote: string) => void;

  // End session and get data
  endSession: () => { session: ActiveSession; durationSeconds: number } | null;

  // Clear without saving
  clearSession: () => void;

  // Get elapsed time
  getElapsedSeconds: () => number;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      activeSession: null,

      startSession: (sessionData) => {
        set({
          activeSession: {
            ...sessionData,
            startedAt: Date.now(),
            totalPausedTime: 0,
            isPaused: false,
            notes: "",
            photos: [],
            voiceNotes: [],
          },
        });
      },

      togglePause: () => {
        const session = get().activeSession;
        if (!session) return;

        if (session.isPaused && session.pausedAt) {
          // Resuming - add paused duration to total
          const pauseDuration = Date.now() - session.pausedAt;
          set({
            activeSession: {
              ...session,
              isPaused: false,
              pausedAt: undefined,
              totalPausedTime: session.totalPausedTime + pauseDuration,
            },
          });
        } else {
          // Pausing
          set({
            activeSession: {
              ...session,
              isPaused: true,
              pausedAt: Date.now(),
            },
          });
        }
      },

      addNote: (note) => {
        const session = get().activeSession;
        if (!session) return;
        set({
          activeSession: {
            ...session,
            notes: session.notes ? `${session.notes}\n${note}` : note,
          },
        });
      },

      addPhoto: (photo) => {
        const session = get().activeSession;
        if (!session) return;
        set({
          activeSession: {
            ...session,
            photos: [...session.photos, photo],
          },
        });
      },

      addVoiceNote: (voiceNote) => {
        const session = get().activeSession;
        if (!session) return;
        set({
          activeSession: {
            ...session,
            voiceNotes: [...session.voiceNotes, voiceNote],
          },
        });
      },

      endSession: () => {
        const session = get().activeSession;
        if (!session) return null;

        const durationSeconds = get().getElapsedSeconds();
        const result = { session, durationSeconds };

        set({ activeSession: null });
        return result;
      },

      clearSession: () => {
        set({ activeSession: null });
      },

      getElapsedSeconds: () => {
        const session = get().activeSession;
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
      name: "session-storage",
    }
  )
);
