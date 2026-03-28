// POST /api/classroom/[id]/assignments/[aid]/submit — submit work for an assignment

import { NextResponse } from "next/server";
import { withClassroomAuth } from "@/lib/classroom/services/classroom-auth";
import { submitWork } from "@/lib/classroom/services/assignment-service";

type RouteParams = { params: { id: string; aid: string } };

// POST — submit work (any classroom member, student role expected)
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const auth = await withClassroomAuth(params.id);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const submission = await submitWork({
      assignmentId: params.aid,
      studentId: auth.userId,
      content,
    });

    return NextResponse.json({ data: submission }, { status: 201 });
  } catch (err) {
    console.error("[api/classroom/[id]/assignments/[aid]/submit] POST error:", err);
    return NextResponse.json(
      { error: "Failed to submit work", details: (err as Error).message },
      { status: 500 }
    );
  }
}
