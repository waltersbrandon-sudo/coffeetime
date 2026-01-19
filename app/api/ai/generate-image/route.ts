import { NextRequest, NextResponse } from "next/server";
import { getAISettings } from "@/lib/services/aiSettingsService";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
 * Build a search query for finding product images
 */
function buildSearchQuery(
  productName: string,
  productType: ProductType,
  options?: { brand?: string; model?: string; description?: string }
): string {
  const brand = options?.brand;
  const model = options?.model;

  const parts: string[] = [];

  if (brand) parts.push(brand);
  if (model) parts.push(model);
  parts.push(productName);

  // Add product type context
  switch (productType) {
    case "coffee":
      parts.push("coffee bag");
      break;
    case "grinder":
      parts.push("coffee grinder");
      break;
    case "brewer":
      parts.push("coffee brewer");
      break;
  }

  // Add quality hints for better image results
  parts.push("product photo white background");

  return parts.join(" ");
}

/**
 * Search for candidate images using Google Custom Search API
 */
async function searchForImages(
  query: string,
  apiKey: string,
  cseId: string,
  numResults: number = 5
): Promise<string[]> {
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("cx", cseId);
  url.searchParams.set("q", query);
  url.searchParams.set("searchType", "image");
  url.searchParams.set("imgSize", "large");
  url.searchParams.set("num", String(numResults));
  url.searchParams.set("safe", "active");

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error("Google CSE error:", error);
    throw new Error("Failed to search for images");
  }

  const data = await response.json();
  const items = data.items || [];

  return items.map((item: { link: string }) => item.link);
}

/**
 * Fetch an image and convert to base64
 */
async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CoffeeTimeBot/1.0)",
      },
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) return null;

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    return { base64, mimeType: contentType };
  } catch {
    return null;
  }
}

/**
 * Use Gemini Vision to pick the best image from candidates
 */
async function pickBestImage(
  candidates: Array<{ url: string; base64: string; mimeType: string }>,
  productDescription: string,
  apiKey: string
): Promise<number> {
  if (candidates.length === 0) {
    throw new Error("No candidate images to evaluate");
  }

  if (candidates.length === 1) {
    return 0; // Only one option
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Build the content with all images
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  // Add the prompt
  parts.push({
    text: `You are an expert at selecting product photos for an e-commerce catalog.

I need you to select the BEST image of: ${productDescription}

Evaluate each image based on:
1. Is it actually the correct product? (most important)
2. Image quality and resolution
3. Clean background (white or neutral preferred)
4. Professional product photography style
5. Shows the complete product clearly

Here are ${candidates.length} candidate images:`
  });

  // Add each image with a label
  candidates.forEach((candidate, index) => {
    parts.push({ text: `\n\nImage ${index + 1}:` });
    parts.push({
      inlineData: {
        mimeType: candidate.mimeType,
        data: candidate.base64,
      },
    });
  });

  parts.push({
    text: `\n\nWhich image number (1-${candidates.length}) is the BEST match for "${productDescription}"?

Reply with ONLY a single number. If none of the images are appropriate, reply with "0".`
  });

  const result = await model.generateContent(parts);
  const response = result.response.text().trim();

  // Extract the number from the response
  const match = response.match(/\d+/);
  if (!match) {
    console.log("Vision response:", response);
    return 0; // Default to first if can't parse
  }

  const selectedIndex = parseInt(match[0], 10) - 1; // Convert 1-indexed to 0-indexed

  // Validate the index
  if (selectedIndex < 0 || selectedIndex >= candidates.length) {
    return 0; // Default to first if invalid
  }

  return selectedIndex;
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
    const geminiApiKey = settings.apiKeys.gemini;
    const cseId = settings.googleCseId;

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Google (Gemini) API key is required. Please add it in Settings > AI Settings." },
        { status: 400 }
      );
    }

    if (!cseId) {
      return NextResponse.json(
        { error: "Google Custom Search Engine ID is required. Please add it in Settings > AI Settings." },
        { status: 400 }
      );
    }

    // Build search query
    const searchQuery = buildSearchQuery(productName, productType, options);
    console.log("Image search query:", searchQuery);

    // Search for candidate images
    const imageUrls = await searchForImages(searchQuery, geminiApiKey, cseId, 5);
    console.log(`Found ${imageUrls.length} candidate images`);

    if (imageUrls.length === 0) {
      return NextResponse.json(
        { error: "No images found for this product. Try a different search term." },
        { status: 404 }
      );
    }

    // Fetch all candidate images
    const candidates: Array<{ url: string; base64: string; mimeType: string }> = [];

    for (const url of imageUrls) {
      const imageData = await fetchImageAsBase64(url);
      if (imageData) {
        candidates.push({ url, ...imageData });
      }
    }

    console.log(`Successfully fetched ${candidates.length} images`);

    if (candidates.length === 0) {
      return NextResponse.json(
        { error: "Could not download any candidate images. Please try again." },
        { status: 500 }
      );
    }

    // Build product description for vision evaluation
    const productDescription = [
      options?.brand,
      options?.model,
      productName,
      productType === "coffee" ? "coffee bag" : productType === "grinder" ? "coffee grinder" : "coffee brewer",
    ]
      .filter(Boolean)
      .join(" ");

    // Use Gemini Vision to pick the best image
    const bestIndex = await pickBestImage(candidates, productDescription, geminiApiKey);
    console.log(`Vision selected image ${bestIndex + 1} of ${candidates.length}`);

    const bestImage = candidates[bestIndex];

    const result: GenerateImageResponse = {
      imageBase64: bestImage.base64,
      mimeType: bestImage.mimeType,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in image search pipeline:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to find product image" },
      { status: 500 }
    );
  }
}
