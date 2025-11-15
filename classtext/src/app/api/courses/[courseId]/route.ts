import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRequestUser } from "@/lib/user";
import { ensureCourseMember } from "@/lib/course";

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } },
) {
  try {
    const user = await requireRequestUser(request);
    const member = await ensureCourseMember(params.courseId, user.id);
    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      include: {
        _count: { select: { modules: true } },
      },
    });
    if (!course) {
      return NextResponse.json(
        { error: "Course not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: course.id,
      name: course.name,
      description: course.description,
      code: course.code,
      role: member.role,
      moduleCount: course._count.modules,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

