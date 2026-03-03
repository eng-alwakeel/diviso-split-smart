import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trackGAEvent } from "@/hooks/useGoogleAnalytics";

const DISMISSED_KEY = "google_one_tap_dismissed_at";
const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const SHOW_DELAY_MS = 3000; // 3 seconds

interface UseGoogleOneTapOptions {
  enabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          cancel: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

function wasDismissedRecently(): boolean {
  const dismissed = localStorage.getItem(DISMISSED_KEY);
  if (!dismissed) return false;
  const elapsed = Date.now() - parseInt(dismissed, 10);
  return elapsed < DISMISS_COOLDOWN_MS;
}

export function useGoogleOneTap({ enabled = true, onSuccess, onError }: UseGoogleOneTapOptions = {}) {
  const scriptLoadedRef = useRef(false);
  const initializedRef = useRef(false);

  const handleCredentialResponse = useCallback(async (response: any) => {
    try {
      console.log("[OneTap] one_tap_success - credential received");
      trackGAEvent("one_tap_success");

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.credential,
      });

      if (error) {
        console.error("[OneTap] one_tap_failed - Supabase error:", error.message);
        trackGAEvent("one_tap_failed", { reason: error.message });
        onError?.(error.message);
        return;
      }

      console.log("[OneTap] Sign-in successful");
      onSuccess?.();
    } catch (err: any) {
      console.error("[OneTap] one_tap_failed:", err.message);
      trackGAEvent("one_tap_failed", { reason: err.message });
      onError?.(err.message);
    }
  }, [onSuccess, onError]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !enabled) return;

    // Don't show if dismissed recently
    if (wasDismissedRecently()) {
      console.log("[OneTap] Skipped - dismissed within 24h");
      return;
    }

    const loadAndInit = () => {
      if (initializedRef.current) return;

      // Load GSI script if not already loaded
      if (!scriptLoadedRef.current && !document.getElementById("google-gsi-script")) {
        const script = document.createElement("script");
        script.id = "google-gsi-script";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          scriptLoadedRef.current = true;
          initOneTap(clientId);
        };
        script.onerror = () => {
          console.warn("[OneTap] GSI script failed to load");
          trackGAEvent("one_tap_failed", { reason: "script_load_error" });
        };
        document.head.appendChild(script);
      } else if (window.google?.accounts) {
        scriptLoadedRef.current = true;
        initOneTap(clientId);
      }
    };

    const initOneTap = (clientId: string) => {
      if (initializedRef.current || !window.google?.accounts) return;
      initializedRef.current = true;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false, // Don't auto-select, let user choose
        cancel_on_tap_outside: true,
        itp_support: true, // Safari ITP support
      });

      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isDisplayed()) {
          console.log("[OneTap] one_tap_shown");
          trackGAEvent("one_tap_shown");
        }
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const reason = notification.getNotDisplayedReason?.() || notification.getSkippedReason?.() || "unknown";
          console.log("[OneTap] one_tap_not_displayed:", reason);
          trackGAEvent("one_tap_not_displayed", { reason });
        }
        if (notification.isDismissedMoment()) {
          console.log("[OneTap] one_tap_dismissed");
          trackGAEvent("one_tap_dismissed");
          localStorage.setItem(DISMISSED_KEY, Date.now().toString());
        }
      });
    };

    // Delay showing One Tap by 3 seconds
    const timer = setTimeout(loadAndInit, SHOW_DELAY_MS);

    return () => {
      clearTimeout(timer);
      if (window.google?.accounts) {
        try { window.google.accounts.id.cancel(); } catch {}
      }
    };
  }, [enabled, handleCredentialResponse]);
}
