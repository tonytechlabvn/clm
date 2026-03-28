// GET /api/classroom/[id]/assignments/[aid] — assignment detail
// Instructors see all submissions; students see only their own

import { NextResponse } from "next/server";
import { withClassroomAuth } from "@/lib/classroom/services/classroom-auth";
import { getAssignment } from "@/lib/classroom/services/assignment-service";

type RouteParams = { params: { id: string; aid: string } };

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const auth = await withClassroomAuth(params.id);
    if (auth instanceof NextResponse) return auth;

    const assignment = await getAssignment(params.aid, params.id);
    const isInstructor = auth.memberRole === "instructor";

    if (isInstructor) {
      // Instructor sees all submissions
      return NextResponse.json({
        data: { ...assignment, isInstructor: true, mySubmission: null },
      });
    }

    // Student: filter to only their own submission
    const mySubmission = assignment.submissions.find((s) => s.studentId === auth.userId) || null;
    return NextResponse.json({
      data: {
        ...assignment,
        submissions: [], // hide other students' submissions
        isInstructor: false,
        mySubmission,
      },
    });
  } catch (err) {
    console.error("[api/classroom/[id]/assignments/[aid]] GET error:", err);
    return NextResponse.json(
      { error: "Failed to get assignment", details: (err as Error).message },
      { status: 500 }
    );
  }
}
