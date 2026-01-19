import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { LLMProvider } from "@/lib/types/llm";

export interface AISettings {
  selectedProvider: LLMProvider;
  selectedModelId: string;
  apiKeys: {
    gemini?: string;
    anthropic?: string;
    openai?: string;
  };
  // Image search settings (Search & Select pipeline)
  googleCseId?: string; // Google Custom Search Engine ID
  updatedAt?: any;
}

const DEFAULT_SETTINGS: AISettings = {
  selectedProvider: "gemini",
  selectedModelId: "gemini-3-flash-preview",
  apiKeys: {},
  googleCseId: "056a1192ca9c74fac", // Default CoffeeTime product image search engine
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

