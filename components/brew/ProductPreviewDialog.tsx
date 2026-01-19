"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AnalyzeImageResult } from "@/lib/services/aiService";

interface ProductPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: AnalyzeImageResult | null;
  productType: "coffee" | "grinder" | "brewer";
  onApply: () => void;
}

export function ProductPreviewDialog({
  open,
  onOpenChange,
  result,
  productType,
  onApply,
}: ProductPreviewDialogProps) {
  if (!result) return null;

  const { detected, barcode, confidence, sources } = result;

  const getProductTitle = () => {
    switch (productType) {
      case "coffee":
        return "Detected Coffee";
      case "grinder":
        return "Detected Grinder";
      case "brewer":
        return "Detected Brewer";
    }
  };

  const hasAnyData =
    detected.brand ||
    detected.model ||
    detected.roaster ||
    detected.origin ||
    detected.manufacturer;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-purple-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
            {getProductTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Confidence Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Confidence:</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  confidence >= 0.7
                    ? "bg-green-500"
                    : confidence >= 0.4
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium">
              {Math.round(confidence * 100)}%
            </span>
          </div>

          {/* Detected Information */}
          {hasAnyData ? (
            <div className="space-y-2">
              {productType === "coffee" && (
                <>
                  {(detected.roaster || detected.brand) && (
                    <div className="p-3 bg-muted rounded-md">
                      <span className="text-xs text-muted-foreground block mb-1">
                        Roaster / Brand
                      </span>
                      <p className="font-medium">
                        {detected.roaster || detected.brand}
                      </p>
                    </div>
                  )}
                  {detected.model && (
                    <div className="p-3 bg-muted rounded-md">
                      <span className="text-xs text-muted-foreground block mb-1">
                        Coffee Name
                      </span>
                      <p className="font-medium">{detected.model}</p>
                    </div>
                  )}
                  {detected.origin && (
                    <div className="p-3 bg-muted rounded-md">
                      <span className="text-xs text-muted-foreground block mb-1">
                        Origin
                      </span>
                      <p className="font-medium">{detected.origin}</p>
                    </div>
                  )}
                  {detected.roastLevel && (
                    <div className="p-3 bg-muted rounded-md">
                      <span className="text-xs text-muted-foreground block mb-1">
                        Roast Level
                      </span>
                      <p className="font-medium capitalize">{detected.roastLevel}</p>
                    </div>
                  )}
                  {detected.flavorNotes && detected.flavorNotes.length > 0 && (
                    <div className="p-3 bg-muted rounded-md">
                      <span className="text-xs text-muted-foreground block mb-1">
                        Flavor Notes
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {detected.flavorNotes.map((note, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs bg-background rounded-full"
                          >
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {productType === "grinder" && (
                <>
                  {(detected.manufacturer || detected.brand) && (
                    <div className="p-3 bg-muted rounded-md">
                      <span className="text-xs text-muted-foreground block mb-1">
                        Brand
                      </span>
                      <p className="font-medium">
                        {detected.manufacturer || detected.brand}
                      </p>
                    </div>
                  )}
                  {detected.model && (
                    <div className="p-3 bg-muted rounded-md">
                      <span className="text-xs text-muted-foreground block mb-1">
                        Model
                      </span>
                      <p className="font-medium">{detected.model}</p>
                    </div>
                  )}
                  {detected.burrType && (
                    <div className="p-3 bg-muted rounded-md">
                      <span className="text-xs text-muted-foreground block mb-1">
                        Burr Type
                      </span>
                      <p className="font-medium">{detected.burrType}</p>
                    </div>
                  )}
                </>
              )}

              {productType === "brewer" && (
                <>
                  {(detected.manufacturer || detected.brand) && (
                    <div className="p-3 bg-muted rounded-md">
                      <span className="text-xs text-muted-foreground block mb-1">
                        Brand
                      </span>
                      <p className="font-medium">
                        {detected.manufacturer || detected.brand}
                      </p>
                    </div>
                  )}
                  {detected.model && (
                    <div className="p-3 bg-muted rounded-md">
                      <span className="text-xs text-muted-foreground block mb-1">
                        Model
                      </span>
                      <p className="font-medium">{detected.model}</p>
                    </div>
                  )}
                  {detected.brewMethod && (
                    <div className="p-3 bg-muted rounded-md">
                      <span className="text-xs text-muted-foreground block mb-1">
                        Brew Method
                      </span>
                      <p className="font-medium capitalize">{detected.brewMethod}</p>
                    </div>
                  )}
                </>
              )}

              {barcode && (
                <div className="p-3 bg-muted rounded-md">
                  <span className="text-xs text-muted-foreground block mb-1">
                    Barcode
                  </span>
                  <p className="font-mono text-sm">{barcode}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">
                Could not detect product information. Try a clearer photo with
                visible labels or branding.
              </p>
            </div>
          )}

          {/* Sources */}
          {sources && sources.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <span>Detected from: </span>
              {sources.join(", ")}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onApply} disabled={!hasAnyData}>
            Add Equipment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
