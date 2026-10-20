import { useCallback, useEffect, useState } from "react";
import { adminApi } from "./adminApi";

/**
 * useAdminSession.js
 * Verifies admin session with server (GET /api/admin/me).
 * status: "loading" | "ok" | "error" (triggers onUnauthorized() on 401/403)
 */
export default function useAdminSession(onUnauthorized) {
  const [state, setState] = useState({ status: "loading", user: null, error: "" });

  const check = useCallback(async () => {
    setState({ status: "loading", user: null, error: "" });
    try {
      const { user } = await adminApi.me();
      setState({ status: "ok", user, error: "" });
    } catch (err) {
      if (err.status === 401 || err.status === 403) onUnauthorized();
      else setState({ status: "error", user: null, error: err.message });
    }
  }, [onUnauthorized]);

  useEffect(() => {
    check();
  }, [check]);

  return { ...state, retry: check };
}
