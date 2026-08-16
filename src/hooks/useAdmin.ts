import { useState, useCallback, useEffect } from "react";
import { ADMIN_API_BASE, ADMIN_ENABLED, ADMIN_ENDPOINTS } from "../config/adminConfig";

// We store ONLY a short-lived, server-signed session token — never the
// password. sessionStorage clears when the tab closes. The token is
// re-validated against the Worker on load, and the Worker rejects it once
// it expires. The frontend cannot forge it.
const TOKEN_KEY = "picksaw_admin_token";

function readToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable
  }
}

/**
 * Fetch helper for protected admin operations. Attaches the session token
 * as a Bearer credential. The Worker MUST verify it server-side before
 * performing any create/edit/delete. A frontend `isAdmin` flag is NOT
 * authorization — this token is.
 */
export function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = readToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${ADMIN_API_BASE}${path}`, { ...init, headers });
}

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);

  // On mount, if we have a stored token, verify it with the Worker.
  useEffect(() => {
    if (!ADMIN_ENABLED) return;
    const token = readToken();
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch(ADMIN_ENDPOINTS.verify, { method: "GET" });
        const data = (await res.json().catch(() => ({}))) as { success?: boolean };
        if (!cancelled) {
          if (res.ok && data.success) {
            setIsAdmin(true);
          } else {
            writeToken(null);
            setIsAdmin(false);
          }
        }
      } catch {
        if (!cancelled) {
          // Network error — treat as not authenticated but keep token to retry.
          setIsAdmin(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (password: string): Promise<boolean> => {
    if (!ADMIN_ENABLED) return false;
    try {
      const res = await fetch(`${ADMIN_API_BASE}${ADMIN_ENDPOINTS.login}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        token?: string;
      };
      if (res.ok && data.success && data.token) {
        writeToken(data.token);
        setIsAdmin(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    const token = readToken();
    writeToken(null);
    setIsAdmin(false);
    // Best-effort server notify (stateless; safe to ignore failures).
    if (token) {
      fetch(`${ADMIN_API_BASE}${ADMIN_ENDPOINTS.logout}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }, []);

  return { isAdmin, login, logout, adminEnabled: ADMIN_ENABLED };
}
