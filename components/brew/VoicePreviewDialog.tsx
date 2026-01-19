"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ParseVoiceResult } from "@/lib/services/aiService";

export interface EditableParsedData {
  doseGrams?: number;
  waterGrams?: number;
  waterTempF?: number;
  grindSetting?: number;
  totalTimeSeconds?: number;
  tdsPercent?: number;
  rating?: number;
  techniqueNotes?: string;
  tastingNotes?: string;
  matchedCoffeeId?: string;
  matchedGrinderId?: string;
  matchedBrewerId?: string;
}

interface VoicePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ParseVoiceResult | null;
  onApply: (editedData: EditableParsedData) => void;
}

export function VoicePreviewDialog({
  open,
  onOpenChange,
  result,
  onApply,
}: VoicePreviewDialogProps) {
  // Editable state
  const [doseGrams, setDoseGrams] = useState<string>("");
  const [waterGrams, setWaterGrams] = useState<string>("");
  const [waterTempF, setWaterTempF] = useState<string>("");
  const [grindSetting, setGrindSetting] = useState<string>("");
  const [totalTime, setTotalTime] = useState<string>("");
  const [tdsPercent, setTdsPercent] = useState<string>("");
  const [rating, setRating] = useState<string>("");
  const [techniqueNotes, setTechniqueNotes] = useState<string>("");
  const [tastingNotes, setTastingNotes] = useState<string>("");

  // Initialize from result when it changes
  useEffect(() => {
    if (result) {
      const { parsed } = result;
      setDoseGrams(parsed.doseGrams?.toString() || "");
      setWaterGrams(parsed.waterGrams?.toString() || "");
      setWaterTempF(parsed.waterTempF?.toString() || "");
      setGrindSetting(parsed.grindSetting?.toString() || "");
      setTdsPercent(parsed.tdsPercent?.toString() || "");
      setRating(parsed.rating?.toString() || "");
      setTechniqueNotes(parsed.techniqueNotes || "");
      setTastingNotes(parsed.tastingNotes || "");

      // Format time as mm:ss
      if (parsed.totalTimeSeconds) {
        const mins = Math.floor(parsed.totalTimeSeconds / 60);
        const secs = parsed.totalTimeSeconds % 60;
        setTotalTime(mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : secs.toString());
      } else {
        setTotalTime("");
      }
    }
  }, [result]);

  if (!result) return null;

  const { matchedEquipment } = result;

  const parseTime = (input: string): number | undefined => {
    if (!input) return undefined;
    if (input.includes(":")) {
      const [mins, secs] = input.split(":").map(Number);
      if (!isNaN(mins) && !isNaN(secs)) {
        return mins * 60 + secs;
      }
    }
    const secs = parseInt(input, 10);
    return isNaN(secs) ? undefined : secs;
  };

  const handleApply = () => {
    const editedData: EditableParsedData = {};

    if (doseGrams) editedData.doseGrams = parseFloat(doseGrams);
    if (waterGrams) editedData.waterGrams = parseFloat(waterGrams);
    if (waterTempF) editedData.waterTempF = parseFloat(waterTempF);
    if (grindSetting) editedData.grindSetting = parseFloat(grindSetting);
    if (totalTime) editedData.totalTimeSeconds = parseTime(totalTime);
    if (tdsPercent) editedData.tdsPercent = parseFloat(tdsPercent);
    if (rating) editedData.rating = parseInt(rating, 10);
    if (techniqueNotes.trim()) editedData.techniqueNotes = techniqueNotes.trim();
    if (tastingNotes.trim()) editedData.tastingNotes = tastingNotes.trim();

    if (matchedEquipment.coffee) editedData.matchedCoffeeId = matchedEquipment.coffee.id;
    if (matchedEquipment.grinder) editedData.matchedGrinderId = matchedEquipment.grinder.id;
    if (matchedEquipment.brewer) editedData.matchedBrewerId = matchedEquipment.brewer.id;

    onApply(editedData);
  };

  const hasAnyData = doseGrams || waterGrams || waterTempF || grindSetting ||
    totalTime || rating || tastingNotes || techniqueNotes ||
    matchedEquipment.coffee || matchedEquipment.grinder || matchedEquipment.brewer;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
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
            Quick Brew Log
          </DialogTitle>
          <DialogDescription>
            Review and edit the values before adding to your log.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Equipment Matches (read-only display) */}
          {(matchedEquipment.coffee || matchedEquipment.grinder || matchedEquipment.brewer) && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Detected Equipment</Label>
              <div className="space-y-1">
                {matchedEquipment.coffee && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                    <span className="text-muted-foreground">Coffee</span>
                    <span className="font-medium">{matchedEquipment.coffee.name}</span>
                  </div>
                )}
                {matchedEquipment.grinder && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                    <span className="text-muted-foreground">Grinder</span>
                    <span className="font-medium">{matchedEquipment.grinder.name}</span>
                  </div>
                )}
                {matchedEquipment.brewer && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                    <span className="text-muted-foreground">Brewer</span>
                    <span className="font-medium">{matchedEquipment.brewer.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Editable Parameters */}
          <div className="space-y-3">
            <Label className="text-muted-foreground">Parameters</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="dose" className="text-xs">Dose (g)</Label>
                <Input
                  id="dose"
                  type="number"
                  step="0.1"
                  value={doseGrams}
                  onChange={(e) => setDoseGrams(e.target.value)}
                  placeholder="18"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="water" className="text-xs">Water (g)</Label>
                <Input
                  id="water"
                  type="number"
                  value={waterGrams}
                  onChange={(e) => setWaterGrams(e.target.value)}
                  placeholder="300"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="temp" className="text-xs">Temp (°F)</Label>
                <Input
                  id="temp"
                  type="number"
                  value={waterTempF}
                  onChange={(e) => setWaterTempF(e.target.value)}
                  placeholder="205"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="grind" className="text-xs">Grind Setting</Label>
                <Input
                  id="grind"
                  value={grindSetting}
                  onChange={(e) => setGrindSetting(e.target.value)}
                  placeholder="24"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="time" className="text-xs">Total Time</Label>
                <Input
                  id="time"
                  value={totalTime}
                  onChange={(e) => setTotalTime(e.target.value)}
                  placeholder="3:30"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tds" className="text-xs">TDS %</Label>
                <Input
                  id="tds"
                  type="number"
                  step="0.01"
                  value={tdsPercent}
                  onChange={(e) => setTdsPercent(e.target.value)}
                  placeholder="1.35"
                  className="h-9"
                />
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label htmlFor="rating" className="text-xs">Rating (1-10)</Label>
            <Input
              id="rating"
              type="number"
              min="1"
              max="10"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="8"
              className="h-9"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="technique" className="text-xs">Technique Notes</Label>
            <Textarea
              id="technique"
              value={techniqueNotes}
              onChange={(e) => setTechniqueNotes(e.target.value)}
              placeholder="Pour technique, agitation, etc..."
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tasting" className="text-xs">Tasting Notes</Label>
            <Textarea
              id="tasting"
              value={tastingNotes}
              onChange={(e) => setTastingNotes(e.target.value)}
              placeholder="Flavor notes, acidity, body..."
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!hasAnyData}>
            Add to Log
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
