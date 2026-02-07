import { useState, useEffect, useCallback, useMemo } from "react";

// Custom event type for beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "diviso_install_dismissed";

function getIsIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function getIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

function getIsSafariOnIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const webkit = /WebKit/.test(ua);
  const notChrome = !/CriOS/.test(ua);
  const notFirefox = !/FxiOS/.test(ua);
  return iOS && webkit && notChrome && notFirefox;
}

function getIsInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // Detect common in-app browsers: WhatsApp, Instagram, Facebook, Line, Twitter
  return /FBAN|FBAV|Instagram|Line|Twitter|Snapchat|WhatsApp/i.test(ua);
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const isIOS = useMemo(() => getIsIOS(), []);
  const isSafariOnIOS = useMemo(() => getIsSafariOnIOS(), []);
  const isInAppBrowser = useMemo(() => getIsInAppBrowser(), []);

  useEffect(() => {
    // Check standalone mode
    setIsInstalled(getIsStandalone());

    // Check localStorage
    try {
      setIsDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {}

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const canPrompt = !!deferredPrompt;

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === "accepted";
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setIsDismissed(true);
  }, []);

  // Should the install widget be visible?
  const shouldShow = !isInstalled && !isDismissed;

  return {
    isIOS,
    isSafariOnIOS,
    isInAppBrowser,
    isInstalled,
    isDismissed,
    canPrompt,
    shouldShow,
    triggerInstall,
    dismiss,
  };
}
