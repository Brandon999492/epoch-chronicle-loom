import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type AuthorizationDetails = {
  client?: { name?: string; logo_uri?: string; client_uri?: string };
  scopes?: string[];
  redirect_url?: string;
  redirect_to?: string;
};

// Typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthAPI = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
};
const oauth = (supabase.auth as unknown as { oauth: OAuthAPI }).oauth;

export default function OAuthConsentPage() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const { user, loading } = useAuth();
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    let active = true;
    (async () => {
      if (!authorizationId) return setError("Missing authorization_id");
      if (!user) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId, user, loading]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      return setError(error.message);
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError("No redirect returned by the authorization server.");
    }
    window.location.href = target;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card-gradient border border-border rounded-xl p-8 shadow-dramatic">
        {error ? (
          <>
            <h1 className="text-xl font-display font-bold text-foreground mb-2">Authorization error</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </>
        ) : !details ? (
          <p className="text-sm text-muted-foreground">Loading authorization…</p>
        ) : (
          <>
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              Connect {details.client?.name ?? "an app"} to Epoch Chronicle
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              This will let {details.client?.name ?? "the app"} act as you — reading your notes, bookmarks,
              and searching the archive on your behalf.
            </p>
            <div className="flex gap-3">
              <button
                disabled={busy}
                onClick={() => decide(true)}
                className="flex-1 rounded-lg bg-primary text-primary-foreground py-3 font-medium disabled:opacity-50"
              >
                Approve
              </button>
              <button
                disabled={busy}
                onClick={() => decide(false)}
                className="flex-1 rounded-lg bg-secondary text-foreground py-3 font-medium disabled:opacity-50"
              >
                Deny
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
