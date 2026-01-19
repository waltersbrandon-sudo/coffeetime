import { LLMProvider, LLMModel, getModelById } from "@/lib/types/llm";

export interface LLMMessage {
  role: "user" | "assistant" | "system";
  content: string | LLMContentPart[];
}

export interface LLMContentPart {
  type: "text" | "image";
  text?: string;
  imageBase64?: string;
  mimeType?: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface LLMClientConfig {
  provider: LLMProvider;
  modelId: string;
  apiKey: string;
}

// Gemini API call
async function callGemini(
  model: LLMModel,
  messages: LLMMessage[],
  apiKey: string,
  systemPrompt?: string
): Promise<LLMResponse> {
  const contents = messages.map((msg) => {
    if (typeof msg.content === "string") {
      return {
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      };
    }

    // Handle multimodal content
    const parts = msg.content.map((part) => {
      if (part.type === "text") {
        return { text: part.text };
      } else if (part.type === "image" && part.imageBase64) {
        return {
          inlineData: {
            mimeType: part.mimeType || "image/jpeg",
            data: part.imageBase64,
          },
        };
      }
      return { text: "" };
    });

    return {
      role: msg.role === "assistant" ? "model" : "user",
      parts,
    };
  });

  const requestBody: any = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  if (systemPrompt) {
    requestBody.systemInstruction = {
      parts: [{ text: systemPrompt }],
    };
  }

  const response = await fetch(model.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Gemini API error");
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textContent) {
    throw new Error("No text response from Gemini");
  }

  return {
    content: textContent,
    model: model.id,
    usage: data.usageMetadata
      ? {
          inputTokens: data.usageMetadata.promptTokenCount,
          outputTokens: data.usageMetadata.candidatesTokenCount,
        }
      : undefined,
  };
}

// Anthropic API call
async function callAnthropic(
  model: LLMModel,
  messages: LLMMessage[],
  apiKey: string,
  systemPrompt?: string
): Promise<LLMResponse> {
  const formattedMessages = messages.map((msg) => {
    if (typeof msg.content === "string") {
      return {
        role: msg.role as "user" | "assistant",
        content: msg.content,
      };
    }

    // Handle multimodal content
    const content = msg.content.map((part) => {
      if (part.type === "text") {
        return { type: "text", text: part.text };
      } else if (part.type === "image" && part.imageBase64) {
        return {
          type: "image",
          source: {
            type: "base64",
            media_type: part.mimeType || "image/jpeg",
            data: part.imageBase64,
          },
        };
      }
      return { type: "text", text: "" };
    });

    return {
      role: msg.role as "user" | "assistant",
      content,
    };
  });

  const response = await fetch(model.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model.id,
      max_tokens: 2048,
      messages: formattedMessages,
      ...(systemPrompt && { system: systemPrompt }),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Anthropic API error");
  }

  const data = await response.json();
  const textContent = data.content?.find((b: any) => b.type === "text")?.text;

  if (!textContent) {
    throw new Error("No text response from Claude");
  }

  return {
    content: textContent,
    model: model.id,
    usage: data.usage
      ? {
          inputTokens: data.usage.input_tokens,
          outputTokens: data.usage.output_tokens,
        }
      : undefined,
  };
}

// OpenAI API call
async function callOpenAI(
  model: LLMModel,
  messages: LLMMessage[],
  apiKey: string,
  systemPrompt?: string
): Promise<LLMResponse> {
  const formattedMessages: any[] = [];

  if (systemPrompt) {
    formattedMessages.push({
      role: "system",
      content: systemPrompt,
    });
  }

  for (const msg of messages) {
    if (typeof msg.content === "string") {
      formattedMessages.push({
        role: msg.role,
        content: msg.content,
      });
    } else {
      // Handle multimodal content
      const content = msg.content.map((part) => {
        if (part.type === "text") {
          return { type: "text", text: part.text };
        } else if (part.type === "image" && part.imageBase64) {
          return {
            type: "image_url",
            image_url: {
              url: `data:${part.mimeType || "image/jpeg"};base64,${part.imageBase64}`,
            },
          };
        }
        return { type: "text", text: "" };
      });

      formattedMessages.push({
        role: msg.role,
        content,
      });
    }
  }

  const response = await fetch(model.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model.id,
      messages: formattedMessages,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "OpenAI API error");
  }

  const data = await response.json();
  const textContent = data.choices?.[0]?.message?.content;

  if (!textContent) {
    throw new Error("No text response from OpenAI");
  }

  return {
    content: textContent,
    model: model.id,
    usage: data.usage
      ? {
          inputTokens: data.usage.prompt_tokens,
          outputTokens: data.usage.completion_tokens,
        }
      : undefined,
  };
}

// Main LLM client function
export async function callLLM(
  config: LLMClientConfig,
  messages: LLMMessage[],
  systemPrompt?: string
): Promise<LLMResponse> {
  const model = getModelById(config.modelId);
  if (!model) {
    throw new Error(`Model not found: ${config.modelId}`);
  }

  switch (config.provider) {
    case "gemini":
      return callGemini(model, messages, config.apiKey, systemPrompt);
    case "anthropic":
      return callAnthropic(model, messages, config.apiKey, systemPrompt);
    case "openai":
      return callOpenAI(model, messages, config.apiKey, systemPrompt);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}
