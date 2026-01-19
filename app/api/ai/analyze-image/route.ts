import { NextRequest, NextResponse } from "next/server";
import { callLLM, LLMClientConfig } from "@/lib/services/llmClient";
import { LLMProvider, getDefaultModel, getModelById } from "@/lib/types/llm";

type ProductType = "coffee" | "grinder" | "brewer";

interface AnalyzeImageRequest {
  imageBase64: string;
  productType: ProductType;
  aiConfig?: {
    provider: LLMProvider;
    modelId: string;
    apiKey: string;
  };
}

interface AnalyzeImageResponse {
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

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeImageRequest = await request.json();
    const { imageBase64, productType, aiConfig } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      );
    }

    // Use provided config or fall back to server-side Gemini key
    let config: LLMClientConfig;

    if (aiConfig?.apiKey) {
      // Check if the selected model supports vision
      const model = getModelById(aiConfig.modelId);
      if (model && !model.supportsVision) {
        return NextResponse.json(
          { error: `Model ${model.name} does not support image analysis` },
          { status: 400 }
        );
      }

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

    const getPromptForProductType = (type: ProductType): string => {
      switch (type) {
        case "coffee":
          return `Analyze this coffee bag/packaging image. Extract:
- Brand/Roaster name
- Coffee name/origin
- Roast level (light, medium, dark)
- Flavor notes if listed
- Any visible barcode number

Return JSON:
{
  "detected": {
    "roaster": "brand name" or null,
    "brand": "brand name" or null,
    "model": "coffee name" or null,
    "origin": "country/region" or null,
    "roastLevel": "light/medium/dark" or null,
    "flavorNotes": ["note1", "note2"] or []
  },
  "barcode": "number" or null,
  "confidence": 0-1 (how confident you are in the reading),
  "sources": ["Text from label", "Logo recognition"]
}`;

        case "grinder":
          return `Analyze this coffee grinder image. Extract:
- Manufacturer/brand
- Model name/number
- Type (manual/electric)
- Burr type if visible (flat/conical, steel/ceramic)

Return JSON:
{
  "detected": {
    "manufacturer": "brand name" or null,
    "brand": "brand name" or null,
    "model": "model name" or null,
    "burrType": "flat steel/conical ceramic/etc" or null
  },
  "barcode": "number" or null,
  "confidence": 0-1,
  "sources": ["Label text", "Visual identification"]
}`;

        case "brewer":
          return `Analyze this coffee brewer/brewing device image. Extract:
- Brand/manufacturer
- Model name
- Brew method type (pour over, French press, espresso, etc.)

Return JSON:
{
  "detected": {
    "manufacturer": "brand name" or null,
    "brand": "brand name" or null,
    "model": "model name" or null,
    "brewMethod": "pour over/French press/etc" or null
  },
  "barcode": "number" or null,
  "confidence": 0-1,
  "sources": ["Label text", "Visual identification"]
}`;
      }
    };

    const response = await callLLM(
      config,
      [
        {
          role: "user",
          content: [
            {
              type: "image",
              imageBase64: imageBase64,
              mimeType: "image/jpeg",
            },
            {
              type: "text",
              text: getPromptForProductType(productType),
            },
          ],
        },
      ]
    );

    // Parse the JSON response
    const responseText = response.content;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from response");
    }

    const parsedResponse: AnalyzeImageResponse = JSON.parse(jsonMatch[0]);

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error("Error analyzing image:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze image" },
      { status: 500 }
    );
  }
}
