// GET /api/classroom/[id]/assignments — list assignments
// POST /api/classroom/[id]/assignments — create assignment

import { NextResponse } from "next/server";
import { withClassroomAuth, withInstructorAuth } from "@/lib/classroom/services/classroom-auth";
import { createAssignment, listAssignments } from "@/lib/classroom/services/assignment-service";

type RouteParams = { params: { id: string } };

// GET — list assignments (any member)
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const auth = await withClassroomAuth(params.id);
    if (auth instanceof NextResponse) return auth;

    const assignments = await listAssignments(params.id);
    return NextResponse.json({ data: assignments });
  } catch (err) {
    console.error("[api/classroom/[id]/assignments] GET error:", err);
    return NextResponse.json(
      { error: "Failed to list assignments", details: (err as Error).message },
      { status: 500 }
    );
  }
}

// POST — create assignment (instructor only)
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const auth = await withInstructorAuth(params.id);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { title, description, jobDescription, dueDate, type } = body;

    if (!title || !type) {
      return NextResponse.json(
        { error: "Missing required fields: title, type" },
        { status: 400 }
      );
    }

    const assignment = await createAssignment({
      classroomId: params.id,
      title,
      description,
      jobDescription,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      type,
      createdById: auth.userId,
    });

    return NextResponse.json({ data: assignment }, { status: 201 });
  } catch (err) {
    console.error("[api/classroom/[id]/assignments] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create assignment", details: (err as Error).message },
      { status: 500 }
    );
  }
}
