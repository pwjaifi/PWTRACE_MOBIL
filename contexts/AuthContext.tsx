import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { ApiService } from "@/services/ApiService";
import { storage, StorageHelper } from "@/lib/storage";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  categories: string[];
  affectations: {
    farmId: string;
    secteurId: string;
    serreId: string;
  }[];
  affectationsCompteurs?: {
    farmId: string;
    compteurId: string;
  }[];
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

  // Session restore using StorageHelper
  useEffect(() => {
    async function restoreSession() {
      try {
        const stored = await StorageHelper.getObject<AuthUser>(AUTH_STORAGE_KEY);
        if (stored) {
          setUser(stored);
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
    try {
      const result = await ApiService.login(email, password);

      if (result.token && result.user) {
        console.log("[AuthContext] Login successful. User data:", JSON.stringify(result.user, null, 2));

        const loggedInUser: AuthUser = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          categories: result.user.categories || [],
          affectations: result.user.affectations || [],
          affectationsCompteurs: result.user.affectationsCompteurs || [],
        };

        // Persistent storage
        await StorageHelper.setObject(AUTH_STORAGE_KEY, loggedInUser);
        await StorageHelper.setString("auth_token", result.token);

        setUser(loggedInUser);
        return { success: true, user: loggedInUser };
      }

      return { success: false, reason: "invalid_credentials" };
    } catch (error: any) {
      console.error("Login error:", error);

      if (error.message?.toLowerCase().includes("credentials") || error.message?.toLowerCase().includes("unauthorized")) {
        return { success: false, reason: "invalid_credentials" };
      }
      if (error.message?.toLowerCase().includes("disabled")) {
        return { success: false, reason: "account_disabled" };
      }

      return { success: false, reason: "network_error" };
    }
  }

  async function logout(): Promise<void> {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      await StorageHelper.delete(AUTH_STORAGE_KEY);
      await StorageHelper.delete("auth_token");
      setUser(null);
    }
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
