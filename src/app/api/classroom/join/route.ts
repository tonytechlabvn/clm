// POST /api/classroom/join — join classroom by code (student doesn't know ID)

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma-client";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.dbUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { joinCode } = await request.json();
    if (!joinCode || typeof joinCode !== "string") {
      return NextResponse.json({ error: "joinCode is required" }, { status: 400 });
    }

    const classroom = await prisma.classroom.findUnique({
      where: { joinCode: joinCode.toUpperCase() },
    });

    if (!classroom || !classroom.isActive) {
      return NextResponse.json({ error: "Invalid or inactive classroom code" }, { status: 404 });
    }

    // Check if already a member
    const existing = await prisma.classroomMember.findUnique({
      where: { userId_classroomId: { userId: session.dbUserId, classroomId: classroom.id } },
    });

    if (existing) {
      return NextResponse.json({ error: "Already a member of this classroom" }, { status: 409 });
    }

    const member = await prisma.classroomMember.create({
      data: {
        userId: session.dbUserId,
        classroomId: classroom.id,
        role: "student",
      },
    });

    return NextResponse.json({ data: { classroomId: classroom.id, memberId: member.id } }, { status: 201 });
  } catch (err) {
    console.error("[classroom/join] Error:", err);
    return NextResponse.json(
      { error: "Failed to join classroom", details: (err as Error).message },
      { status: 500 }
    );
  }
}
