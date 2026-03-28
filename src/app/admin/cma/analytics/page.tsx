"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCmaGet } from "@/lib/cma/use-cma-api";
import { useCmaOrg } from "@/lib/cma/hooks/use-cma-org";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Loader2, TrendingUp, Eye, MousePointer, Download } from "lucide-react";

interface OverviewData {
  totalPosts: number;
  totalReach: number;
  totalClicks: number;
  avgEngagement: number;
  topPosts: {
    id: string; title: string; publishedAt: string | null;
    reach: number; clicks: number; likes: number; shares: number; engagementScore: number;
  }[];
  platformBreakdown: { platform: string; count: number; reach: number }[];
}

interface TimeSeriesData { data: { date: string; value: number }[] }

const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#ca8a04"];
const PERIODS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

export default function CmaAnalyticsPage() {
  const { org } = useCmaOrg();
  const orgId = org?.id;
  const [period, setPeriod] = useState(30);
  const [metric, setMetric] = useState("clicks");

  const { data: overview, loading: loadingOverview } = useCmaGet<OverviewData>(
    orgId ? `/api/cma/analytics/overview?orgId=${orgId}&period=${period}` : null
  );
  const { data: timeseries, loading: loadingTs } = useCmaGet<TimeSeriesData>(
    orgId ? `/api/cma/analytics/timeseries?orgId=${orgId}&metric=${metric}&period=${period}` : null
  );

  function handleExport() {
    if (!orgId) return;
    window.open(`/api/cma/analytics/export?orgId=${orgId}&period=${period}`, "_blank");
  }

  const isLoading = loadingOverview || loadingTs;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex items-center gap-2">
          {PERIODS.map((p) => (
            <Button key={p.value} size="sm"
              variant={period === p.value ? "default" : "outline"}
              onClick={() => setPeriod(p.value)}>
              {p.label}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard icon={<Eye className="h-4 w-4" />} label="Total Reach" value={overview?.totalReach || 0} />
            <StatCard icon={<MousePointer className="h-4 w-4" />} label="Total Clicks" value={overview?.totalClicks || 0} />
            <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Avg Engagement" value={overview?.avgEngagement || 0} />
            <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Posts Published" value={overview?.totalPosts || 0} />
          </div>

          {/* Time Series Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Engagement Over Time</CardTitle>
                <div className="flex gap-1">
                  {["clicks", "reach", "likes", "shares"].map((m) => (
                    <Button key={m} size="sm" variant={metric === m ? "default" : "outline"}
                      onClick={() => setMetric(m)} className="text-xs capitalize">
                      {m}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeseries?.data || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            {/* Platform Breakdown */}
            <Card>
              <CardHeader><CardTitle>Platform Breakdown</CardTitle></CardHeader>
              <CardContent>
                {overview?.platformBreakdown?.length ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={overview.platformBreakdown} dataKey="count" nameKey="platform"
                        cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                        {overview.platformBreakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-8 text-sm">No platform data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Top Posts */}
            <Card>
              <CardHeader><CardTitle>Top Posts</CardTitle></CardHeader>
              <CardContent>
                {overview?.topPosts?.length ? (
                  <div className="space-y-2 max-h-[200px] overflow-auto">
                    {overview.topPosts.slice(0, 5).map((post, i) => (
                      <div key={post.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="outline" className="shrink-0">{i + 1}</Badge>
                          <span className="truncate">{post.title}</span>
                        </div>
                        <span className="text-muted-foreground shrink-0 ml-2">
                          {post.engagementScore} pts
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8 text-sm">No published posts yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
          {icon} {label}
        </div>
        <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}
