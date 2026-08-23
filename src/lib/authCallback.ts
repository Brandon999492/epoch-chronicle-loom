import { supabase } from "@/integrations/supabase/client";

/**
 * Handles the OAuth redirect callback (Apple / Google).
 *
 * On mobile and on any non-iframed page load, `lovable.auth.signInWithOAuth`
 * performs a FULL PAGE REDIRECT to the OAuth broker. The broker sends the user
 * back to `redirect_uri` with the Supabase tokens appended to the URL
 * (query string or hash). Nothing consumed those tokens before, so the user
 * came back to the site still signed out. This module consumes them and
 * establishes the Supabase session.
 */

const NEXT_KEY = "oauth:next";
const LOG = "[auth-callback]";

export function rememberOAuthNext(path: string) {
  try {
    if (path.startsWith("/") && !path.startsWith("//")) {
      sessionStorage.setItem(NEXT_KEY, path);
    }
  } catch {
    /* storage unavailable */
  }
}

export function takeOAuthNext(): string | null {
  try {
    const v = sessionStorage.getItem(NEXT_KEY);
    sessionStorage.removeItem(NEXT_KEY);
    return v && v.startsWith("/") && !v.startsWith("//") ? v : null;
  } catch {
    return null;
  }
}

type Parsed = {
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

function readParams(): { found: Parsed; clean: () => void } | null {
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  const query = url.searchParams;

  const pick = (k: string) => hash.get(k) ?? query.get(k) ?? undefined;

  const found: Parsed = {
    access_token: pick("access_token"),
    refresh_token: pick("refresh_token"),
    error: pick("error") ?? pick("error_code") ?? undefined,
    error_description: pick("error_description") ?? undefined,
  };

  if (!found.access_token && !found.error) return null;

  const clean = () => {
    for (const k of [
      "access_token",
      "refresh_token",
      "expires_in",
      "expires_at",
      "token_type",
      "provider_token",
      "provider_refresh_token",
      "state",
      "code",
      "error",
      "error_code",
      "error_description",
    ]) {
      query.delete(k);
    }
    const cleaned =
      url.pathname + (query.toString() ? `?${query.toString()}` : "");
    window.history.replaceState({}, document.title, cleaned);
  };

  return { found, clean };
}

/**
 * Returns an error message when the callback failed, otherwise null.
 * Safe to call on every app boot — it no-ops when there is no callback data.
 */
export async function consumeOAuthCallback(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const parsed = readParams();
  if (!parsed) return null;

  const { found, clean } = parsed;

  if (found.error) {
    const msg = found.error_description || found.error || "Sign-in failed";
    console.error(LOG, "provider returned an error:", msg);
    clean();
    return msg;
  }

  if (!found.access_token || !found.refresh_token) {
    console.error(LOG, "callback missing tokens", {
      hasAccess: !!found.access_token,
      hasRefresh: !!found.refresh_token,
    });
    clean();
    return "Sign-in did not return a complete session. Please try again.";
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: found.access_token,
    refresh_token: found.refresh_token,
  });

  clean();

  if (error || !data.session) {
    console.error(LOG, "setSession failed:", error?.message);
    return error?.message ?? "Could not establish a session. Please try again.";
  }

  console.info(LOG, "session established for", data.session.user.email ?? data.session.user.id);
  return null;
}
