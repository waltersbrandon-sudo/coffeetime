"use client";

import Link from "next/link";
import { UserCircleMembership } from "@/lib/types/circles";

// Icons
function UsersIcon({ className }: { className?: string }) {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

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

interface CircleCardProps {
  membership: UserCircleMembership;
}

export function CircleCard({ membership }: CircleCardProps) {
  const roleLabels = {
    admin: "Admin",
    contributor: "Contributor",
    viewer: "Viewer",
  };

  return (
    <Link
      href={`/circles/${membership.id}`}
      className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:bg-card/80 transition-colors"
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10 text-accent">
        <UsersIcon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{membership.circleName}</p>
        <p className="text-sm text-muted-foreground">
          {roleLabels[membership.role]}
        </p>
      </div>
      <ChevronRightIcon className="w-5 h-5 text-muted-foreground" />
    </Link>
  );
}
