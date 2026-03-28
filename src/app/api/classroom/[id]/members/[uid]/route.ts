// DELETE /api/classroom/[id]/members/[uid] — remove a member from classroom

import { NextResponse } from "next/server";
import { withInstructorAuth } from "@/lib/classroom/services/classroom-auth";
import { removeMember } from "@/lib/classroom/services/classroom-service";

type RouteParams = { params: { id: string; uid: string } };

// DELETE — remove member (instructor only)
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const auth = await withInstructorAuth(params.id);
    if (auth instanceof NextResponse) return auth;

    await removeMember(params.id, auth.classroom.orgId, params.uid);
    return NextResponse.json({ data: { removed: true } });
  } catch (err) {
    console.error("[api/classroom/[id]/members/[uid]] DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to remove member", details: (err as Error).message },
      { status: 500 }
    );
  }
}
