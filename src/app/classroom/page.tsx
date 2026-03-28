"use client";

// My Classrooms — list classrooms user belongs to, with create/join actions

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, LogIn, Users, BookOpen, RefreshCw } from "lucide-react";

interface ClassroomItem {
  id: string;
  name: string;
  description: string | null;
  joinCode: string;
  isActive: boolean;
  memberRole: string;
  memberCount: number;
  assignmentCount: number;
  instructor: { id: string; name: string | null };
}

export default function ClassroomsPage() {
  const { data: session } = useSession();
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const fetchClassrooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/classroom");
      if (res.ok) setClassrooms(await res.json());
    } catch { /* handled by empty state */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchClassrooms(); }, [fetchClassrooms]);

  if (!session) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Please sign in to view classrooms.</p></div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Classrooms</h1>
          <p className="text-muted-foreground">Manage and participate in classrooms</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowJoin(true)}><LogIn className="w-4 h-4 mr-1" />Join</Button>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-1" />Create</Button>
          <Button variant="ghost" size="icon" onClick={fetchClassrooms}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      {showCreate && <CreateClassroomForm onClose={() => setShowCreate(false)} onCreated={fetchClassrooms} />}
      {showJoin && <JoinClassroomForm onClose={() => setShowJoin(false)} onJoined={fetchClassrooms} />}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading classrooms...</div>
      ) : classrooms.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No classrooms yet. Create one or join with a code.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map((c) => (
            <Link key={c.id} href={`/classroom/${c.id}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{c.name}</CardTitle>
                    <Badge variant={c.memberRole === "instructor" ? "default" : "secondary"}>
                      {c.memberRole}
                    </Badge>
                  </div>
                  {c.description && <CardDescription className="line-clamp-2">{c.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{c.memberCount}</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{c.assignmentCount}</span>
                    {c.memberRole === "instructor" && (
                      <span className="ml-auto font-mono text-xs bg-muted px-2 py-0.5 rounded">{c.joinCode}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Inline create form
function CreateClassroomForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [orgId, setOrgId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch user's org on mount
  useEffect(() => {
    fetch("/api/cma/org").then(r => r.json()).then(d => { if (d?.id) setOrgId(d.id); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !orgId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/classroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, name: name.trim(), description: description.trim() || undefined }),
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="font-semibold">Create Classroom</h3>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Classroom name" value={name} onChange={e => setName(e.target.value)} required />
          <textarea className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Description (optional)" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={saving || !name.trim()}>{saving ? "Creating..." : "Create"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Inline join form
function JoinClassroomForm({ onClose, onJoined }: { onClose: () => void; onJoined: () => void }) {
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/classroom/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode: code.trim().toUpperCase() }),
      });
      if (!res.ok) { const b = await res.json(); throw new Error(b.error || "Failed"); }
      onJoined();
      onClose();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to join"); }
    finally { setSaving(false); }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="font-semibold">Join Classroom</h3>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input className="w-full border rounded-md px-3 py-2 text-sm font-mono uppercase tracking-widest" placeholder="Enter 6-character code" maxLength={6} value={code} onChange={e => setCode(e.target.value)} required />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={saving || code.length < 6}>{saving ? "Joining..." : "Join"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
