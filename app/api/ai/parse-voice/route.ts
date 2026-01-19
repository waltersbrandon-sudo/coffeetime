import { NextRequest, NextResponse } from "next/server";
import { callLLM, LLMClientConfig } from "@/lib/services/llmClient";
import { LLMProvider, getDefaultModel } from "@/lib/types/llm";

interface EquipmentItem {
  id: string;
  name: string;
}

interface ParseVoiceRequest {
  transcript: string;
  userEquipment: {
    coffees: EquipmentItem[];
    grinders: EquipmentItem[];
    brewers: EquipmentItem[];
  };
  aiConfig?: {
    provider: LLMProvider;
    modelId: string;
    apiKey: string;
  };
}

interface MatchedEquipment {
  id: string;
  name: string;
  confidence: number;
}

interface ParseVoiceResponse {
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

export async function POST(request: NextRequest) {
  try {
    const body: ParseVoiceRequest = await request.json();
    const { transcript, userEquipment, aiConfig } = body;

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    // Use provided config or fall back to server-side Gemini key
    let config: LLMClientConfig;

    if (aiConfig?.apiKey) {
      config = {
        provider: aiConfig.provider,
        modelId: aiConfig.modelId,
        apiKey: aiConfig.apiKey,
      };
    } else {
      // Fall back to server-side Gemini API key
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return NextResponse.json(
          { error: "No AI API key configured. Please add your API key in Settings." },
          { status: 500 }
        );
      }
      const defaultModel = getDefaultModel();
      config = {
        provider: "gemini",
        modelId: defaultModel.id,
        apiKey: geminiApiKey,
      };
    }

    const systemPrompt = `You are a coffee brew log assistant. Extract structured data from a voice transcript describing a coffee brew.

Available equipment:
- Coffees: ${JSON.stringify(userEquipment.coffees.map((c) => ({ id: c.id, name: c.name })))}
- Grinders: ${JSON.stringify(userEquipment.grinders.map((g) => ({ id: g.id, name: g.name })))}
- Brewers: ${JSON.stringify(userEquipment.brewers.map((b) => ({ id: b.id, name: b.name })))}

Extract any mentioned values and match equipment to the user's list. Return JSON in this format:
{
  "parsed": {
    "doseGrams": number or null,
    "waterGrams": number or null,
    "waterTempF": number or null (Fahrenheit),
    "waterTempC": number or null (Celsius),
    "grindSetting": number or null,
    "bloomTimeSeconds": number or null,
    "bloomWaterGrams": number or null,
    "totalTimeSeconds": number or null,
    "tdsPercent": number or null,
    "rating": number 1-10 or null,
    "techniqueNotes": string or null,
    "tastingNotes": string or null
  },
  "matchedEquipment": {
    "coffee": { "id": "matched-id", "name": "matched-name", "confidence": 0-1 } or null,
    "grinder": { "id": "matched-id", "name": "matched-name", "confidence": 0-1 } or null,
    "brewer": { "id": "matched-id", "name": "matched-name", "confidence": 0-1 } or null
  },
  "rawNotes": "any other information that doesn't fit the structured fields"
}

Only include fields that are mentioned. Convert time expressions like "3 minutes 30 seconds" to seconds (210).
Match equipment by name similarity - partial matches are OK if confident.
If temperature is given without unit, assume Fahrenheit if > 50, Celsius otherwise.`;

    const response = await callLLM(
      config,
      [
        {
          role: "user",
          content: `Parse this coffee brew description: "${transcript}"`,
        },
      ],
      systemPrompt
    );

    // Parse the JSON response
    const responseText = response.content;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from response");
    }

    const parsedResponse: ParseVoiceResponse = JSON.parse(jsonMatch[0]);

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error("Error parsing voice input:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to parse voice input" },
      { status: 500 }
    );
  }
}
