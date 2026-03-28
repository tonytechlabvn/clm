// GET /api/classroom/[id]/export — CSV export of all submissions

import { NextResponse } from "next/server";
import { withInstructorAuth } from "@/lib/classroom/services/classroom-auth";
import { exportClassroomCsv } from "@/lib/classroom/services/feedback-service";

type RouteParams = { params: { id: string } };

// GET — CSV export (instructor only)
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const auth = await withInstructorAuth(params.id);
    if (auth instanceof NextResponse) return auth;

    const csv = await exportClassroomCsv(params.id);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="classroom-${params.id}-export.csv"`,
      },
    });
  } catch (err) {
    console.error("[api/classroom/[id]/export] GET error:", err);
    return NextResponse.json(
      { error: "Failed to export classroom data", details: (err as Error).message },
      { status: 500 }
    );
  }
}
