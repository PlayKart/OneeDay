// src/store/authStore.ts

import { create } from "zustand";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ firebaseUser: user, initialized: true });
    });
    return unsubscribe;
  },
}));
