import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRequestUser } from "@/lib/user";

export async function POST(request: NextRequest) {
  try {
    const user = await requireRequestUser(request);
    const payload = await request.json();
    const code = String(payload?.code ?? "").trim().toUpperCase();

    if (!code) {
      return NextResponse.json(
        { error: "Join code is required." },
        { status: 400 },
      );
    }

    const course = await prisma.course.findUnique({
      where: { code },
      include: { _count: { select: { modules: true } } },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found for that code." },
        { status: 404 },
      );
    }

    const membership = await prisma.courseMember.upsert({
      where: {
        courseId_userId: {
          courseId: course.id,
          userId: user.id,
        },
      },
      update: {},
      create: {
        courseId: course.id,
        userId: user.id,
        role: "student",
      },
    });

    return NextResponse.json({
      id: course.id,
      name: course.name,
      code: course.code,
      description: course.description,
      role: membership.role,
      moduleCount: course._count.modules,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

