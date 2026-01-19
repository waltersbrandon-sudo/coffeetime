"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type DeviceType = "ios" | "android" | "windows" | "mac" | "linux" | "unknown";
type BrowserType = "chrome" | "edge" | "firefox" | "safari" | "unknown";

function detectDevice(): DeviceType {
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|iphone|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/windows/.test(ua)) return "windows";
  if (/macintosh|mac os x/.test(ua)) return "mac";
  if (/linux/.test(ua)) return "linux";
  return "unknown";
}

function detectBrowser(): BrowserType {
  const ua = navigator.userAgent.toLowerCase();
  if (/edg/.test(ua)) return "edge";
  if (/chrome/.test(ua) && !/edg/.test(ua)) return "chrome";
  if (/firefox/.test(ua)) return "firefox";
  if (/safari/.test(ua) && !/chrome/.test(ua)) return "safari";
  return "unknown";
}

export function InstallButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [device, setDevice] = useState<DeviceType>("unknown");
  const [browser, setBrowser] = useState<BrowserType>("unknown");

  useEffect(() => {
    setDevice(detectDevice());
    setBrowser(detectBrowser());

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt (Chrome, Edge, Android)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Listen for successful install
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      // Use native install prompt
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setInstallPrompt(null);
      }
    } else {
      // Show manual instructions
      setShowInstructions(true);
    }
  };

  const supportsNativeInstall = !!installPrompt;

  const getInstructions = () => {
    if (device === "ios") {
      return {
        title: "Install on iOS",
        steps: [
          "Tap the Share button at the bottom of Safari",
          "Scroll down and tap \"Add to Home Screen\"",
          "Tap \"Add\" in the top right corner",
        ],
        icon: <ShareIcon className="w-5 h-5" />,
      };
    }

    if (device === "android" && browser === "firefox") {
      return {
        title: "Install on Android (Firefox)",
        steps: [
          "Tap the menu button (⋮) in the top right",
          "Tap \"Install\"",
          "Confirm by tapping \"Add\"",
        ],
        icon: <MenuIcon className="w-5 h-5" />,
      };
    }

    if (device === "mac" && browser === "safari") {
      return {
        title: "Install on Mac (Safari)",
        steps: [
          "Click File in the menu bar",
          "Click \"Add to Dock...\"",
          "Click \"Add\" to confirm",
        ],
        icon: <MenuIcon className="w-5 h-5" />,
      };
    }

    if (browser === "firefox") {
      return {
        title: "Install on Desktop (Firefox)",
        steps: [
          "Firefox doesn't support PWA installation directly",
          "Try opening this site in Chrome or Edge for the best experience",
          "Or bookmark this page for quick access",
        ],
        icon: <InfoIcon className="w-5 h-5" />,
      };
    }

    // Generic Chrome/Edge desktop
    return {
      title: "Install on Desktop",
      steps: [
        "Click the install icon in the address bar (⊕)",
        "Or click the menu (⋮) → \"Install CoffeeTime...\"",
        "Click \"Install\" to confirm",
      ],
      icon: <DownloadIcon className="w-5 h-5" />,
    };
  };

  if (isInstalled) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
        <div className="p-2 rounded-full bg-green-500/20">
          <CheckIcon className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <p className="font-medium text-green-600 dark:text-green-400">App Installed</p>
          <p className="text-sm text-muted-foreground">CoffeeTime is on your home screen</p>
        </div>
      </div>
    );
  }

  const instructions = getInstructions();

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-accent/20 to-accent/10 border-2 border-accent/30 hover:border-accent/50 hover:from-accent/30 hover:to-accent/20 transition-all group"
      >
        <div className="p-3 rounded-xl bg-accent/20 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-all">
          <DownloadIcon className="w-6 h-6" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-lg">Add to Home Screen</p>
          <p className="text-sm text-muted-foreground">
            {supportsNativeInstall
              ? "Install for quick access & offline use"
              : `Get instructions for ${device === "ios" ? "iOS" : device === "android" ? "Android" : "your device"}`}
          </p>
        </div>
        <ChevronRightIcon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
      </button>

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {instructions.icon}
              {instructions.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <ol className="space-y-3">
              {instructions.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/20 text-accent text-sm font-medium shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <Button onClick={() => setShowInstructions(false)} className="w-full">
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" x2="12" y1="2" y2="15" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
