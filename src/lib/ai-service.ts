import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { AIProvider, AIResponse } from "@/types";

/** Timeout for all AI provider calls (2 minutes) */
const AI_TIMEOUT_MS = 120_000;

// SDK client caches — avoids re-creating clients per request
const openaiClients = new Map<string, OpenAI>();
const anthropicClients = new Map<string, Anthropic>();

function getOpenAIClient(apiKey: string, baseURL?: string): OpenAI {
  const cacheKey = `${apiKey}:${baseURL || ""}`;
  let client = openaiClients.get(cacheKey);
  if (!client) {
    client = new OpenAI({ apiKey: apiKey || "ollama", baseURL, timeout: AI_TIMEOUT_MS });
    openaiClients.set(cacheKey, client);
  }
  return client;
}

function getAnthropicClient(apiKey: string): Anthropic {
  let client = anthropicClients.get(apiKey);
  if (!client) {
    client = new Anthropic({ apiKey, timeout: AI_TIMEOUT_MS });
    anthropicClients.set(apiKey, client);
  }
  return client;
}

/** Check if an error is a timeout/abort error */
export function isAITimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.name === "AbortError" ||
      error.message.includes("AI request timeout") ||
      error.message.includes("timed out") ||
      error.message.includes("timeout")
    );
  }
  return false;
}

// Per-model maximum output token limits
const MODEL_MAX_TOKENS: Record<string, number> = {
  "gemini-2.0-flash": 8192,
  "gemini-2.0-flash-lite": 8192,
  "gemini-1.5-pro": 8192,
  "gemini-1.5-flash": 8192,
  "gemini-2.5-pro": 65536,
  "gemini-2.5-flash": 65536,
  "gemini-3.0-pro": 65536,
  "gemini-3.0-flash": 65536,
  "gemini-3.1-pro-preview": 65536,
  "gemini-3.1-flash": 65536,
  "gemini-3.1-flash-lite": 65536,
  "gpt-4o-mini": 16384,
  "gpt-4o": 16384,
  "gpt-4-turbo": 4096,
  "gpt-5.2": 128000,
  "claude-sonnet-4-20250514": 8192,
  "claude-opus-4-20250514": 8192,
  "claude-3-5-sonnet-20241022": 8192,
  "claude-3-5-haiku-20241022": 8192,
};

// Gemini thinking models use thinking tokens that consume the maxOutputTokens budget.
// We multiply the requested tokens by this factor to ensure enough room for actual output.
const THINKING_MODEL_PATTERNS = ["gemini-2.5-", "gemini-3.0-", "gemini-3.1-"];
const THINKING_TOKEN_MULTIPLIER = 4;

/** Check if a model is a thinking model that uses thinking tokens */
function isThinkingModel(model: string): boolean {
  return THINKING_MODEL_PATTERNS.some((p) => model.startsWith(p));
}

const GEMINI_FALLBACK = "gemini-2.0-flash-lite";

function clampTokens(maxTokens: number, model: string): number {
  const limit = MODEL_MAX_TOKENS[model];
  if (limit && maxTokens > limit) {
    console.log(`[AI] Clamping maxTokens from ${maxTokens} to ${limit} for ${model}`);
    return limit;
  }
  return maxTokens;
}

async function callGeminiWithApiKey(
  apiKey: string,
  prompt: string,
  maxTokens: number,
  primaryModel: string,
  retries: number = 2
): Promise<AIResponse> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = [primaryModel];
  if (primaryModel !== GEMINI_FALLBACK) models.push(GEMINI_FALLBACK);

  for (const modelName of models) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Thinking models consume maxOutputTokens for both thinking and output,
        // so we multiply the requested tokens to ensure enough room for actual content
        const effectiveTokens = isThinkingModel(modelName)
          ? maxTokens * THINKING_TOKEN_MULTIPLIER
          : maxTokens;
        const clampedTokens = clampTokens(effectiveTokens, modelName);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { maxOutputTokens: clampedTokens },
        });
        const result = await Promise.race([
          model.generateContent(prompt),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("AI request timeout")), AI_TIMEOUT_MS)
          ),
        ]);
        const response = result.response;

        // Check if response was blocked by safety filters
        if (response.promptFeedback?.blockReason) {
          throw new Error(`AI response blocked: ${response.promptFeedback.blockReason}. Try rephrasing your content.`);
        }

        let text: string;
        try {
          text = response.text();
        } catch {
          // response.text() throws when no candidates exist (safety block or empty response)
          const finishReason = response.candidates?.[0]?.finishReason;
          throw new Error(`AI returned empty response${finishReason ? ` (reason: ${finishReason})` : ""}. Try again or use a different model.`);
        }

        if (!text.trim()) {
          throw new Error("AI returned empty response. Try again or use a different model.");
        }

        const meta = response.usageMetadata;
        return {
          text,
          usage: {
            promptTokens: meta?.promptTokenCount ?? 0,
            completionTokens: meta?.candidatesTokenCount ?? 0,
            totalTokens: meta?.totalTokenCount ?? 0,
            model: modelName,
          },
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        const isRateLimit = message.includes("429") || message.includes("quota");
        if (isRateLimit && attempt < retries) {
          await new Promise((r) => setTimeout(r, (attempt + 1) * 5000));
          continue;
        }
        if (isRateLimit) break;
        throw err;
      }
    }
  }

  throw new Error(
    "Gemini rate limit exceeded. Please wait 30 seconds and try again."
  );
}

export async function callAI(
  provider: AIProvider,
  apiKey: string,
  prompt: string,
  maxTokens: number = 4096,
  modelId?: string,
  baseUrl?: string
): Promise<AIResponse> {
  switch (provider) {
    case "gemini": {
      const geminiModel = modelId || "gemini-2.0-flash";
      const fallbackKey = apiKey || process.env.GEMINI_API_KEY || "";
      return callGeminiWithApiKey(fallbackKey, prompt, maxTokens, geminiModel);
    }

    case "openai": {
      const openaiModel = modelId || "gpt-4o-mini";
      const openai = getOpenAIClient(apiKey);
      const clampedTokens = clampTokens(maxTokens, openaiModel);
      const LEGACY_MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"];
      const isLegacy = LEGACY_MODELS.includes(openaiModel);
      const tokenParam = isLegacy
        ? { max_tokens: clampedTokens }
        : { max_completion_tokens: clampedTokens };
      const completion = await openai.chat.completions.create({
        model: openaiModel,
        ...tokenParam,
        messages: [{ role: "user", content: prompt }],
      });
      const choice = completion.choices[0];
      const text = choice?.message?.content ?? "";
      const refusal = choice?.message?.refusal;
      if (refusal) {
        throw new Error(`AI refused the request: ${refusal}`);
      }
      if (!text.trim()) {
        const reason = choice?.finish_reason;
        console.error(`[AI] OpenAI ${openaiModel} returned empty content. finish_reason=${reason}`);
        throw new Error(`AI returned empty response${reason ? ` (reason: ${reason})` : ""}. Try again or use a different model.`);
      }
      const u = completion.usage;
      return {
        text,
        usage: {
          promptTokens: u?.prompt_tokens ?? 0,
          completionTokens: u?.completion_tokens ?? 0,
          totalTokens: u?.total_tokens ?? 0,
          model: openaiModel,
        },
      };
    }

    case "claude": {
      const client = getAnthropicClient(apiKey);
      const claudeModel = modelId || "claude-sonnet-4-20250514";
      const clampedTokens = clampTokens(maxTokens, claudeModel);
      const message = await client.messages.create({
        model: claudeModel,
        max_tokens: clampedTokens,
        messages: [{ role: "user", content: prompt }],
      });
      return {
        text: message.content[0].type === "text" ? message.content[0].text : "",
        usage: {
          promptTokens: message.usage?.input_tokens ?? 0,
          completionTokens: message.usage?.output_tokens ?? 0,
          totalTokens: (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0),
          model: claudeModel,
        },
      };
    }

    case "local": {
      const localModel = modelId || "llama3";
      const localBaseUrl = baseUrl || "http://localhost:11434/v1";
      const client = getOpenAIClient(apiKey || "ollama", localBaseUrl);
      const clampedTokens = clampTokens(maxTokens, localModel);
      const completion = await client.chat.completions.create({
        model: localModel,
        max_tokens: clampedTokens,
        messages: [{ role: "user", content: prompt }],
      });
      const lu = completion.usage;
      return {
        text: completion.choices[0]?.message?.content || "",
        usage: {
          promptTokens: lu?.prompt_tokens ?? 0,
          completionTokens: lu?.completion_tokens ?? 0,
          totalTokens: lu?.total_tokens ?? 0,
          model: localModel,
        },
      };
    }

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
