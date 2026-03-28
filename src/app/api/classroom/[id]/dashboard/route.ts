// GET /api/classroom/[id]/dashboard — instructor dashboard stats

import { NextResponse } from "next/server";
import { withInstructorAuth } from "@/lib/classroom/services/classroom-auth";
import { getClassroomDashboard } from "@/lib/classroom/services/feedback-service";

type RouteParams = { params: { id: string } };

// GET — dashboard stats (instructor only)
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const auth = await withInstructorAuth(params.id);
    if (auth instanceof NextResponse) return auth;

    const stats = await getClassroomDashboard(params.id);
    return NextResponse.json({ data: stats });
  } catch (err) {
    console.error("[api/classroom/[id]/dashboard] GET error:", err);
    return NextResponse.json(
      { error: "Failed to get dashboard stats", details: (err as Error).message },
      { status: 500 }
    );
  }
}
