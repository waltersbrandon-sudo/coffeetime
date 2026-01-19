import { LLMProvider } from "@/lib/types/llm";

interface EquipmentItem {
  id: string;
  name: string;
}

interface MatchedEquipment {
  id: string;
  name: string;
  confidence: number;
}

export interface AIConfig {
  provider: LLMProvider;
  modelId: string;
  apiKey: string;
}

export interface ParseVoiceResult {
  parsed: {
    doseGrams?: number;
    waterGrams?: number;
    waterTempF?: number;
    waterTempC?: number;
    grindSetting?: number;
    bloomTimeSeconds?: number;
    bloomWaterGrams?: number;
    totalTimeSeconds?: number;
    tdsPercent?: number;
    rating?: number;
    techniqueNotes?: string;
    tastingNotes?: string;
  };
  matchedEquipment: {
    coffee?: MatchedEquipment;
    grinder?: MatchedEquipment;
    brewer?: MatchedEquipment;
  };
  rawNotes?: string;
}

export async function parseVoiceInput(
  transcript: string,
  userEquipment: {
    coffees: EquipmentItem[];
    grinders: EquipmentItem[];
    brewers: EquipmentItem[];
  },
  aiConfig?: AIConfig
): Promise<ParseVoiceResult> {
  const response = await fetch("/api/ai/parse-voice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transcript,
      userEquipment,
      aiConfig,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to parse voice input");
  }

  return response.json();
}

export interface AnalyzeImageResult {
  detected: {
    brand?: string;
    model?: string;
    roaster?: string;
    origin?: string;
    roastLevel?: string;
    flavorNotes?: string[];
    manufacturer?: string;
    burrType?: string;
    brewMethod?: string;
  };
  barcode?: string;
  confidence: number;
  sources: string[];
}

export async function analyzeProductImage(
  imageBase64: string,
  productType: "coffee" | "grinder" | "brewer",
  aiConfig?: AIConfig
): Promise<AnalyzeImageResult> {
  const response = await fetch("/api/ai/analyze-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imageBase64,
      productType,
      aiConfig,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to analyze image");
  }

  return response.json();
}

export interface GenerateThumbnailResult {
  imageBase64: string;
  mimeType: string;
}

export interface GenerateThumbnailOptions {
  brand?: string;
  model?: string;
  description?: string;
}

/**
 * Generate a product thumbnail using AI (Google Imagen or OpenAI DALL-E)
 */
export async function generateProductThumbnail(
  productName: string,
  productType: "coffee" | "grinder" | "brewer",
  userId: string,
  options?: GenerateThumbnailOptions
): Promise<GenerateThumbnailResult> {
  const response = await fetch("/api/ai/generate-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productName,
      productType,
      userId,
      options,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate thumbnail");
  }

  return response.json();
}
