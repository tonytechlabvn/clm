"use client";

// Instructor dashboard — classroom stats, submission overview, CSV export

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, Users, ClipboardList, CheckCircle, BarChart3 } from "lucide-react";

interface DashboardStats {
  classroomName: string;
  memberCount: number;
  assignmentCount: number;
  totalSubmissions: number;
  gradedSubmissions: number;
  averageScore: number | null;
  completionRate: number;
}

export default function ClassroomDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const classroomId = params.id as string;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/classroom/${classroomId}/dashboard`);
      if (res.ok) setStats(await res.json());
      else router.push(`/classroom/${classroomId}`);
    } catch { router.push(`/classroom/${classroomId}`); }
    finally { setLoading(false); }
  }, [classroomId, router]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/classroom/${classroomId}/export`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `classroom-${classroomId}-export.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* handled */ }
    finally { setExporting(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  if (!stats) return null;

  const statCards = [
    { label: "Members", value: stats.memberCount, icon: Users, color: "text-blue-600" },
    { label: "Assignments", value: stats.assignmentCount, icon: ClipboardList, color: "text-purple-600" },
    { label: "Submissions", value: stats.totalSubmissions, icon: CheckCircle, color: "text-green-600" },
    { label: "Avg Score", value: stats.averageScore != null ? `${stats.averageScore.toFixed(1)}` : "N/A", icon: BarChart3, color: "text-orange-600" },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/classroom/${classroomId}`)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{stats.classroomName} — Dashboard</h1>
          <p className="text-muted-foreground">Overview of classroom performance</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
          <Download className="w-4 h-4 mr-1" />{exporting ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6 text-center">
              <s.icon className={`w-8 h-8 mx-auto mb-2 ${s.color}`} />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Completion Rate</CardTitle></CardHeader>
        <CardContent>
          <div className="w-full bg-muted rounded-full h-4">
            <div className="bg-primary rounded-full h-4 transition-all" style={{ width: `${stats.completionRate}%` }} />
          </div>
          <p className="text-sm text-muted-foreground mt-2">{stats.completionRate.toFixed(1)}% of submissions have been graded</p>
        </CardContent>
      </Card>
    </div>
  );
}
