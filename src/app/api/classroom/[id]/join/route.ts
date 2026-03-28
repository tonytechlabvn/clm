// POST /api/classroom/[id]/join — join classroom by join code

import { NextResponse } from "next/server";
import { withSessionAuth } from "@/lib/classroom/services/classroom-auth";
import { joinClassroom } from "@/lib/classroom/services/classroom-service";

type RouteParams = { params: { id: string } };

// POST — join classroom using joinCode in body
export async function POST(request: Request, { params: _ }: RouteParams) {
  try {
    const auth = await withSessionAuth();
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { joinCode } = body;

    if (!joinCode) {
      return NextResponse.json({ error: "joinCode is required" }, { status: 400 });
    }

    const member = await joinClassroom(joinCode, auth.userId);
    return NextResponse.json({ data: member }, { status: 201 });
  } catch (err) {
    console.error("[api/classroom/[id]/join] POST error:", err);
    return NextResponse.json(
      { error: "Failed to join classroom", details: (err as Error).message },
      { status: 500 }
    );
  }
}
