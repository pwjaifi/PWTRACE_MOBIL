import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

export type LoginResult =
  | { success: true; user: AuthUser }
  | { success: false; reason: "invalid_credentials" | "account_disabled" | "network_error" };

const AUTH_STORAGE_KEY = "greenhouse_auth_user";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch {
        // Session restore failed silently
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  async function login(email: string, password: string): Promise<LoginResult> {
    // ─────────────────────────────────────────────
    // API integration point — replace with real API call:
    // const response = await ApiService.login(email, password);
    // Handle response: success, invalid credentials, account disabled, network error
    // ─────────────────────────────────────────────

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Placeholder: simulate account disabled
    if (email.toLowerCase() === "disabled@example.com") {
      return { success: false, reason: "account_disabled" };
    }

    // Placeholder: simulate invalid credentials
    if (!email.includes("@") || password.length < 3) {
      return { success: false, reason: "invalid_credentials" };
    }

    // Placeholder: simulate successful login
    const loggedInUser: AuthUser = {
      id: "user-001",
      name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
      role: "Technicien",
    };

    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return { success: true, user: loggedInUser };
  }

  async function logout(): Promise<void> {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
