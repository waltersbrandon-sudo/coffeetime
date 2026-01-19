import { NextRequest, NextResponse } from "next/server";
import { getAISettings, getEffectiveImageSettings } from "@/lib/services/aiSettingsService";

type ProductType = "coffee" | "grinder" | "brewer";

interface GenerateImageRequest {
  productName: string;
  productType: ProductType;
  userId: string;
  options?: {
    brand?: string;
    model?: string;
    description?: string;
  };
}

interface GenerateImageResponse {
  imageBase64: string;
  mimeType: string;
}

/**
 * Build a prompt for generating a product image
 */
function buildProductPrompt(
  productName: string,
  productType: ProductType,
  options?: { brand?: string; model?: string; description?: string }
): string {
  const brand = options?.brand;
  const model = options?.model;
  const description = options?.description;

  switch (productType) {
    case "coffee":
      return `Professional product photography of a premium coffee bag labeled "${productName}"${brand ? ` from ${brand}` : ""}. Artisanal specialty coffee packaging, elegant design. Pure white background. Soft studio lighting with subtle shadows. High definition, photorealistic. No text overlays.${description ? ` Style hints: ${description}` : ""}`;

    case "grinder":
      return `Professional product photography of a ${brand ? `${brand} ` : ""}${model ? `${model} ` : ""}${productName} coffee grinder. Complete device shown from 3/4 angle, elegant and modern. Pure white background. Soft studio lighting with subtle shadows. High definition, photorealistic. No text overlays.${description ? ` Details: ${description}` : ""}`;

    case "brewer":
      return `Professional product photography of a ${brand ? `${brand} ` : ""}${model ? `${model} ` : ""}${productName} coffee brewer. Complete device shown clearly, elegant design. Pure white background. Soft studio lighting with subtle shadows. High definition, photorealistic. No text overlays.${description ? ` Details: ${description}` : ""}`;
  }
}

/**
 * Generate image using Google Imagen 3
 */
async function generateWithGoogle(prompt: string, apiKey: string): Promise<{ imageBase64: string; mimeType: string }> {
  const IMAGEN_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict";

  const response = await fetch(`${IMAGEN_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: "1:1",
        safetyFilterLevel: "block_few",
        personGeneration: "dont_allow",
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Google Imagen API error:", errorData);

    if (response.status === 400) {
      throw new Error("Unable to generate this image. Try a different product description.");
    }
    if (response.status === 429) {
      throw new Error("Too many requests. Please wait a moment and try again.");
    }
    throw new Error("Failed to generate image with Google Imagen.");
  }

  const data = await response.json();
  const predictions = data.predictions;

  if (!predictions || predictions.length === 0) {
    throw new Error("No image was generated. Try a different description.");
  }

  const imageData = predictions[0];
  const imageBase64 = imageData.bytesBase64Encoded;
  const mimeType = imageData.mimeType || "image/png";

  if (!imageBase64) {
    throw new Error("Failed to extract generated image.");
  }

  return { imageBase64, mimeType };
}

/**
 * Generate image using OpenAI DALL-E 3
 */
async function generateWithOpenAI(prompt: string, apiKey: string): Promise<{ imageBase64: string; mimeType: string }> {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("OpenAI DALL-E API error:", errorData);

    if (response.status === 400) {
      throw new Error("Unable to generate this image. Try a different product description.");
    }
    if (response.status === 429) {
      throw new Error("Too many requests. Please wait a moment and try again.");
    }
    if (response.status === 401) {
      throw new Error("Invalid OpenAI API key. Please check your settings.");
    }
    throw new Error("Failed to generate image with OpenAI DALL-E.");
  }

  const data = await response.json();

  if (!data.data || data.data.length === 0) {
    throw new Error("No image was generated. Try a different description.");
  }

  const imageBase64 = data.data[0].b64_json;

  if (!imageBase64) {
    throw new Error("Failed to extract generated image.");
  }

  return { imageBase64, mimeType: "image/png" };
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateImageRequest = await request.json();
    const { productName, productType, userId, options } = body;

    if (!productName) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    if (!productType || !["coffee", "grinder", "brewer"].includes(productType)) {
      return NextResponse.json(
        { error: "Valid product type (coffee, grinder, brewer) is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user's AI settings
    const settings = await getAISettings(userId);
    const { provider, apiKey } = getEffectiveImageSettings(settings);

    if (!apiKey) {
      const providerName = provider === "google" ? "Google (Gemini)" : "OpenAI";
      return NextResponse.json(
        {
          error: `No API key configured for ${providerName}. Please add your API key in Settings > AI Settings.`
        },
        { status: 400 }
      );
    }

    const prompt = buildProductPrompt(productName, productType, options);

    let result: GenerateImageResponse;

    if (provider === "google") {
      result = await generateWithGoogle(prompt, apiKey);
    } else {
      result = await generateWithOpenAI(prompt, apiKey);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate image" },
      { status: 500 }
    );
  }
}
