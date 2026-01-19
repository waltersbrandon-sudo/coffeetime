"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  getAISettings,
  updateAISettings,
  AISettings,
} from "@/lib/services/aiSettingsService";
import {
  llmCatalog,
  LLMProvider,
  LLMModel,
  getModelsByProvider,
  getModelById,
} from "@/lib/types/llm";

function BackIcon({ className }: { className?: string }) {
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
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
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
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
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
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
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
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const providerNames: Record<LLMProvider, string> = {
  gemini: "Google Gemini",
  anthropic: "Anthropic Claude",
  openai: "OpenAI",
};

const providerDescriptions: Record<LLMProvider, string> = {
  gemini: "Default provider with Gemini 3 Flash",
  anthropic: "Claude models from Anthropic",
  openai: "GPT models from OpenAI",
};

export default function AISettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AISettings | null>(null);

  // Form state
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>("gemini");
  const [selectedModelId, setSelectedModelId] = useState(llmCatalog.defaultModelId);
  const [apiKeys, setApiKeys] = useState<Record<LLMProvider, string>>({
    gemini: "",
    anthropic: "",
    openai: "",
  });
  const [showKeys, setShowKeys] = useState<Record<LLMProvider, boolean>>({
    gemini: false,
    anthropic: false,
    openai: false,
  });

  // Image search settings (default CSE provided)
  const [googleCseId, setGoogleCseId] = useState("056a1192ca9c74fac");

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      if (!user) return;

      try {
        const savedSettings = await getAISettings(user.uid);
        setSettings(savedSettings);
        setSelectedProvider(savedSettings.selectedProvider);
        setSelectedModelId(savedSettings.selectedModelId);
        setApiKeys({
          gemini: savedSettings.apiKeys.gemini || "",
          anthropic: savedSettings.apiKeys.anthropic || "",
          openai: savedSettings.apiKeys.openai || "",
        });
        // Load image search settings (use default if not set)
        setGoogleCseId(savedSettings.googleCseId || "056a1192ca9c74fac");
      } catch (error) {
        console.error("Failed to load AI settings:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [user]);

  // Get models for selected provider
  const availableModels = getModelsByProvider(selectedProvider);

  // Update selected model when provider changes
  useEffect(() => {
    const models = getModelsByProvider(selectedProvider);
    if (models.length > 0 && !models.find((m) => m.id === selectedModelId)) {
      setSelectedModelId(models[0].id);
    }
  }, [selectedProvider, selectedModelId]);

  const selectedModel = getModelById(selectedModelId);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Filter out empty keys - Firestore doesn't accept undefined values
      const filteredApiKeys: Record<string, string> = {};
      if (apiKeys.gemini) filteredApiKeys.gemini = apiKeys.gemini;
      if (apiKeys.anthropic) filteredApiKeys.anthropic = apiKeys.anthropic;
      if (apiKeys.openai) filteredApiKeys.openai = apiKeys.openai;

      await updateAISettings(user.uid, {
        selectedProvider,
        selectedModelId,
        apiKeys: filteredApiKeys,
        googleCseId: googleCseId || undefined,
      });

      toast({
        title: "Settings saved",
        description: "Your AI preferences have been updated.",
      });
    } catch (error) {
      console.error("Failed to save AI settings:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleShowKey = (provider: LLMProvider) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const hasApiKey = (provider: LLMProvider) => {
    return apiKeys[provider].length > 0;
  };

  if (loading) {
    return (
      <main className="p-6">
        <div className="flex items-center justify-center py-12">
          <svg
            className="animate-spin h-8 w-8 text-accent"
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
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-lg hover:bg-accent/10 transition-colors"
        >
          <BackIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-purple-500" />
            AI Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure AI providers for voice and image features
          </p>
        </div>
      </div>

      {/* Provider Selection */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Active Provider</h2>

        <div className="space-y-3">
          {(["gemini", "anthropic", "openai"] as LLMProvider[]).map((provider) => (
            <button
              key={provider}
              onClick={() => setSelectedProvider(provider)}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-colors text-left ${
                selectedProvider === provider
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-border bg-card hover:bg-card/80"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedProvider === provider
                    ? "bg-purple-500 text-white"
                    : "bg-muted"
                }`}
              >
                {provider === "gemini" && <span className="text-lg">G</span>}
                {provider === "anthropic" && <span className="text-lg">A</span>}
                {provider === "openai" && <span className="text-lg">O</span>}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{providerNames[provider]}</p>
                  {provider === "gemini" && (
                    <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-500 rounded-full">
                      Default
                    </span>
                  )}
                  {hasApiKey(provider) && (
                    <CheckIcon className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {providerDescriptions[provider]}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Model Selection */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Model</h2>

        <Select value={selectedModelId} onValueChange={setSelectedModelId}>
          <SelectTrigger>
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div>
                  <span className="font-medium">{model.name}</span>
                  {model.supportsVision && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (Vision)
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedModel && (
          <div className="p-4 rounded-lg bg-card border border-border space-y-2">
            <p className="text-sm text-muted-foreground">{selectedModel.description}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Context: </span>
                <span className="font-mono">
                  {(selectedModel.contextWindow / 1000).toFixed(0)}K tokens
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Vision: </span>
                <span>{selectedModel.supportsVision ? "Yes" : "No"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Input: </span>
                <span className="font-mono">${selectedModel.pricePerMillionInput}/1M</span>
              </div>
              <div>
                <span className="text-muted-foreground">Output: </span>
                <span className="font-mono">${selectedModel.pricePerMillionOutput}/1M</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* API Keys */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">API Keys</h2>
        <p className="text-sm text-muted-foreground">
          Enter your API keys for each provider you want to use. Keys are stored securely.
        </p>

        <div className="space-y-4">
          {(["gemini", "anthropic", "openai"] as LLMProvider[]).map((provider) => (
            <div key={provider} className="space-y-2">
              <Label htmlFor={`apikey-${provider}`}>
                {providerNames[provider]} API Key
              </Label>
              <div className="relative">
                <Input
                  id={`apikey-${provider}`}
                  type={showKeys[provider] ? "text" : "password"}
                  value={apiKeys[provider]}
                  onChange={(e) =>
                    setApiKeys((prev) => ({ ...prev, [provider]: e.target.value }))
                  }
                  placeholder={`Enter your ${providerNames[provider]} API key`}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey(provider)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKeys[provider] ? (
                    <EyeOffIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {provider === "gemini" && "Get your key at ai.google.dev"}
                {provider === "anthropic" && "Get your key at console.anthropic.com"}
                {provider === "openai" && "Get your key at platform.openai.com"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Image Search Settings */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <svg
            className="w-5 h-5 text-purple-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
          Product Images
        </h2>
        <p className="text-sm text-muted-foreground">
          Automatically find real product photos using Google Image Search and AI curation
        </p>

        <div className="p-4 rounded-lg border border-border bg-card space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="google-cse-id">Google Custom Search Engine ID</Label>
              {googleCseId !== "056a1192ca9c74fac" && (
                <button
                  type="button"
                  onClick={() => setGoogleCseId("056a1192ca9c74fac")}
                  className="text-xs text-purple-500 hover:underline"
                >
                  Reset to default
                </button>
              )}
            </div>
            <Input
              id="google-cse-id"
              type="text"
              value={googleCseId}
              onChange={(e) => setGoogleCseId(e.target.value)}
              placeholder="Enter your Search Engine ID"
            />
            {googleCseId === "056a1192ca9c74fac" ? (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckIcon className="w-3 h-3" />
                Using default CoffeeTime search engine
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Using custom search engine. Create one at{" "}
                <a
                  href="https://cse.google.com/all"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-500 hover:underline"
                >
                  cse.google.com
                </a>
              </p>
            )}
          </div>

          <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-2">
            <p className="font-medium">How it works:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Google searches for product images</li>
              <li>AI evaluates candidates for quality and accuracy</li>
              <li>Best matching photo is saved to your library</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-2">
              Uses your Gemini API key for both search and AI evaluation. First 100 searches/day are free.
            </p>
          </div>
        </div>
      </section>

      {/* Model Catalog */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Available Models</h2>
        <p className="text-sm text-muted-foreground">
          All supported models across providers
        </p>

        <div className="space-y-2">
          {llmCatalog.models.map((model) => (
            <div
              key={model.id}
              className="p-3 rounded-lg bg-card border border-border"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{model.name}</span>
                <span className="text-xs px-2 py-0.5 bg-muted rounded">
                  {providerNames[model.provider]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {model.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Save Button */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 text-base font-medium"
        >
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </main>
  );
}
