// src/hooks/useAuth.ts

import { useAuthStore } from "../store/authStore";
import { useUserStore } from "../store/userStore";

export function useAuth() {
  const { firebaseUser, initialized } = useAuthStore();
  const { user, loading, backendError, fetchUser, resetProgress, deleteAccount } = useUserStore();

  return {
    firebaseUser,
    user,
    isAuthenticated: Boolean(firebaseUser),
    initialized,
    loading,
    backendError,
    fetchUser,
    resetProgress,
    deleteAccount,
  };
}
