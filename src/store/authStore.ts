// src/store/authStore.ts

import { create } from "zustand";
import { User as FirebaseUser } from "firebase/auth";

interface AuthState {
  firebaseUser: FirebaseUser | null;
  initialized: boolean;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setInitialized: (init: boolean) => void;
  initAuthListener: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  initialized: false,
  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setInitialized: (init) => set({ initialized: init }),
  initAuthListener: () => {
    // Single authoritative auth initialization is managed in useStore.ts
    return () => {};
  },
}));

