import { CoffeeTime } from "@/lib/types";
import { ExportFormat, ExportOptions, ExportResult } from "@/lib/types/export";
import { getCoffeeTimes } from "./brewLogService";
import { Timestamp } from "firebase/firestore";

// Format timestamp for CSV
function formatTimestamp(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return "";
  const date = timestamp.toDate();
  return date.toISOString();
}

// Format time in seconds to mm:ss
function formatTime(seconds: number | null | undefined): string {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Escape CSV value
function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Convert brews to CSV format
function brewsToCSV(brews: CoffeeTime[]): string {
  const headers = [
    "Date",
    "Time",
    "Coffee",
    "Roaster",
    "Grinder",
    "Brewer",
    "Dose (g)",
    "Water (g)",
    "Ratio",
    "Temp (F)",
    "Temp (C)",
    "Grind Setting",
    "Bloom Time",
    "Bloom Water (g)",
    "Total Time",
    "Technique Notes",
    "Tasting Notes",
    "Rating",
  ];

  const rows = brews.map((brew) => {
    const date = brew.timestamp?.toDate();
    return [
      date ? date.toLocaleDateString() : "",
      date ? date.toLocaleTimeString() : "",
      escapeCSV(brew.coffeeName),
      "", // Roaster not stored separately in CoffeeTime
      escapeCSV(brew.grinderName),
      escapeCSV(brew.brewerName),
      brew.doseGrams ?? "",
      brew.waterGrams ?? "",
      brew.ratio ? `1:${brew.ratio.toFixed(1)}` : "",
      brew.waterTempF ?? "",
      brew.waterTempC ?? "",
      brew.grindSetting ?? "",
      formatTime(brew.bloomTimeSeconds),
      brew.bloomWaterGrams ?? "",
      formatTime(brew.totalTimeSeconds),
      escapeCSV(brew.techniqueNotes),
      escapeCSV(brew.tastingNotes),
      brew.rating ?? "",
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

// Convert brews to JSON format
function brewsToJSON(brews: CoffeeTime[], includeMetadata: boolean = true): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    brewCount: brews.length,
    brews: brews.map((brew) => ({
      id: brew.id,
      timestamp: formatTimestamp(brew.timestamp),
      equipment: {
        coffeeId: brew.coffeeId,
        coffeeName: brew.coffeeName,
        grinderId: brew.grinderId,
        grinderName: brew.grinderName,
        brewerId: brew.brewerId,
        brewerName: brew.brewerName,
      },
      parameters: {
        doseGrams: brew.doseGrams,
        waterGrams: brew.waterGrams,
        ratio: brew.ratio,
        waterTempF: brew.waterTempF,
        waterTempC: brew.waterTempC,
        grindSetting: brew.grindSetting,
      },
      timing: {
        bloomTimeSeconds: brew.bloomTimeSeconds,
        bloomWaterGrams: brew.bloomWaterGrams,
        totalTimeSeconds: brew.totalTimeSeconds,
      },
      notes: {
        techniqueNotes: brew.techniqueNotes,
        tastingNotes: brew.tastingNotes,
        rating: brew.rating,
      },
      ...(includeMetadata && {
        metadata: {
          createdAt: formatTimestamp(brew.createdAt),
          updatedAt: formatTimestamp(brew.updatedAt),
          photoURL: brew.photoURL,
          rawVoiceInput: brew.rawVoiceInput,
        },
      }),
    })),
  };

  return JSON.stringify(exportData, null, 2);
}

// Main export function
export async function exportBrews(
  userId: string,
  options: ExportOptions
): Promise<ExportResult> {
  const { format, startDate, endDate, includeRawData = false } = options;

  // Fetch all brews (with optional date filters)
  const result = await getCoffeeTimes(userId, {
    startDate,
    endDate,
    pageSize: 10000, // Get all brews
  });

  const brews = result.coffeeTimes;
  const dateStr = new Date().toISOString().split("T")[0];

  if (format === "csv") {
    return {
      content: brewsToCSV(brews),
      filename: `coffeetime-export-${dateStr}.csv`,
      mimeType: "text/csv",
    };
  }

  return {
    content: brewsToJSON(brews, includeRawData),
    filename: `coffeetime-export-${dateStr}.json`,
    mimeType: "application/json",
  };
}

// Download file locally
export function downloadFile(result: ExportResult): void {
  const blob = new Blob([result.content], { type: result.mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// Get export preview info
export async function getExportPreview(
  userId: string,
  options: Pick<ExportOptions, "startDate" | "endDate">
): Promise<{ brewCount: number; dateRange: string }> {
  const result = await getCoffeeTimes(userId, {
    startDate: options.startDate,
    endDate: options.endDate,
    pageSize: 10000,
  });

  const brews = result.coffeeTimes;

  let dateRange = "All time";
  if (options.startDate && options.endDate) {
    dateRange = `${options.startDate.toLocaleDateString()} - ${options.endDate.toLocaleDateString()}`;
  } else if (options.startDate) {
    dateRange = `Since ${options.startDate.toLocaleDateString()}`;
  } else if (options.endDate) {
    dateRange = `Until ${options.endDate.toLocaleDateString()}`;
  }

  return {
    brewCount: brews.length,
    dateRange,
  };
}
