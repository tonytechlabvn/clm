// Prompt builder for AI-powered student code review against a rubric

/**
 * Builds a prompt that instructs the AI to review student code against a rubric.
 * Output: JSON object — no markdown wrappers, no extra text.
 */
export function buildCodeReviewerPrompt(
  studentCode: string,
  rubric: string
): string {
  return `You are an experienced programming instructor. Review the student's code against the provided rubric and give structured feedback.

OUTPUT FORMAT: Respond with ONLY a valid JSON object. No markdown code blocks, no explanations, no extra text.

Schema:
{
  "score": 85,
  "feedback": "Overall assessment paragraph",
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement needed 1", "Improvement needed 2"],
  "suggestions": ["Specific suggestion 1", "Specific suggestion 2"]
}

Rules:
- "score": integer 0-100 based on rubric criteria
- "feedback": 2-4 sentences, professional and constructive tone
- "strengths": 2-5 items, specific things the student did well
- "improvements": 2-5 items, areas that need work according to rubric
- "suggestions": 2-5 actionable code-level suggestions with examples when relevant
- Be fair, educational, and encouraging

RUBRIC:
${rubric}

STUDENT CODE:
${studentCode}

JSON object output:`;
}
