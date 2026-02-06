import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PhotoRef {
  id: string;
  url: string;
}

export interface SideEffect {
  description: string;
  severity?: "mild" | "moderate" | "severe";
  photos: string[];
}

export interface PendingZone {
  patientId: string;
  patientName: string;
  patientZoneId: string;
  zoneName: string;
  sessionNumber: number;
  totalSessions: number;
  typeLaser: string;
  spotSize?: string;
  fluence?: string;
  pulseDurationMs?: string;
  frequencyHz?: string;
}

export interface ActiveSession {
  praticienId: string;
  praticienName: string;
  patientId: string;
  patientName: string;
  patientZoneId: string;
  zoneName: string;
  sessionNumber: number;
  totalSessions: number;
  typeLaser: string;
  spotSize?: string;
  fluence?: string;
  pulseDurationMs?: string;
  frequencyHz?: string;
  startedAt: number;
  pausedAt?: number;
  totalPausedTime: number;
  isPaused: boolean;
  notes: string;
  photos: PhotoRef[];
  voiceNotes: string[];
  sideEffects: SideEffect[];
  tolerance?: string;
  frequence?: string;
  effetsImmediats?: string;
  queueEntryId?: string;
}

interface SessionState {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  activeSessions: Record<string, ActiveSession>;
  pendingZones: Record<string, PendingZone[]>;
  setPendingZones: (praticienId: string, zones: PendingZone[]) => void;
  popNextZone: (praticienId: string) => PendingZone | null;
  clearPendingZones: (praticienId: string) => void;
  startSession: (
    praticienId: string,
    praticienName: string,
    session: Omit<
      ActiveSession,
      | "praticienId"
      | "praticienName"
      | "startedAt"
      | "totalPausedTime"
      | "isPaused"
      | "notes"
      | "photos"
      | "voiceNotes"
    >,
  ) => void;
  getSession: (praticienId: string) => ActiveSession | null;
  getAllSessions: () => ActiveSession[];
  getSessionByPatient: (patientId: string) => ActiveSession | null;
  togglePause: (praticienId: string) => void;
  addNote: (praticienId: string, note: string) => void;
  addPhoto: (praticienId: string, photo: PhotoRef) => void;
  removePhoto: (praticienId: string, photoId: string) => void;
  addVoiceNote: (praticienId: string, voiceNote: string) => void;
  addSideEffect: (praticienId: string, sideEffect: SideEffect) => void;
  endSession: (
    praticienId: string,
  ) => { session: ActiveSession; durationSeconds: number } | null;
  clearSession: (praticienId: string) => void;
  getElapsedSeconds: (praticienId: string) => number;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      activeSessions: {},
      pendingZones: {},

      setPendingZones: (praticienId, zones) => {
        set((state) => ({
          pendingZones: { ...state.pendingZones, [praticienId]: zones },
        }));
      },

      popNextZone: (praticienId) => {
        const zones = get().pendingZones[praticienId];
        if (!zones || zones.length === 0) return null;
        const [next, ...rest] = zones;
        set((state) => ({
          pendingZones: { ...state.pendingZones, [praticienId]: rest },
        }));
        return next!;
      },

      clearPendingZones: (praticienId) => {
        set((state) => {
          const { [praticienId]: _, ...rest } = state.pendingZones;
          return { pendingZones: rest };
        });
      },

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

      removePhoto: (praticienId, photoId) => {
        const session = get().activeSessions[praticienId];
        if (!session) return;
        set((state) => ({
          activeSessions: {
            ...state.activeSessions,
            [praticienId]: {
              ...session,
              photos: session.photos.filter((p) => p.id !== photoId),
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

        let elapsed =
          Date.now() - session.startedAt - session.totalPausedTime;

        if (session.isPaused && session.pausedAt) {
          elapsed -= Date.now() - session.pausedAt;
        }

        return Math.floor(elapsed / 1000);
      },
    }),
    {
      name: "sessions-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
