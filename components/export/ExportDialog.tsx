"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useGoogleDrive } from "@/lib/hooks/useGoogleDrive";
import { exportBrews, downloadFile, getExportPreview } from "@/lib/services/exportService";
import { ExportFormat } from "@/lib/types/export";

// Icons
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

function LinkIcon({ className }: { className?: string }) {
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
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { uploadFile, isAuthorizing, isUploading } = useGoogleDrive();

  const [format, setFormat] = useState<ExportFormat>("json");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [brewCount, setBrewCount] = useState<number | null>(null);
  const [driveLink, setDriveLink] = useState<string | null>(null);

  // Get preview count when dates change
  useEffect(() => {
    if (!isOpen || !user) return;

    async function fetchPreview() {
      try {
        const preview = await getExportPreview(user!.uid, {
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        });
        setBrewCount(preview.brewCount);
      } catch (error) {
        console.error("Failed to get preview:", error);
      }
    }

    fetchPreview();
  }, [isOpen, user, startDate, endDate]);

  const handleDownload = async () => {
    if (!user) return;

    setIsExporting(true);

    try {
      const result = await exportBrews(user.uid, {
        format,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      downloadFile(result);

      toast({
        title: "Export complete!",
        description: `Downloaded ${result.filename}`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDriveExport = async () => {
    if (!user) return;

    setIsExporting(true);
    setDriveLink(null);

    try {
      const result = await exportBrews(user.uid, {
        format,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      const driveResult = await uploadFile(result);

      if (driveResult) {
        setDriveLink(driveResult.shareableLink);

        toast({
          title: "Uploaded to Drive!",
          description: "Your export is ready in Google Drive.",
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!driveLink) return;

    try {
      await navigator.clipboard.writeText(driveLink);
      toast({
        title: "Link copied!",
        description: "Drive link copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setDriveLink(null);
    onClose();
  };

  const isLoading = isExporting || isAuthorizing || isUploading;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Your Brews</DialogTitle>
          <DialogDescription>
            Download your brewing data or export to Google Drive.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Format</Label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormat("json")}
                className={`
                  flex-1 p-3 rounded-lg border-2 transition-colors
                  ${format === "json" ? "border-accent bg-accent/10" : "border-border"}
                `}
              >
                <div className="font-medium">JSON</div>
                <div className="text-xs text-muted-foreground">
                  Structured data
                </div>
              </button>
              <button
                onClick={() => setFormat("csv")}
                className={`
                  flex-1 p-3 rounded-lg border-2 transition-colors
                  ${format === "csv" ? "border-accent bg-accent/10" : "border-border"}
                `}
              >
                <div className="font-medium">CSV</div>
                <div className="text-xs text-muted-foreground">
                  Spreadsheet
                </div>
              </button>
            </div>
          </div>

          {/* Date Range (optional) */}
          <div className="space-y-2">
            <Label>Date Range (optional)</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start date"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End date"
              />
            </div>
          </div>

          {/* Preview */}
          {brewCount !== null && (
            <div className="p-3 rounded-lg bg-muted text-center">
              <span className="font-medium">{brewCount}</span>
              <span className="text-muted-foreground"> brews to export</span>
            </div>
          )}

          {/* Drive Link Result */}
          {driveLink && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckIcon className="w-5 h-5" />
                <span className="font-medium">Uploaded to Google Drive!</span>
              </div>
              <div className="flex gap-2">
                <Input
                  value={driveLink}
                  readOnly
                  className="text-sm"
                />
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  <LinkIcon className="w-4 h-4" />
                </Button>
              </div>
              <Button asChild variant="outline" className="w-full">
                <a href={driveLink} target="_blank" rel="noopener noreferrer">
                  Open in Drive
                </a>
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDownload}
              disabled={isLoading || brewCount === 0}
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              {isExporting && !isUploading ? "Exporting..." : "Download"}
            </Button>
            <Button
              className="flex-1"
              onClick={handleDriveExport}
              disabled={isLoading || brewCount === 0}
            >
              <DriveIcon className="w-4 h-4 mr-2" />
              {isAuthorizing
                ? "Authorizing..."
                : isUploading
                ? "Uploading..."
                : "Export to Drive"}
            </Button>
          </div>
          <Button variant="ghost" onClick={handleClose} className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
