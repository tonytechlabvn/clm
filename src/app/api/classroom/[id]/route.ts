// GET /api/classroom/[id] — classroom detail
// PATCH /api/classroom/[id] — update classroom
// DELETE /api/classroom/[id] — archive classroom

import { NextResponse } from "next/server";
import { withClassroomAuth, withInstructorAuth } from "@/lib/classroom/services/classroom-auth";
import {
  getClassroom,
  updateClassroom,
  archiveClassroom,
} from "@/lib/classroom/services/classroom-service";

type RouteParams = { params: { id: string } };

// GET — classroom detail (any member)
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const auth = await withClassroomAuth(params.id);
    if (auth instanceof NextResponse) return auth;

    const classroom = await getClassroom(params.id, auth.classroom.orgId);
    return NextResponse.json({ data: classroom });
  } catch (err) {
    console.error("[api/classroom/[id]] GET error:", err);
    return NextResponse.json(
      { error: "Failed to get classroom", details: (err as Error).message },
      { status: 500 }
    );
  }
}

// PATCH — update classroom (instructor only)
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const auth = await withInstructorAuth(params.id);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { name, description, isActive } = body;

    const updated = await updateClassroom(params.id, auth.classroom.orgId, {
      name,
      description,
      isActive,
    });
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[api/classroom/[id]] PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update classroom", details: (err as Error).message },
      { status: 500 }
    );
  }
}

// DELETE — archive classroom (instructor only)
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const auth = await withInstructorAuth(params.id);
    if (auth instanceof NextResponse) return auth;

    const archived = await archiveClassroom(params.id, auth.classroom.orgId);
    return NextResponse.json({ data: archived });
  } catch (err) {
    console.error("[api/classroom/[id]] DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to archive classroom", details: (err as Error).message },
      { status: 500 }
    );
  }
}
