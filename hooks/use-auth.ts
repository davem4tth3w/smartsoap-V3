import { useFirebaseAuth } from "@/lib/firebase-auth-context";

type UseAuthOptions = {
  autoFetch?: boolean; // kept for compatibility, no longer used
};

export function useAuth(_options?: UseAuthOptions) {
  const {
    user,
    isSignedIn,
    isLoading,
    signIn,
    signUp,
    signOut,
  } = useFirebaseAuth();

  return {
    user,
    loading: isLoading,
    isAuthenticated: isSignedIn,

    // 🔁 Map old names → Firebase functions
    login: signIn,
    signup: signUp,
    logout: signOut,

    // 🧹 No longer needed but kept so nothing breaks
    refresh: async () => {},
    error: null,
  };
}