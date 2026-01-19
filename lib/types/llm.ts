export type LLMProvider = "gemini" | "anthropic" | "openai";

export interface LLMModel {
  id: string;
  provider: LLMProvider;
  name: string;
  description: string;
  contextWindow: number;
  outputLimit: number;
  supportsVision: boolean;
  endpoint: string;
  pricePerMillionInput: number;
  pricePerMillionOutput: number;
  knowledgeCutoff: string;
}

export interface LLMCatalog {
  models: LLMModel[];
  defaultModelId: string;
}

// Pre-populated LLM catalog with models available as of January 2025
export const llmCatalog: LLMCatalog = {
  defaultModelId: "gemini-3-flash-preview",
  models: [
    // Google Gemini Models
    {
      id: "gemini-3-flash-preview",
      provider: "gemini",
      name: "Gemini 3 Flash",
      description: "Latest 3-series model with Pro-level intelligence at Flash speed and pricing",
      contextWindow: 1000000,
      outputLimit: 65536,
      supportsVision: true,
      endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",
      pricePerMillionInput: 0.50,
      pricePerMillionOutput: 3.00,
      knowledgeCutoff: "January 2025",
    },
    {
      id: "gemini-2.0-flash",
      provider: "gemini",
      name: "Gemini 2.0 Flash",
      description: "Fast and efficient multimodal model",
      contextWindow: 1000000,
      outputLimit: 8192,
      supportsVision: true,
      endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      pricePerMillionInput: 0.10,
      pricePerMillionOutput: 0.40,
      knowledgeCutoff: "August 2024",
    },
    // Anthropic Claude Models
    {
      id: "claude-sonnet-4-20250514",
      provider: "anthropic",
      name: "Claude Sonnet 4",
      description: "Balanced performance and speed, excellent for code and analysis",
      contextWindow: 200000,
      outputLimit: 8192,
      supportsVision: true,
      endpoint: "https://api.anthropic.com/v1/messages",
      pricePerMillionInput: 3.00,
      pricePerMillionOutput: 15.00,
      knowledgeCutoff: "April 2024",
    },
    {
      id: "claude-opus-4-5-20251101",
      provider: "anthropic",
      name: "Claude Opus 4.5",
      description: "Most capable Claude model for complex reasoning",
      contextWindow: 200000,
      outputLimit: 8192,
      supportsVision: true,
      endpoint: "https://api.anthropic.com/v1/messages",
      pricePerMillionInput: 15.00,
      pricePerMillionOutput: 75.00,
      knowledgeCutoff: "January 2025",
    },
    {
      id: "claude-3-5-haiku-20241022",
      provider: "anthropic",
      name: "Claude 3.5 Haiku",
      description: "Fast and cost-effective for simple tasks",
      contextWindow: 200000,
      outputLimit: 8192,
      supportsVision: true,
      endpoint: "https://api.anthropic.com/v1/messages",
      pricePerMillionInput: 0.25,
      pricePerMillionOutput: 1.25,
      knowledgeCutoff: "April 2024",
    },
    // OpenAI GPT Models
    {
      id: "gpt-4o",
      provider: "openai",
      name: "GPT-4o",
      description: "Multimodal flagship model with vision and text capabilities",
      contextWindow: 128000,
      outputLimit: 16384,
      supportsVision: true,
      endpoint: "https://api.openai.com/v1/chat/completions",
      pricePerMillionInput: 2.50,
      pricePerMillionOutput: 10.00,
      knowledgeCutoff: "October 2023",
    },
    {
      id: "gpt-4o-mini",
      provider: "openai",
      name: "GPT-4o Mini",
      description: "Affordable and fast version of GPT-4o",
      contextWindow: 128000,
      outputLimit: 16384,
      supportsVision: true,
      endpoint: "https://api.openai.com/v1/chat/completions",
      pricePerMillionInput: 0.15,
      pricePerMillionOutput: 0.60,
      knowledgeCutoff: "October 2023",
    },
    {
      id: "gpt-4.1",
      provider: "openai",
      name: "GPT-4.1",
      description: "Excels at instruction following with 1M context window",
      contextWindow: 1000000,
      outputLimit: 32768,
      supportsVision: true,
      endpoint: "https://api.openai.com/v1/chat/completions",
      pricePerMillionInput: 2.00,
      pricePerMillionOutput: 8.00,
      knowledgeCutoff: "December 2024",
    },
  ],
};

export function getModelById(modelId: string): LLMModel | undefined {
  return llmCatalog.models.find((m) => m.id === modelId);
}

export function getModelsByProvider(provider: LLMProvider): LLMModel[] {
  return llmCatalog.models.filter((m) => m.provider === provider);
}

export function getDefaultModel(): LLMModel {
  return getModelById(llmCatalog.defaultModelId) || llmCatalog.models[0];
}
