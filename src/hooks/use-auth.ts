import { useEffect, useState } from "react";
import { getSession, login as apiLogin, logout as apiLogout } from "@/lib/api";

export type SessionUser = {
  user: string;
  full_name?: string;
  roles?: string[];
  role_type?: string;
  company?: string;
  is_manager?: boolean;
  available_pages?: string[];
  dashboard_method?: string;
  branding?: {
    brand_name: string;
    brand_subtitle: string;
    logo: string | null;
    primary_color: string;
    secondary_color: string;
  };
};

export function useAuth() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getSession()
      .then((s) => {
        if (!cancelled) setSession(s);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  async function login(username: string, password: string) {
    await apiLogin(username, password);
    const s = await getSession();
    setSession(s);
  }

  async function logout() {
    await apiLogout();
    setSession(null);
  }

  async function refreshSession() {
    setLoading(true);
    try {
      const s = await getSession();
      setSession(s);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }

  return { session, loading, login, logout, refreshSession };
}
