// POST /api/classroom/[id]/assignments/[aid]/submissions/[sid]/feedback — give feedback

import { NextResponse } from "next/server";
import { withInstructorAuth } from "@/lib/classroom/services/classroom-auth";
import { giveFeedback } from "@/lib/classroom/services/feedback-service";

type RouteParams = { params: { id: string; aid: string; sid: string } };

// POST — give feedback on a submission (instructor only)
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const auth = await withInstructorAuth(params.id);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { comment, score } = body;

    if (comment === undefined && score === undefined) {
      return NextResponse.json(
        { error: "At least one of comment or score is required" },
        { status: 400 }
      );
    }

    const feedback = await giveFeedback({
      submissionId: params.sid,
      instructorId: auth.userId,
      comment,
      score: score !== undefined ? Number(score) : undefined,
    });

    return NextResponse.json({ data: feedback }, { status: 201 });
  } catch (err) {
    console.error("[api/classroom/[id]/assignments/[aid]/submissions/[sid]/feedback] POST error:", err);
    return NextResponse.json(
      { error: "Failed to give feedback", details: (err as Error).message },
      { status: 500 }
    );
  }
}
