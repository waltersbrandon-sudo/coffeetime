"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExportDialog } from "@/components/export/ExportDialog";

// Icons
function ChevronLeftIcon({ className }: { className?: string }) {
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
      <path d="m15 18-6-6 6-6" />
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

function FileJsonIcon({ className }: { className?: string }) {
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
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1" />
      <path d="M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1" />
    </svg>
  );
}

function TableIcon({ className }: { className?: string }) {
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
      <path d="M12 3v18" />
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
    </svg>
  );
}

function DriveIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M4.433 22l3.49-6.042H22l-3.49 6.042H4.433z" />
      <path d="M8.073 2l7.033 12.181H1.04L8.073 2z" />
      <path d="M15.96 8.181L22.993 20.362 19.503 22l-7.033-12.181 3.49-1.638z" />
    </svg>
  );
}

export default function ExportPage() {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  return (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="p-2 -ml-2 rounded-lg hover:bg-accent/10 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold">Export Data</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Description */}
        <div className="space-y-2">
          <p className="text-muted-foreground">
            Export your brewing data for backup, analysis, or sharing.
            Choose your format and destination.
          </p>
        </div>

        {/* Export Options */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Export Formats</h2>

          <div className="grid gap-4">
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <FileJsonIcon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-medium">JSON</h3>
                  <p className="text-sm text-muted-foreground">
                    Structured data format. Best for developers, importing
                    into other apps, or keeping a complete backup.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <TableIcon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-medium">CSV</h3>
                  <p className="text-sm text-muted-foreground">
                    Spreadsheet format. Opens in Excel, Google Sheets, or
                    Numbers for analysis and charts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Destinations */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Export Destinations</h2>

          <div className="grid gap-4">
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <DownloadIcon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-medium">Download</h3>
                  <p className="text-sm text-muted-foreground">
                    Download directly to your device. Quick and simple.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <DriveIcon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-medium">Google Drive</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload to your Google Drive. Creates a shareable link
                    you can send to others.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Export Button */}
        <Button
          size="lg"
          className="w-full"
          onClick={() => setIsExportDialogOpen(true)}
        >
          <DownloadIcon className="w-5 h-5 mr-2" />
          Export My Data
        </Button>

        {/* Info */}
        <div className="p-4 rounded-lg bg-muted">
          <h3 className="font-medium mb-2">What's included?</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>All your brew logs with timestamps</li>
            <li>Equipment names and settings</li>
            <li>Brew parameters (dose, water, temp, grind)</li>
            <li>Timing data (bloom, total time)</li>
            <li>Your notes and ratings</li>
          </ul>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
      />
    </main>
  );
}
