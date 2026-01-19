"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/AuthContext";
import { signOutUser } from "@/lib/firebase/auth";
import { useCurrentUserProfile } from "@/lib/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}


function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { profile, loading: profileLoading, setPublic } = useCurrentUserProfile();
  const [copied, setCopied] = useState(false);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);

  const handleCopyCode = async () => {
    if (!profile?.profileCode) return;

    try {
      await navigator.clipboard.writeText(profile.profileCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Profile code copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Please copy the code manually.",
        variant: "destructive",
      });
    }
  };

  const handleTogglePublic = async () => {
    if (!profile) return;

    setIsTogglingPublic(true);
    try {
      await setPublic(!profile.isPublic);
      toast({
        title: profile.isPublic ? "Profile now private" : "Profile now public",
        description: profile.isPublic
          ? "Your brews are no longer visible to followers."
          : "Your followers can now see your brews in their feed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update visibility.",
        variant: "destructive",
      });
    } finally {
      setIsTogglingPublic(false);
    }
  };

  return (
    <main className="p-6 pb-24 space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || "Profile"}
              className="w-14 h-14 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-xl font-semibold text-accent">
                {user?.displayName?.[0] || user?.email?.[0] || "?"}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">
              {user?.displayName || "Coffee Lover"}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Profile Code */}
        {!profileLoading && profile && (
          <div className="p-4 rounded-lg bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Profile Code</p>
                <p className="text-2xl font-mono font-bold tracking-widest">
                  {profile.profileCode}
                </p>
              </div>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
              >
                {copied ? (
                  <CheckIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <CopyIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this code with friends so they can follow you.
            </p>

            {/* Public toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <p className="text-sm font-medium">Public Profile</p>
                <p className="text-xs text-muted-foreground">
                  {profile.isPublic
                    ? "Followers can see your brews"
                    : "Your brews are private"}
                </p>
              </div>
              <button
                onClick={handleTogglePublic}
                disabled={isTogglingPublic}
                className={`
                  relative w-12 h-6 rounded-full transition-colors
                  ${profile.isPublic ? "bg-accent" : "bg-muted"}
                  ${isTogglingPublic ? "opacity-50" : ""}
                `}
              >
                <span
                  className={`
                    absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                    ${profile.isPublic ? "left-7" : "left-1"}
                  `}
                />
              </button>
            </div>
          </div>
        )}

        <Button
          onClick={signOutUser}
          variant="outline"
          className="w-full"
        >
          Sign out
        </Button>
      </section>

      {/* AI Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-muted-foreground">
          AI Features
        </h2>

        <div className="space-y-3">
          <Link
            href="/settings/ai"
            className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border border-purple-500/30 hover:bg-card/80 transition-colors"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium">AI Settings</p>
              <p className="text-sm text-muted-foreground">
                Configure AI providers and API keys
              </p>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>
      </section>

      {/* Data Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-muted-foreground">
          Data
        </h2>

        <div className="space-y-3">
          <Link
            href="/settings/export"
            className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:bg-card/80 transition-colors"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 text-accent">
              <DownloadIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Export Data</p>
              <p className="text-sm text-muted-foreground">
                Download or export to Google Drive
              </p>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>
      </section>
    </main>
  );
}
