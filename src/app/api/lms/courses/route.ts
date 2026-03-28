// LMS Courses — GET catalog list, POST create course

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { withStudentAuth } from "@/lib/lms/services/lms-auth";
import { createCourse, listCourses } from "@/lib/lms/services/course-service";

// GET /api/lms/courses?orgId=...&status=...&level=...&search=...&page=...&limit=...
export async function GET(request: Request) {
  const auth = await withStudentAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId") || undefined;
  const status = searchParams.get("status") || undefined;
  const level = searchParams.get("level") || undefined;
  const search = searchParams.get("search") || undefined;
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 100);

  // Non-admins only see published courses
  const isAdminOrRoot = auth.userRole === "admin" || auth.userRole === "root";
  const resolvedStatus = isAdminOrRoot ? status : "published";

  try {
    const result = await listCourses({ orgId, status: resolvedStatus, level, search, page, limit });
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[lms] GET /api/lms/courses", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/lms/courses — instructor/admin creates a new course
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, title, description, level, tags } = body;

    if (!orgId || !title) {
      return NextResponse.json({ error: "Missing required fields: orgId, title" }, { status: 400 });
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    const course = await createCourse({
      orgId: auth.orgId,
      instructorId: auth.userId,
      title,
      description,
      level,
      tags,
    });

    return NextResponse.json({ data: course }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[lms] POST /api/lms/courses", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
