"use client";

// Assignment detail — view submissions, submit work, give feedback

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, MessageSquare, Sparkles } from "lucide-react";

interface SubmissionItem {
  id: string;
  studentId: string;
  content: string | null;
  score: number | null;
  status: string;
  submittedAt: string | null;
  student: { name: string | null; email: string | null };
  feedback: { id: string; comment: string | null; score: number | null; aiFeedback: string | null; createdAt: string }[];
}

interface AssignmentDetail {
  id: string;
  title: string;
  description: string | null;
  jobDescription: string | null;
  type: string;
  status: string;
  dueDate: string | null;
  submissions: SubmissionItem[];
  isInstructor: boolean;
  mySubmission: SubmissionItem | null;
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classroomId = params.id as string;
  const assignmentId = params.aid as string;
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAssignment = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/classroom/${classroomId}/assignments/${assignmentId}`);
      if (res.ok) setAssignment(await res.json());
      else router.push(`/classroom/${classroomId}`);
    } catch { router.push(`/classroom/${classroomId}`); }
    finally { setLoading(false); }
  }, [classroomId, assignmentId, router]);

  useEffect(() => { fetchAssignment(); }, [fetchAssignment]);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  if (!assignment) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/classroom/${classroomId}`)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{assignment.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{assignment.type.replace("_", " ")}</Badge>
            <Badge variant={assignment.status === "active" ? "default" : "secondary"}>{assignment.status}</Badge>
            {assignment.dueDate && (
              <span className="text-sm text-muted-foreground">Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>

      {assignment.description && (
        <Card><CardContent className="pt-6"><p className="text-sm whitespace-pre-wrap">{assignment.description}</p></CardContent></Card>
      )}

      {assignment.jobDescription && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Job Description</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{assignment.jobDescription}</p></CardContent>
        </Card>
      )}

      {/* Student: show submission form */}
      {!assignment.isInstructor && (
        <SubmitWorkForm
          classroomId={classroomId}
          assignmentId={assignmentId}
          existing={assignment.mySubmission}
          onSubmitted={fetchAssignment}
        />
      )}

      {/* Instructor: show all submissions */}
      {assignment.isInstructor && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Submissions ({assignment.submissions.length})</h2>
          {assignment.submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No submissions yet.</p>
          ) : (
            assignment.submissions.map((s) => (
              <SubmissionCard key={s.id} submission={s} classroomId={classroomId} assignmentId={assignmentId} onFeedbackGiven={fetchAssignment} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SubmitWorkForm({ classroomId, assignmentId, existing, onSubmitted }: {
  classroomId: string; assignmentId: string; existing: SubmissionItem | null; onSubmitted: () => void;
}) {
  const [content, setContent] = useState(existing?.content || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/classroom/${classroomId}/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (!res.ok) { const b = await res.json(); throw new Error(b.error || "Failed"); }
      onSubmitted();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to submit"); }
    finally { setSaving(false); }
  };

  const isGraded = existing?.status === "graded" || existing?.status === "returned";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Send className="w-5 h-5" />Your Submission
          {existing && <Badge variant={existing.status === "graded" ? "default" : "secondary"}>{existing.status}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {existing?.feedback && existing.feedback.length > 0 && (
          <div className="mb-4 space-y-2">
            {existing.feedback.map((f) => (
              <div key={f.id} className="bg-muted rounded-md p-3 text-sm">
                <p className="font-medium mb-1">Feedback {f.score != null && `(Score: ${f.score})`}</p>
                {f.comment && <p className="whitespace-pre-wrap">{f.comment}</p>}
                {f.aiFeedback && <p className="mt-2 text-muted-foreground italic">AI: {f.aiFeedback}</p>}
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <textarea
            className="w-full border rounded-md px-3 py-2 text-sm min-h-[120px]"
            placeholder="Paste your CV, write your answer, or enter your submission..."
            value={content} onChange={e => setContent(e.target.value)}
            disabled={isGraded}
          />
          {!isGraded && (
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={saving || !content.trim()}>
                {saving ? "Submitting..." : existing ? "Update Submission" : "Submit"}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function SubmissionCard({ submission, classroomId, assignmentId, onFeedbackGiven }: {
  submission: SubmissionItem; classroomId: string; assignmentId: string; onFeedbackGiven: () => void;
}) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [comment, setComment] = useState("");
  const [score, setScore] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const giveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/classroom/${classroomId}/assignments/${assignmentId}/submissions/${submission.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: comment.trim() || undefined, score: score ? parseFloat(score) : undefined }),
      });
      if (res.ok) { onFeedbackGiven(); setShowFeedback(false); }
    } catch { /* error handled by UI state */ }
    finally { setSaving(false); }
  };

  const requestAiFeedback = async () => {
    setAiLoading(true);
    try {
      const res = await fetch(`/api/classroom/${classroomId}/assignments/${assignmentId}/ai-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: submission.id }),
      });
      if (res.ok) onFeedbackGiven();
    } catch { /* handled */ }
    finally { setAiLoading(false); }
  };

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="font-medium">{submission.student.name || submission.student.email}</span>
            <Badge variant={submission.status === "graded" ? "default" : "secondary"} className="ml-2 text-xs">{submission.status}</Badge>
            {submission.score != null && <span className="ml-2 text-sm font-mono">{submission.score}/100</span>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={requestAiFeedback} disabled={aiLoading}>
              <Sparkles className="w-3.5 h-3.5 mr-1" />{aiLoading ? "Generating..." : "AI Feedback"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowFeedback(!showFeedback)}>
              <MessageSquare className="w-3.5 h-3.5 mr-1" />Feedback
            </Button>
          </div>
        </div>
        {submission.content && <p className="text-sm whitespace-pre-wrap line-clamp-4 text-muted-foreground">{submission.content}</p>}
        {submission.feedback.map((f) => (
          <div key={f.id} className="mt-2 bg-muted rounded-md p-2 text-sm">
            {f.comment && <p>{f.comment}</p>}
            {f.score != null && <p className="text-xs text-muted-foreground">Score: {f.score}</p>}
            {f.aiFeedback && <p className="mt-1 italic text-xs">{f.aiFeedback}</p>}
          </div>
        ))}
        {showFeedback && (
          <form onSubmit={giveFeedback} className="mt-3 space-y-2 border-t pt-3">
            <textarea className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Your feedback..." rows={2} value={comment} onChange={e => setComment(e.target.value)} />
            <div className="flex items-center gap-2">
              <input className="border rounded-md px-3 py-2 text-sm w-24" type="number" min="0" max="100" placeholder="Score" value={score} onChange={e => setScore(e.target.value)} />
              <Button type="submit" size="sm" disabled={saving}>{saving ? "Saving..." : "Submit Feedback"}</Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
