// AI settings service — reads/writes provider config from SystemSetting table
// Cached in memory for performance, invalidated on save

import { prisma } from "@/lib/prisma-client";
import type { AIProvider } from "@/types";

export interface AiProviderConfig {
  provider: AIProvider;
  model: string;
  apiKey: string; // encrypted in DB, decrypted on read
  baseUrl?: string; // for local LLM only
}

export interface AiSettings {
  activeProvider: AIProvider;
  gemini: { model: string; apiKey: string };
  openai: { model: string; apiKey: string };
  claude: { model: string; apiKey: string };
  local: { model: string; apiKey: string; baseUrl: string };
  unsplashApiKey: string;
  maxTokensAnalysis: number;
  maxTokensRewrite: number;
}

const SETTINGS_KEYS = {
  activeProvider: "ai_active_provider",
  geminiModel: "ai_gemini_model",
  geminiApiKey: "ai_gemini_api_key",
  openaiModel: "ai_openai_model",
  openaiApiKey: "ai_openai_api_key",
  claudeModel: "ai_claude_model",
  claudeApiKey: "ai_claude_api_key",
  localModel: "ai_local_model",
  localApiKey: "ai_local_api_key",
  localBaseUrl: "ai_local_base_url",
  unsplashApiKey: "ai_unsplash_api_key",
  maxTokensAnalysis: "ai_max_tokens_analysis",
  maxTokensRewrite: "ai_max_tokens_rewrite",
} as const;

const DEFAULTS: AiSettings = {
  activeProvider: "gemini",
  gemini: { model: "gemini-2.0-flash", apiKey: "" },
  openai: { model: "gpt-4o-mini", apiKey: "" },
  claude: { model: "claude-sonnet-4-20250514", apiKey: "" },
  local: { model: "llama3", apiKey: "", baseUrl: "http://localhost:11434/v1" },
  unsplashApiKey: "",
  maxTokensAnalysis: 4096,
  maxTokensRewrite: 16384,
};

// In-memory cache (invalidated on save)
let cachedSettings: AiSettings | null = null;

/** Load all AI settings from DB, falling back to env vars then defaults */
export async function getAiSettings(): Promise<AiSettings> {
  if (cachedSettings) return cachedSettings;

  const rows = await prisma.systemSetting.findMany({
    where: { key: { startsWith: "ai_" } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const settings: AiSettings = {
    activeProvider: (map.get(SETTINGS_KEYS.activeProvider) as AIProvider) || envFallback("activeProvider"),
    gemini: {
      model: map.get(SETTINGS_KEYS.geminiModel) || DEFAULTS.gemini.model,
      apiKey: map.get(SETTINGS_KEYS.geminiApiKey) || process.env.GEMINI_API_KEY || "",
    },
    openai: {
      model: map.get(SETTINGS_KEYS.openaiModel) || DEFAULTS.openai.model,
      apiKey: map.get(SETTINGS_KEYS.openaiApiKey) || process.env.OPENAI_API_KEY || "",
    },
    claude: {
      model: map.get(SETTINGS_KEYS.claudeModel) || DEFAULTS.claude.model,
      apiKey: map.get(SETTINGS_KEYS.claudeApiKey) || process.env.ANTHROPIC_API_KEY || "",
    },
    local: {
      model: map.get(SETTINGS_KEYS.localModel) || DEFAULTS.local.model,
      apiKey: map.get(SETTINGS_KEYS.localApiKey) || "",
      baseUrl: map.get(SETTINGS_KEYS.localBaseUrl) || DEFAULTS.local.baseUrl,
    },
    unsplashApiKey: map.get(SETTINGS_KEYS.unsplashApiKey) || process.env.UNSPLASH_ACCESS_KEY || "",
    maxTokensAnalysis: parseInt(map.get(SETTINGS_KEYS.maxTokensAnalysis) || "") || DEFAULTS.maxTokensAnalysis,
    maxTokensRewrite: parseInt(map.get(SETTINGS_KEYS.maxTokensRewrite) || "") || DEFAULTS.maxTokensRewrite,
  };

  cachedSettings = settings;
  return settings;
}

/** Get the active provider's config ready for callAI() */
export async function getActiveAiConfig(): Promise<AiProviderConfig> {
  const s = await getAiSettings();
  const providerMap: Record<AIProvider, { model: string; apiKey: string; baseUrl?: string }> = {
    gemini: s.gemini,
    openai: s.openai,
    claude: s.claude,
    local: { ...s.local },
  };
  const config = providerMap[s.activeProvider];
  if (!config?.apiKey && s.activeProvider !== "local") {
    throw new Error(`No API key configured for active provider: ${s.activeProvider}`);
  }
  return {
    provider: s.activeProvider,
    model: config.model,
    apiKey: config.apiKey,
    baseUrl: s.activeProvider === "local" ? s.local.baseUrl : undefined,
  };
}

/** Save AI settings to DB and invalidate cache */
export async function saveAiSettings(updates: Partial<AiSettings>): Promise<void> {
  const writes: { key: string; value: string }[] = [];

  if (updates.activeProvider) writes.push({ key: SETTINGS_KEYS.activeProvider, value: updates.activeProvider });
  if (updates.gemini?.model) writes.push({ key: SETTINGS_KEYS.geminiModel, value: updates.gemini.model });
  if (updates.gemini?.apiKey) writes.push({ key: SETTINGS_KEYS.geminiApiKey, value: updates.gemini.apiKey });
  if (updates.openai?.model) writes.push({ key: SETTINGS_KEYS.openaiModel, value: updates.openai.model });
  if (updates.openai?.apiKey) writes.push({ key: SETTINGS_KEYS.openaiApiKey, value: updates.openai.apiKey });
  if (updates.claude?.model) writes.push({ key: SETTINGS_KEYS.claudeModel, value: updates.claude.model });
  if (updates.claude?.apiKey) writes.push({ key: SETTINGS_KEYS.claudeApiKey, value: updates.claude.apiKey });
  if (updates.local?.model) writes.push({ key: SETTINGS_KEYS.localModel, value: updates.local.model });
  if (updates.local?.apiKey) writes.push({ key: SETTINGS_KEYS.localApiKey, value: updates.local.apiKey });
  if (updates.local?.baseUrl) writes.push({ key: SETTINGS_KEYS.localBaseUrl, value: updates.local.baseUrl });
  if (updates.unsplashApiKey) writes.push({ key: SETTINGS_KEYS.unsplashApiKey, value: updates.unsplashApiKey });
  if (updates.maxTokensAnalysis !== undefined) writes.push({ key: SETTINGS_KEYS.maxTokensAnalysis, value: String(updates.maxTokensAnalysis) });
  if (updates.maxTokensRewrite !== undefined) writes.push({ key: SETTINGS_KEYS.maxTokensRewrite, value: String(updates.maxTokensRewrite) });

  for (const { key, value } of writes) {
    await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  cachedSettings = null; // invalidate cache
}

/** Detect active provider from env vars when no DB setting exists */
function envFallback(key: "activeProvider"): AIProvider {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  return "gemini";
}

/** Mask API key for display — show last 4 chars only */
export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return key ? "••••" : "";
  return "••••" + key.slice(-4);
}

/** Known models per provider */
export const PROVIDER_MODELS = {
  gemini: [
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (65K output)" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (65K output)" },
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
    { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  ],
  openai: [
    { id: "gpt-5.2", label: "GPT-5.2 (128K output)" },
    { id: "gpt-4o-mini", label: "GPT-4o Mini" },
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "gpt-4-turbo", label: "GPT-4 Turbo" },
  ],
  claude: [
    { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
    { id: "claude-opus-4-20250514", label: "Claude Opus 4" },
    { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
    { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
  ],
  local: [
    { id: "llama3", label: "Llama 3" },
    { id: "mistral", label: "Mistral" },
    { id: "codellama", label: "Code Llama" },
  ],
} as const;
