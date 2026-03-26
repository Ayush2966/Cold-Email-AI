import { useCallback, useEffect, useState } from "react";
import { TOKEN_KEY } from "../constants/constants.js";
import { fetchMe } from "../services/api.js";

export function useAuth({ initialGmailConnected, onProfileHydrate }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(null);
  const [gmailConnected, setGmailConnected] = useState(initialGmailConnected);

  const persistToken = useCallback((nextToken) => {
    setToken(nextToken);
    if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken);
    else localStorage.removeItem(TOKEN_KEY);
  }, []);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMe(token);
        if (cancelled) return;
        setUser(data.user);
        setGmailConnected(data.gmailConnected);
        onProfileHydrate?.(data.user);
      } catch {
        persistToken("");
        setUser(null);
        setGmailConnected(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, persistToken, onProfileHydrate]);

  return {
    token,
    user,
    setUser,
    gmailConnected,
    setGmailConnected,
    persistToken,
  };
}
