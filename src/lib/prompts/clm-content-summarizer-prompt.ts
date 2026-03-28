// Prompt builder for AI-powered content summarization

/**
 * Builds a prompt that instructs the AI to summarize educational content.
 * Output: JSON object — no markdown wrappers, no extra text.
 */
export function buildContentSummarizerPrompt(
  content: string,
  maxLength?: number
): string {
  const lengthInstruction = maxLength
    ? `Keep the "summary" field under ${maxLength} characters.`
    : `Keep the "summary" field concise (2-4 sentences).`;

  return `You are an educational content specialist. Analyze the content below and produce a structured summary.

OUTPUT FORMAT: Respond with ONLY a valid JSON object. No markdown code blocks, no explanations, no extra text.

Schema:
{
  "title": "A concise descriptive title for this content",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "summary": "Concise paragraph summarizing the main ideas",
  "prerequisites": ["Prerequisite concept 1", "Prerequisite concept 2"]
}

Rules:
- "title": 5-10 words, descriptive
- "keyPoints": 3-7 bullet points, each under 20 words
- "summary": ${lengthInstruction}
- "prerequisites": list concepts a student should know before this content; empty array if none
- All fields are required

CONTENT:
${content}

JSON object output:`;
}
