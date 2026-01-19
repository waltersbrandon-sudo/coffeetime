"use client";

import { useState, useEffect, useMemo } from "react";
import { Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCoffees } from "@/lib/hooks/useCoffees";
import { useGrinders } from "@/lib/hooks/useGrinders";
import { useBrewers } from "@/lib/hooks/useBrewers";
import { useAuth } from "@/lib/context/AuthContext";
import { updateCoffeeTime } from "@/lib/services/brewLogService";
import { useToast } from "@/hooks/use-toast";
import { CoffeeTime } from "@/lib/types";

interface BrewEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  existingBrew: CoffeeTime;
}

function XIcon({ className }: { className?: string }) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

// Rating Component
interface RatingProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

function Rating({ value, onChange }: RatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onChange(value === num ? null : num)}
          className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
            value === num
              ? "bg-accent text-accent-foreground"
              : "bg-card border border-border hover:bg-card/80"
          }`}
        >
          {num}
        </button>
      ))}
    </div>
  );
}

export function BrewEditForm({ isOpen, onClose, existingBrew }: BrewEditFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { coffees } = useCoffees();
  const { grinders } = useGrinders();
  const { brewers } = useBrewers();

  const [saving, setSaving] = useState(false);

  // Equipment state
  const [coffeeId, setCoffeeId] = useState<string>("");
  const [grinderId, setGrinderId] = useState<string>("");
  const [brewerId, setBrewerId] = useState<string>("");

  // Date/Time state
  const [brewDateTime, setBrewDateTime] = useState<Date>(new Date());

  // Parameters state
  const [doseGrams, setDoseGrams] = useState<string>("");
  const [waterGrams, setWaterGrams] = useState<string>("");
  const [tempUnit, setTempUnit] = useState<"F" | "C">("F");
  const [waterTemp, setWaterTemp] = useState<string>("");
  const [grindSetting, setGrindSetting] = useState<string>("");
  const [tdsPercent, setTdsPercent] = useState<string>("");

  // Timing state
  const [bloomTimeSeconds, setBloomTimeSeconds] = useState<string>("");
  const [bloomWaterGrams, setBloomWaterGrams] = useState<string>("");
  const [totalTimeSeconds, setTotalTimeSeconds] = useState<string>("");

  // Notes state
  const [techniqueNotes, setTechniqueNotes] = useState<string>("");
  const [tastingNotes, setTastingNotes] = useState<string>("");
  const [rating, setRating] = useState<number | null>(null);

  // Initialize form with existing data
  useEffect(() => {
    if (existingBrew && isOpen) {
      setCoffeeId(existingBrew.coffeeId || "");
      setGrinderId(existingBrew.grinderId || "");
      setBrewerId(existingBrew.brewerId || "");
      setBrewDateTime(existingBrew.timestamp?.toDate() || new Date());
      setDoseGrams(existingBrew.doseGrams?.toString() || "");
      setWaterGrams(existingBrew.waterGrams?.toString() || "");
      setWaterTemp(existingBrew.waterTempF?.toString() || "");
      setTempUnit("F");
      setGrindSetting(existingBrew.grindSetting?.toString() || "");
      setTdsPercent(existingBrew.tdsPercent?.toString() || "");
      setBloomTimeSeconds(existingBrew.bloomTimeSeconds?.toString() || "");
      setBloomWaterGrams(existingBrew.bloomWaterGrams?.toString() || "");
      setTotalTimeSeconds(existingBrew.totalTimeSeconds?.toString() || "");
      setTechniqueNotes(existingBrew.techniqueNotes || "");
      setTastingNotes(existingBrew.tastingNotes || "");
      setRating(existingBrew.rating || null);
    }
  }, [existingBrew, isOpen]);

  // Calculate ratio
  const ratio = useMemo(() => {
    const dose = parseFloat(doseGrams);
    const water = parseFloat(waterGrams);
    if (dose > 0 && water > 0) {
      return `1:${(water / dose).toFixed(1)}`;
    }
    return null;
  }, [doseGrams, waterGrams]);

  const ratioValue = useMemo(() => {
    const dose = parseFloat(doseGrams);
    const water = parseFloat(waterGrams);
    if (dose > 0 && water > 0) {
      return water / dose;
    }
    return null;
  }, [doseGrams, waterGrams]);

  // Calculate extraction from TDS
  const extractionPercent = useMemo(() => {
    const tds = parseFloat(tdsPercent);
    const dose = parseFloat(doseGrams);
    const water = parseFloat(waterGrams);
    if (tds > 0 && dose > 0 && water > 0) {
      return ((tds * water) / dose).toFixed(1);
    }
    return null;
  }, [tdsPercent, doseGrams, waterGrams]);

  // Format date for datetime-local input
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helpers
  const toNullableNumber = (value: string): number | null => {
    const num = parseFloat(value);
    return isNaN(num) || num === 0 ? null : num;
  };

  const toNullableString = (value: string): string | null => {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      // Get denormalized names
      const selectedCoffee = coffees.find((c) => c.id === coffeeId);
      const selectedGrinder = grinders.find((g) => g.id === grinderId);
      const selectedBrewer = brewers.find((b) => b.id === brewerId);

      // Convert temperature to both units
      const tempValue = toNullableNumber(waterTemp);
      let waterTempF: number | null = null;
      let waterTempC: number | null = null;

      if (tempValue !== null) {
        if (tempUnit === "F") {
          waterTempF = tempValue;
          waterTempC = Math.round((tempValue - 32) * (5 / 9));
        } else {
          waterTempC = tempValue;
          waterTempF = Math.round(tempValue * (9 / 5) + 32);
        }
      }

      // Parse total time (handles mm:ss format)
      let totalTimeSecs: number | null = null;
      if (totalTimeSeconds) {
        if (totalTimeSeconds.includes(":")) {
          const [mins, secs] = totalTimeSeconds.split(":").map(Number);
          if (!isNaN(mins) && !isNaN(secs)) {
            totalTimeSecs = mins * 60 + secs;
          }
        } else {
          totalTimeSecs = toNullableNumber(totalTimeSeconds);
        }
      }

      const updates = {
        timestamp: Timestamp.fromDate(brewDateTime),
        coffeeId: coffeeId || null,
        coffeeName: selectedCoffee?.name || null,
        grinderId: grinderId || null,
        grinderName: selectedGrinder?.name || null,
        brewerId: brewerId || null,
        brewerName: selectedBrewer?.name || null,
        doseGrams: toNullableNumber(doseGrams),
        waterGrams: toNullableNumber(waterGrams),
        ratio: ratioValue,
        waterTempF,
        waterTempC,
        grindSetting: toNullableNumber(grindSetting),
        tdsPercent: toNullableNumber(tdsPercent),
        extractionPercent: extractionPercent ? parseFloat(extractionPercent) : null,
        bloomTimeSeconds: toNullableNumber(bloomTimeSeconds),
        bloomWaterGrams: toNullableNumber(bloomWaterGrams),
        totalTimeSeconds: totalTimeSecs,
        techniqueNotes: toNullableString(techniqueNotes),
        tastingNotes: toNullableString(tastingNotes),
        rating,
      };

      await updateCoffeeTime(user.uid, existingBrew.id, updates);

      toast({
        title: "Brew updated",
        description: "Your changes have been saved.",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update brew",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 rounded-lg hover:bg-accent/10 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Edit Brew</h1>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      {/* Form */}
      <div className="p-4 pb-8 space-y-6 overflow-y-auto max-h-[calc(100vh-64px)]">
        {/* Date/Time Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Date & Time
          </h2>
          <div className="space-y-2">
            <Label>When was this brew?</Label>
            <input
              type="datetime-local"
              value={formatDateTimeLocal(brewDateTime)}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                if (!isNaN(newDate.getTime())) {
                  setBrewDateTime(newDate);
                }
              }}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
            />
          </div>
        </section>

        {/* Equipment Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Equipment
          </h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Coffee</Label>
              <Select value={coffeeId} onValueChange={setCoffeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select coffee" />
                </SelectTrigger>
                <SelectContent>
                  {coffees.map((coffee) => (
                    <SelectItem key={coffee.id} value={coffee.id}>
                      {coffee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Grinder</Label>
              <Select value={grinderId} onValueChange={setGrinderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grinder" />
                </SelectTrigger>
                <SelectContent>
                  {grinders.map((grinder) => (
                    <SelectItem key={grinder.id} value={grinder.id}>
                      {grinder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Brewer</Label>
              <Select value={brewerId} onValueChange={setBrewerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brewer" />
                </SelectTrigger>
                <SelectContent>
                  {brewers.map((brewer) => (
                    <SelectItem key={brewer.id} value={brewer.id}>
                      {brewer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Parameters Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Parameters
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dose">Dose (g)</Label>
              <Input
                id="dose"
                type="number"
                step="0.1"
                value={doseGrams}
                onChange={(e) => setDoseGrams(e.target.value)}
                placeholder="18"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="water">Water (g)</Label>
              <Input
                id="water"
                type="number"
                step="1"
                value={waterGrams}
                onChange={(e) => setWaterGrams(e.target.value)}
                placeholder="300"
              />
            </div>
          </div>

          {/* Ratio Display */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
            <span className="text-sm text-muted-foreground">Ratio</span>
            <span className="font-mono font-medium">{ratio || "—"}</span>
          </div>

          {/* TDS & Extraction */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tds">TDS %</Label>
              <Input
                id="tds"
                type="number"
                step="0.01"
                value={tdsPercent}
                onChange={(e) => setTdsPercent(e.target.value)}
                placeholder="1.35"
              />
            </div>
            <div className="space-y-2">
              <Label>Extraction %</Label>
              <div className="flex items-center h-10 px-3 rounded-md bg-muted border border-border">
                <span className="font-mono text-sm">
                  {extractionPercent ? `${extractionPercent}%` : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="temp">Water Temp</Label>
                <button
                  type="button"
                  onClick={() => setTempUnit(tempUnit === "F" ? "C" : "F")}
                  className="text-xs text-accent hover:text-accent/80"
                >
                  °{tempUnit} → °{tempUnit === "F" ? "C" : "F"}
                </button>
              </div>
              <div className="relative">
                <Input
                  id="temp"
                  type="number"
                  value={waterTemp}
                  onChange={(e) => setWaterTemp(e.target.value)}
                  placeholder={tempUnit === "F" ? "205" : "96"}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  °{tempUnit}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grind">Grind Setting</Label>
              <Input
                id="grind"
                value={grindSetting}
                onChange={(e) => setGrindSetting(e.target.value)}
                placeholder="e.g., 24"
              />
            </div>
          </div>
        </section>

        {/* Timing Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Timing
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bloom Time (s)</Label>
              <Input
                type="number"
                value={bloomTimeSeconds}
                onChange={(e) => setBloomTimeSeconds(e.target.value)}
                placeholder="30"
              />
            </div>
            <div className="space-y-2">
              <Label>Bloom Water (g)</Label>
              <Input
                type="number"
                value={bloomWaterGrams}
                onChange={(e) => setBloomWaterGrams(e.target.value)}
                placeholder="50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Total Time</Label>
            <Input
              value={totalTimeSeconds}
              onChange={(e) => setTotalTimeSeconds(e.target.value)}
              placeholder="3:30 or 210"
            />
            <p className="text-xs text-muted-foreground">
              Enter as seconds (210) or mm:ss (3:30)
            </p>
          </div>
        </section>

        {/* Notes Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Notes
          </h2>

          <div className="space-y-2">
            <Label htmlFor="technique">Technique Notes</Label>
            <Textarea
              id="technique"
              value={techniqueNotes}
              onChange={(e) => setTechniqueNotes(e.target.value)}
              placeholder="Describe your pour technique, agitation, etc..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tasting">Tasting Notes</Label>
            <Textarea
              id="tasting"
              value={tastingNotes}
              onChange={(e) => setTastingNotes(e.target.value)}
              placeholder="What flavors did you taste?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Rating</Label>
            <Rating value={rating} onChange={setRating} />
          </div>
        </section>
      </div>
    </div>
  );
}
