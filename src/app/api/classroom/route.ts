// GET /api/classroom — list classrooms for current user
// POST /api/classroom — create classroom (org-scoped)

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { withSessionAuth } from "@/lib/classroom/services/classroom-auth";
import { createClassroom, listClassrooms } from "@/lib/classroom/services/classroom-service";

// GET /api/classroom — returns all classrooms where the current user is a member
export async function GET() {
  try {
    const auth = await withSessionAuth();
    if (auth instanceof NextResponse) return auth;

    const classrooms = await listClassrooms(auth.userId);
    return NextResponse.json({ data: classrooms });
  } catch (err) {
    console.error("[api/classroom] GET error:", err);
    return NextResponse.json(
      { error: "Failed to list classrooms", details: (err as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/classroom — create a new classroom (requires org membership)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, name, description } = body;

    if (!orgId || !name) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, name" },
        { status: 400 }
      );
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    const classroom = await createClassroom({
      orgId: auth.orgId,
      instructorId: auth.userId,
      name,
      description,
    });

    return NextResponse.json({ data: classroom }, { status: 201 });
  } catch (err) {
    console.error("[api/classroom] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create classroom", details: (err as Error).message },
      { status: 500 }
    );
  }
}
