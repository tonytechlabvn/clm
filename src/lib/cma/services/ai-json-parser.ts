// Shared utility for parsing JSON from AI responses
// Handles markdown fences, surrounding text, and unescaped control characters

/** Safely parse JSON from AI response text */
export function parseAiJson(text: string): Record<string, unknown> {
  let cleaned = text.trim();

  // Strip markdown code fences
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  // Extract JSON object if surrounded by other text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleaned = jsonMatch[0];

  // Attempt 1: direct parse
  try {
    return JSON.parse(cleaned);
  } catch {
    // continue to fixup
  }

  // Attempt 2: walk character-by-character to escape unescaped control
  // characters (newlines, tabs, carriage returns) inside JSON string values
  let fixed = "";
  let inString = false;
  let i = 0;
  while (i < cleaned.length) {
    const ch = cleaned[i];
    if (inString) {
      if (ch === "\\") {
        // Keep existing escape sequences as-is
        fixed += ch + (cleaned[i + 1] || "");
        i += 2;
        continue;
      }
      if (ch === '"') {
        inString = false;
        fixed += ch;
      } else if (ch === "\n") {
        fixed += "\\n";
      } else if (ch === "\r") {
        fixed += "\\r";
      } else if (ch === "\t") {
        fixed += "\\t";
      } else {
        fixed += ch;
      }
    } else {
      if (ch === '"') {
        inString = true;
      }
      fixed += ch;
    }
    i++;
  }

  try {
    return JSON.parse(fixed);
  } catch (err) {
    console.error("[parseAiJson] Failed after fixup. First 500 chars:", fixed.slice(0, 500));
    throw new Error("Failed to parse AI response as JSON");
  }
}
