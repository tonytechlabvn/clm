"use client";

// Classroom detail — shows assignments, members, and classroom info

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Plus, Users, BookOpen, ClipboardList,
  BarChart3, Download, Copy, Check,
} from "lucide-react";

interface Member { id: string; userId: string; role: string; user: { name: string | null; email: string | null } }
interface AssignmentItem { id: string; title: string; type: string; status: string; dueDate: string | null; submissionCount: number }
interface ClassroomDetail {
  id: string; name: string; description: string | null; joinCode: string;
  isActive: boolean; instructor: { id: string; name: string | null };
  members: Member[]; assignments: AssignmentItem[]; memberRole: string;
}

export default function ClassroomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classroomId = params.id as string;
  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchClassroom = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/classroom/${classroomId}`);
      if (res.ok) setClassroom(await res.json());
      else router.push("/classroom");
    } catch { router.push("/classroom"); }
    finally { setLoading(false); }
  }, [classroomId, router]);

  useEffect(() => { fetchClassroom(); }, [fetchClassroom]);

  const copyCode = () => {
    if (!classroom) return;
    navigator.clipboard.writeText(classroom.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  if (!classroom) return null;

  const isInstructor = classroom.memberRole === "instructor";

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/classroom")}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{classroom.name}</h1>
          {classroom.description && <p className="text-muted-foreground">{classroom.description}</p>}
        </div>
        {isInstructor && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyCode}>
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {classroom.joinCode}
            </Button>
            <Link href={`/classroom/${classroomId}/dashboard`}>
              <Button variant="outline" size="sm"><BarChart3 className="w-4 h-4 mr-1" />Dashboard</Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2"><ClipboardList className="w-5 h-5" />Assignments</h2>
            {isInstructor && <Button size="sm" onClick={() => setShowCreateAssignment(true)}><Plus className="w-4 h-4 mr-1" />New</Button>}
          </div>

          {showCreateAssignment && (
            <CreateAssignmentForm classroomId={classroomId} onClose={() => setShowCreateAssignment(false)} onCreated={fetchClassroom} />
          )}

          {classroom.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No assignments yet.</p>
          ) : (
            <div className="space-y-3">
              {classroom.assignments.map((a) => (
                <Link key={a.id} href={`/classroom/${classroomId}/assignments/${a.id}`}>
                  <Card className="cursor-pointer hover:shadow-sm transition-shadow">
                    <CardContent className="py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{a.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{a.type.replace("_", " ")}</Badge>
                          {a.dueDate && <span className="text-xs text-muted-foreground">Due: {new Date(a.dueDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">{a.submissionCount} submissions</div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Members sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Users className="w-5 h-5" />Members ({classroom.members.length})</h2>
          <div className="space-y-2">
            {classroom.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                <span>{m.user.name || m.user.email || "Unknown"}</span>
                <Badge variant={m.role === "instructor" ? "default" : "secondary"} className="text-xs">{m.role}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline assignment creation form
function CreateAssignmentForm({ classroomId, onClose, onCreated }: {
  classroomId: string; onClose: () => void; onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [type, setType] = useState("cv_analysis");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/classroom/${classroomId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(), description: description.trim() || undefined,
          jobDescription: jobDescription.trim() || undefined, type,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        }),
      });
      if (!res.ok) { const b = await res.json(); throw new Error(b.error || "Failed"); }
      onCreated();
      onClose();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to create"); }
    finally { setSaving(false); }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-3">
          <h3 className="font-semibold">New Assignment</h3>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
          <textarea className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Description" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
          <select className="w-full border rounded-md px-3 py-2 text-sm" value={type} onChange={e => setType(e.target.value)}>
            <option value="cv_analysis">CV Analysis</option>
            <option value="cv_rewrite">CV Rewrite</option>
            <option value="course_completion">Course Completion</option>
            <option value="quiz">Quiz</option>
          </select>
          {(type === "cv_analysis" || type === "cv_rewrite") && (
            <textarea className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Job Description (for JD-based assignments)" rows={3} value={jobDescription} onChange={e => setJobDescription(e.target.value)} />
          )}
          <input className="w-full border rounded-md px-3 py-2 text-sm" type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={saving || !title.trim()}>{saving ? "Creating..." : "Create"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
