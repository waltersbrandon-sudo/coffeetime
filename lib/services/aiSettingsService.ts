import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { LLMProvider } from "@/lib/types/llm";

export type ImageProvider = "google" | "openai";

export interface AISettings {
  selectedProvider: LLMProvider;
  selectedModelId: string;
  apiKeys: {
    gemini?: string;
    anthropic?: string;
    openai?: string;
  };
  // Image generation settings
  imageUseTextSettings: boolean; // When true, uses text provider's settings for images
  imageProvider: ImageProvider;
  imageApiKeys: {
    google?: string;
    openai?: string;
  };
  updatedAt?: any;
}

const DEFAULT_SETTINGS: AISettings = {
  selectedProvider: "gemini",
  selectedModelId: "gemini-3-flash-preview",
  apiKeys: {},
  imageUseTextSettings: true,
  imageProvider: "google",
  imageApiKeys: {},
};

function getSettingsDoc(userId: string) {
  return doc(db, "users", userId, "settings", "ai");
}

export async function getAISettings(userId: string): Promise<AISettings> {
  const settingsRef = getSettingsDoc(userId);
  const snapshot = await getDoc(settingsRef);

  if (!snapshot.exists()) {
    return DEFAULT_SETTINGS;
  }

  return {
    ...DEFAULT_SETTINGS,
    ...snapshot.data(),
  } as AISettings;
}

export async function updateAISettings(
  userId: string,
  settings: Partial<AISettings>
): Promise<void> {
  const settingsRef = getSettingsDoc(userId);

  await setDoc(
    settingsRef,
    {
      ...settings,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function setAPIKey(
  userId: string,
  provider: LLMProvider,
  apiKey: string
): Promise<void> {
  const settingsRef = getSettingsDoc(userId);

  await setDoc(
    settingsRef,
    {
      apiKeys: {
        [provider]: apiKey,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function removeAPIKey(
  userId: string,
  provider: LLMProvider
): Promise<void> {
  const currentSettings = await getAISettings(userId);
  const newApiKeys = { ...currentSettings.apiKeys };
  delete newApiKeys[provider];

  const settingsRef = getSettingsDoc(userId);
  await setDoc(
    settingsRef,
    {
      apiKeys: newApiKeys,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function selectModel(
  userId: string,
  provider: LLMProvider,
  modelId: string
): Promise<void> {
  const settingsRef = getSettingsDoc(userId);

  await setDoc(
    settingsRef,
    {
      selectedProvider: provider,
      selectedModelId: modelId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Gets the effective image generation settings.
 * If imageUseTextSettings is true, maps text provider to image provider.
 */
export function getEffectiveImageSettings(settings: AISettings): {
  provider: ImageProvider;
  apiKey: string | undefined;
} {
  if (settings.imageUseTextSettings) {
    // Map text provider to image provider
    // Gemini -> Google, OpenAI -> OpenAI, Anthropic -> Google (as fallback since Anthropic doesn't have image gen)
    const provider: ImageProvider = settings.selectedProvider === "openai" ? "openai" : "google";
    const apiKey = provider === "google"
      ? settings.apiKeys.gemini
      : settings.apiKeys.openai;
    return { provider, apiKey };
  } else {
    // Use dedicated image settings
    const apiKey = settings.imageProvider === "google"
      ? settings.imageApiKeys.google
      : settings.imageApiKeys.openai;
    return { provider: settings.imageProvider, apiKey };
  }
}
