/** Supported AI provider identifiers */
export type AIProvider = "gemini" | "openai" | "claude" | "local";

/** AI call response with token usage */
export interface AIResponse {
  text: string;
  usage: AIUsage;
}

/** Token usage metadata from AI provider */
export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
}
