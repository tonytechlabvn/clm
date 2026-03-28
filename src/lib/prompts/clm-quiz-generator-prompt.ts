// Prompt builder for AI-powered quiz generation from lesson content

/**
 * Builds a prompt that instructs the AI to generate quiz questions from lesson content.
 * Output: JSON array — no markdown wrappers, no extra text.
 */
export function buildQuizGeneratorPrompt(
  lessonContent: string,
  questionCount: number = 5
): string {
  return `You are an educational assessment expert. Generate exactly ${questionCount} quiz questions based on the lesson content below.

OUTPUT FORMAT: Respond with ONLY a valid JSON array. No markdown code blocks, no explanations, no extra text.

Each question object must follow this schema exactly:
{
  "question": "Question text here",
  "type": "mcq" or "true_false",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Why this answer is correct"
}

Rules:
- "type" must be either "mcq" or "true_false"
- For "mcq": provide exactly 4 options; "correctAnswer" is the 0-based index of the correct option
- For "true_false": options must be ["True", "False"]; "correctAnswer" is 0 for True, 1 for False
- Questions must test understanding, not just recall
- Vary difficulty across questions
- "explanation" should be concise and educational

LESSON CONTENT:
${lessonContent}

JSON array output:`;
}
