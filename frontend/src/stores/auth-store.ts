"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

interface User {
  id: string;
  username: string;
  nom: string;
  prenom: string;
  role_id: string;
  role_nom: string;
  permissions: string[];
  box_id: string | null;
  box_nom: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  selectBox: (boxId: string) => Promise<void>;
  clearBox: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      await api.login(username, password);
      const user = await api.getCurrentUser();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } catch {
      // Clear state even if API call fails
    }
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  refreshUser: async () => {
    try {
      const user = await api.getCurrentUser();
      set({ user, isAuthenticated: true });
    } catch {
      set({ isAuthenticated: false, user: null });
    }
  },

  hasPermission: (permission: string) => {
    const user = get().user;
    if (!user) return false;
    return user.permissions.includes(permission);
  },

  selectBox: async (boxId: string) => {
    const result = await api.assignBox(boxId);
    const user = get().user;
    if (user) {
      set({ user: { ...user, box_id: result.box_id, box_nom: result.box_nom } });
    }
  },

  clearBox: async () => {
    await api.unassignBox();
    const user = get().user;
    if (user) {
      set({ user: { ...user, box_id: null, box_nom: null } });
    }
  },
}));
