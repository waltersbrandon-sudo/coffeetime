"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SmartEquipmentSelect } from "@/components/brew/SmartEquipmentSelect";
import { VoiceInputButton } from "@/components/brew/VoiceInputButton";
import { VoicePreviewDialog, EditableParsedData } from "@/components/brew/VoicePreviewDialog";
import { TextInputButton } from "@/components/brew/TextInputButton";
import { PhotoCaptureButton } from "@/components/brew/PhotoCaptureButton";
import { ProductPreviewDialog } from "@/components/brew/ProductPreviewDialog";
import { useCoffees } from "@/lib/hooks/useCoffees";
import { useGrinders } from "@/lib/hooks/useGrinders";
import { useBrewers } from "@/lib/hooks/useBrewers";
import { addCoffee } from "@/lib/services/coffeeService";
import { addGrinder } from "@/lib/services/grinderService";
import { addBrewer } from "@/lib/services/brewerService";
import { useEquipmentStats } from "@/lib/hooks/useEquipmentStats";
import { useAuth } from "@/lib/context/AuthContext";
import { addCoffeeTime } from "@/lib/services/brewLogService";
import { useToast } from "@/hooks/use-toast";
import { ParseVoiceResult, AnalyzeImageResult, AIConfig } from "@/lib/services/aiService";
import { getAISettings } from "@/lib/services/aiSettingsService";

// Icons
function ChevronDownIcon({ className }: { className?: string }) {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

// Collapsible Section Component
interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-card hover:bg-card/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-accent">{icon}</div>
          <span className="font-medium">{title}</span>
        </div>
        <ChevronDownIcon
          className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`transition-all duration-200 ease-in-out ${
          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="p-4 pt-2 space-y-4 bg-background">{children}</div>
      </div>
    </div>
  );
}

// Section Icons
function CoffeeIcon({ className }: { className?: string }) {
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
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" x2="6" y1="2" y2="4" />
      <line x1="10" x2="10" y1="2" y2="4" />
      <line x1="14" x2="14" y1="2" y2="4" />
    </svg>
  );
}

function SlidersIcon({ className }: { className?: string }) {
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
      <line x1="4" x2="4" y1="21" y2="14" />
      <line x1="4" x2="4" y1="10" y2="3" />
      <line x1="12" x2="12" y1="21" y2="12" />
      <line x1="12" x2="12" y1="8" y2="3" />
      <line x1="20" x2="20" y1="21" y2="16" />
      <line x1="20" x2="20" y1="12" y2="3" />
      <line x1="2" x2="6" y1="14" y2="14" />
      <line x1="10" x2="14" y1="8" y2="8" />
      <line x1="18" x2="22" y1="16" y2="16" />
    </svg>
  );
}

function TimerIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function NotesIcon({ className }: { className?: string }) {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

// Rating Component
interface RatingProps {
  value: number | null;
  onChange: (value: number) => void;
}

function Rating({ value, onChange }: RatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onChange(num)}
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

// Time Input Component (supports mm:ss format)
interface TimeInputProps {
  value: number | null;
  onChange: (seconds: number | null) => void;
  placeholder?: string;
}

function TimeInput({ value, onChange, placeholder }: TimeInputProps) {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    if (value !== null) {
      const mins = Math.floor(value / 60);
      const secs = value % 60;
      if (mins > 0) {
        setDisplayValue(`${mins}:${secs.toString().padStart(2, "0")}`);
      } else {
        setDisplayValue(value.toString());
      }
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const handleChange = (input: string) => {
    setDisplayValue(input);

    if (!input) {
      onChange(null);
      return;
    }

    // Handle mm:ss format
    if (input.includes(":")) {
      const [mins, secs] = input.split(":").map(Number);
      if (!isNaN(mins) && !isNaN(secs)) {
        onChange(mins * 60 + secs);
      }
    } else {
      const secs = parseInt(input, 10);
      if (!isNaN(secs)) {
        onChange(secs);
      }
    }
  };

  return (
    <Input
      value={displayValue}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

export default function LogPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { coffees, loading: coffeesLoading } = useCoffees();
  const { grinders, loading: grindersLoading } = useGrinders();
  const { brewers, loading: brewersLoading } = useBrewers();
  const { stats: equipmentStats } = useEquipmentStats();

  // Brew date/time (editable)
  const [brewDateTime, setBrewDateTime] = useState(new Date());
  const [isEditingDateTime, setIsEditingDateTime] = useState(false);

  // Update display time when not editing
  useEffect(() => {
    if (!isEditingDateTime) {
      const timer = setInterval(() => setBrewDateTime(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [isEditingDateTime]);

  // Saving state
  const [saving, setSaving] = useState(false);

  // Equipment state
  const [coffeeId, setCoffeeId] = useState<string>("");
  const [grinderId, setGrinderId] = useState<string>("");
  const [brewerId, setBrewerId] = useState<string>("");

  // Parameters state
  const [doseGrams, setDoseGrams] = useState<string>("");
  const [waterGrams, setWaterGrams] = useState<string>("");
  const [tempUnit, setTempUnit] = useState<"F" | "C">("F");
  const [waterTemp, setWaterTemp] = useState<string>("");
  const [grindSetting, setGrindSetting] = useState<string>("");
  const [tdsPercent, setTdsPercent] = useState<string>("");

  // Timing state
  const [bloomTimeSeconds, setBloomTimeSeconds] = useState<number | null>(null);
  const [bloomWaterGrams, setBloomWaterGrams] = useState<string>("");
  const [totalTimeSeconds, setTotalTimeSeconds] = useState<number | null>(null);

  // Notes state
  const [techniqueNotes, setTechniqueNotes] = useState<string>("");
  const [tastingNotes, setTastingNotes] = useState<string>("");
  const [rating, setRating] = useState<number | null>(null);

  // AI menu state
  const [isAIMenuOpen, setIsAIMenuOpen] = useState(false);

  // AI voice input state
  const [voiceResult, setVoiceResult] = useState<ParseVoiceResult | null>(null);
  const [voiceDialogOpen, setVoiceDialogOpen] = useState(false);

  // AI photo input state
  const [photoResult, setPhotoResult] = useState<AnalyzeImageResult | null>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [photoProductType, setPhotoProductType] = useState<"coffee" | "grinder" | "brewer">("coffee");

  // AI config state
  const [aiConfig, setAiConfig] = useState<AIConfig | undefined>(undefined);

  // Load AI settings
  useEffect(() => {
    async function loadAISettings() {
      if (!user) return;
      try {
        const settings = await getAISettings(user.uid);
        const apiKey = settings.apiKeys[settings.selectedProvider];
        if (apiKey) {
          setAiConfig({
            provider: settings.selectedProvider,
            modelId: settings.selectedModelId,
            apiKey,
          });
        }
      } catch (error) {
        console.error("Failed to load AI settings:", error);
      }
    }
    loadAISettings();
  }, [user]);

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

  // Reset form to defaults
  const resetForm = useCallback(() => {
    setCoffeeId("");
    setGrinderId("");
    setBrewerId("");
    setDoseGrams("");
    setWaterGrams("");
    setWaterTemp("");
    setGrindSetting("");
    setTdsPercent("");
    setBloomTimeSeconds(null);
    setBloomWaterGrams("");
    setTotalTimeSeconds(null);
    setTechniqueNotes("");
    setTastingNotes("");
    setRating(null);
    setBrewDateTime(new Date());
    setIsEditingDateTime(false);
  }, []);

  // Helper to convert empty/zero values to null
  const toNullableNumber = (value: string): number | null => {
    const num = parseFloat(value);
    return isNaN(num) || num === 0 ? null : num;
  };

  const toNullableString = (value: string): string | null => {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  };

  // Handle voice input result
  const handleVoiceResult = (result: ParseVoiceResult) => {
    setVoiceResult(result);
    setVoiceDialogOpen(true);
  };

  // Apply voice/text parsed data to form
  const handleApplyVoiceData = (editedData: EditableParsedData) => {
    // Apply equipment
    if (editedData.matchedCoffeeId) {
      setCoffeeId(editedData.matchedCoffeeId);
    }
    if (editedData.matchedGrinderId) {
      setGrinderId(editedData.matchedGrinderId);
    }
    if (editedData.matchedBrewerId) {
      setBrewerId(editedData.matchedBrewerId);
    }

    // Apply parameters
    if (editedData.doseGrams !== undefined) {
      setDoseGrams(editedData.doseGrams.toString());
    }
    if (editedData.waterGrams !== undefined) {
      setWaterGrams(editedData.waterGrams.toString());
    }
    if (editedData.waterTempF !== undefined) {
      setTempUnit("F");
      setWaterTemp(editedData.waterTempF.toString());
    }
    if (editedData.grindSetting !== undefined) {
      setGrindSetting(editedData.grindSetting.toString());
    }
    if (editedData.tdsPercent !== undefined) {
      setTdsPercent(editedData.tdsPercent.toString());
    }

    // Apply timing
    if (editedData.totalTimeSeconds !== undefined) {
      setTotalTimeSeconds(editedData.totalTimeSeconds);
    }

    // Apply notes
    if (editedData.techniqueNotes) {
      setTechniqueNotes(editedData.techniqueNotes);
    }
    if (editedData.tastingNotes) {
      setTastingNotes(editedData.tastingNotes);
    }
    if (editedData.rating !== undefined) {
      setRating(editedData.rating);
    }

    setVoiceDialogOpen(false);
    setVoiceResult(null);

    toast({
      title: "Values applied",
      description: "Brew data has been added to the form",
    });
  };

  // Handle photo scan result
  const handlePhotoResult = (result: AnalyzeImageResult, productType: "coffee" | "grinder" | "brewer") => {
    setPhotoResult(result);
    setPhotoProductType(productType);
    setPhotoDialogOpen(true);
  };

  // Apply photo result - add new equipment
  const handleApplyPhotoData = async () => {
    if (!photoResult || !user) return;

    const { detected } = photoResult;

    try {
      if (photoProductType === "coffee") {
        const newCoffeeId = await addCoffee(user.uid, {
          name: detected.model || "Unknown Coffee",
          roaster: detected.roaster || detected.brand || null,
          origin: detected.origin || null,
          roastLevel: detected.roastLevel || null,
          flavorNotes: detected.flavorNotes || null,
        });
        setCoffeeId(newCoffeeId);
        toast({
          title: "Coffee added",
          description: `${detected.model || "New coffee"} has been added to your collection`,
        });
      } else if (photoProductType === "grinder") {
        const newGrinderId = await addGrinder(user.uid, {
          name: detected.model || "Unknown Grinder",
          brand: detected.manufacturer || detected.brand || null,
          burrType: detected.burrType || null,
        });
        setGrinderId(newGrinderId);
        toast({
          title: "Grinder added",
          description: `${detected.model || "New grinder"} has been added to your collection`,
        });
      } else if (photoProductType === "brewer") {
        const newBrewerId = await addBrewer(user.uid, {
          name: detected.model || "Unknown Brewer",
          brand: detected.manufacturer || detected.brand || null,
          type: detected.brewMethod || null,
        });
        setBrewerId(newBrewerId);
        toast({
          title: "Brewer added",
          description: `${detected.model || "New brewer"} has been added to your collection`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add equipment",
        variant: "destructive",
      });
    }

    setPhotoDialogOpen(false);
    setPhotoResult(null);
  };

  // Handle save
  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save a brew",
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

      // Build brew log data
      const brewLogData = {
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
        bloomTimeSeconds,
        bloomWaterGrams: toNullableNumber(bloomWaterGrams),
        totalTimeSeconds,
        techniqueNotes: toNullableString(techniqueNotes),
        tastingNotes: toNullableString(tastingNotes),
        rating,
      };

      await addCoffeeTime(user.uid, brewLogData, user.displayName);

      toast({
        title: "Brew saved!",
        description: "Your brew has been logged successfully.",
      });

      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save brew",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <main className="min-h-screen pb-20">
      {/* Header */}
      <header className="p-6 pb-4">
        <div className="space-y-2">
          {/* Title row with Quick Add and Save buttons */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Log Brew</h1>

            <div className="flex items-center gap-2">
              {/* AI Quick Log Button */}
              <button
                type="button"
                onClick={() => setIsAIMenuOpen(true)}
                className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 active:scale-95 transition-all duration-200"
                title="Quick Log with AI"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                </svg>
                <span className="text-sm font-medium">Quick Add</span>
              </button>

              {/* Save Brew Button */}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 h-auto"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving
                  </span>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>

          {/* Date/time row */}
          {isEditingDateTime ? (
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={formatDateTimeLocal(brewDateTime)}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  if (!isNaN(newDate.getTime())) {
                    setBrewDateTime(newDate);
                  }
                }}
                className="bg-background border border-border rounded-md px-2 py-1 text-sm"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingDateTime(false)}
              >
                Done
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBrewDateTime(new Date());
                  setIsEditingDateTime(false);
                }}
              >
                Now
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingDateTime(true)}
              className="text-muted-foreground hover:text-foreground transition-colors text-left"
            >
              {formatDate(brewDateTime)} • {formatTime(brewDateTime)}
            </button>
          )}
        </div>

        {/* Hidden triggers for AI menu - keep in DOM for data-attribute selection */}
        <div className="sr-only">
          <TextInputButton
            coffees={coffees}
            grinders={grinders}
            brewers={brewers}
            aiConfig={aiConfig}
            onResult={handleVoiceResult}
          />
          <VoiceInputButton
            coffees={coffees}
            grinders={grinders}
            brewers={brewers}
            aiConfig={aiConfig}
            onResult={handleVoiceResult}
          />
        </div>
      </header>

      {/* Form Sections */}
      <div className="px-4 space-y-4">
        {/* Equipment Section */}
        <CollapsibleSection
          title="Equipment"
          icon={<CoffeeIcon className="w-5 h-5" />}
          defaultOpen={true}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Coffee</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <SmartEquipmentSelect
                    items={coffees.map((c) => ({
                      id: c.id,
                      name: c.name,
                      subtitle: c.roaster || undefined,
                    }))}
                    stats={equipmentStats}
                    equipmentType="coffees"
                    value={coffeeId}
                    onChange={setCoffeeId}
                    placeholder="Search or select coffee..."
                    loading={coffeesLoading}
                  />
                </div>
                <PhotoCaptureButton
                  productType="coffee"
                  aiConfig={aiConfig}
                  onResult={(result) => handlePhotoResult(result, "coffee")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Grinder</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <SmartEquipmentSelect
                    items={grinders.map((g) => ({
                      id: g.id,
                      name: g.name,
                      subtitle: g.brand || undefined,
                    }))}
                    stats={equipmentStats}
                    equipmentType="grinders"
                    value={grinderId}
                    onChange={setGrinderId}
                    placeholder="Search or select grinder..."
                    loading={grindersLoading}
                  />
                </div>
                <PhotoCaptureButton
                  productType="grinder"
                  aiConfig={aiConfig}
                  onResult={(result) => handlePhotoResult(result, "grinder")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Brewer</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <SmartEquipmentSelect
                    items={brewers.map((b) => ({
                      id: b.id,
                      name: b.name,
                      subtitle: b.brand || undefined,
                    }))}
                    stats={equipmentStats}
                    equipmentType="brewers"
                    value={brewerId}
                    onChange={setBrewerId}
                    placeholder="Search or select brewer..."
                    loading={brewersLoading}
                  />
                </div>
                <PhotoCaptureButton
                  productType="brewer"
                  aiConfig={aiConfig}
                  onResult={(result) => handlePhotoResult(result, "brewer")}
                />
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Parameters Section */}
        <CollapsibleSection
          title="Parameters"
          icon={<SlidersIcon className="w-5 h-5" />}
          defaultOpen={true}
        >
          <div className="space-y-4">
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
              <span className="font-mono font-medium">
                {ratio || "—"}
              </span>
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
          </div>
        </CollapsibleSection>

        {/* Timing Section */}
        <CollapsibleSection
          title="Timing"
          icon={<TimerIcon className="w-5 h-5" />}
          defaultOpen={false}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bloom Time (s)</Label>
                <Input
                  type="number"
                  value={bloomTimeSeconds ?? ""}
                  onChange={(e) =>
                    setBloomTimeSeconds(e.target.value ? parseInt(e.target.value, 10) : null)
                  }
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
              <TimeInput
                value={totalTimeSeconds}
                onChange={setTotalTimeSeconds}
                placeholder="3:30 or 210"
              />
              <p className="text-xs text-muted-foreground">
                Enter as seconds (210) or mm:ss (3:30)
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Notes Section */}
        <CollapsibleSection
          title="Notes"
          icon={<NotesIcon className="w-5 h-5" />}
          defaultOpen={false}
        >
          <div className="space-y-4">
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
          </div>
        </CollapsibleSection>
      </div>


      {/* AI Dialogs */}
      {/* AI Quick Log Menu */}
      <Dialog open={isAIMenuOpen} onOpenChange={setIsAIMenuOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-center justify-center">
              <svg
                className="w-6 h-6 text-purple-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
              Quick Log with AI
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <p className="text-sm text-muted-foreground text-center mb-2">
              Describe your brew and AI will fill in the details
            </p>

            {/* Voice Input Option */}
            <button
              type="button"
              onClick={() => {
                setIsAIMenuOpen(false);
                // Trigger voice recording - we need to expose the voice start function
                const voiceButton = document.querySelector('[data-voice-trigger]') as HTMLButtonElement;
                if (voiceButton) voiceButton.click();
              }}
              className="flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-purple-500 hover:bg-purple-500/5 transition-all group"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-semibold">Speak Your Brew</div>
                <div className="text-sm text-muted-foreground">Tap and describe your brew out loud</div>
              </div>
            </button>

            {/* Text Input Option */}
            <button
              type="button"
              onClick={() => {
                setIsAIMenuOpen(false);
                const textButton = document.querySelector('[data-text-trigger]') as HTMLButtonElement;
                if (textButton) textButton.click();
              }}
              className="flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-purple-500 hover:bg-purple-500/5 transition-all group"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <path d="M9 12h6" />
                  <path d="M9 16h6" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-semibold">Paste Notes</div>
                <div className="text-sm text-muted-foreground">Copy and paste your brew notes</div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <VoicePreviewDialog
        open={voiceDialogOpen}
        onOpenChange={setVoiceDialogOpen}
        result={voiceResult}
        onApply={handleApplyVoiceData}
      />

      <ProductPreviewDialog
        open={photoDialogOpen}
        onOpenChange={setPhotoDialogOpen}
        result={photoResult}
        productType={photoProductType}
        onApply={handleApplyPhotoData}
      />
    </main>
  );
}
