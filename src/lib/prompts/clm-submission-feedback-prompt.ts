// Prompt builder for AI-powered submission feedback against a job description

/**
 * Builds a prompt that instructs the AI to evaluate a student submission against a job description.
 * Output: JSON object — no markdown wrappers, no extra text.
 */
export function buildSubmissionFeedbackPrompt(
  jobDescription: string,
  submissionContent: string
): string {
  return `You are a professional career coach and hiring specialist. Evaluate the student's submission against the job description below.

OUTPUT FORMAT: Respond with ONLY a valid JSON object. No markdown code blocks, no explanations, no extra text.

Schema:
{
  "score": 78,
  "strengths": ["Strength 1", "Strength 2"],
  "gaps": ["Gap 1", "Gap 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "overallFeedback": "Overall assessment paragraph"
}

Rules:
- "score": integer 0-100 reflecting how well the submission matches the job requirements
- "strengths": 2-5 specific things the submission does well relative to the job description
- "gaps": 2-5 specific requirements from the job description not adequately addressed
- "recommendations": 2-5 actionable steps to improve alignment with the job description
- "overallFeedback": 3-5 sentences summarizing fit, key findings, and encouragement
- Be constructive, specific, and professional

JOB DESCRIPTION:
${jobDescription}

STUDENT SUBMISSION:
${submissionContent}

JSON object output:`;
}
