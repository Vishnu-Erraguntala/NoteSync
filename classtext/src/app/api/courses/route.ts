import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRequestUser } from "@/lib/user";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRequestUser(request);
    const memberships = await prisma.courseMember.findMany({
      where: { userId: user.id },
      include: {
        course: {
          include: {
            _count: { select: { modules: true } },
          },
        },
      },
      orderBy: { course: { createdAt: "desc" } },
    });

    return NextResponse.json(
      memberships.map((member) => ({
        id: member.course.id,
        name: member.course.name,
        code: member.course.code,
        description: member.course.description,
        role: member.role,
        moduleCount: member.course._count.modules,
      })),
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRequestUser(request);
    const payload = await request.json();
    const name = String(payload?.name ?? "").trim();
    const code = String(payload?.code ?? "").trim().toUpperCase();
    const description =
      typeof payload?.description === "string" ? payload.description : null;

    if (!name || !code) {
      return NextResponse.json(
        { error: "Course name and code are required." },
        { status: 400 },
      );
    }

    const course = await prisma.course.create({
      data: {
        name,
        code,
        description,
        createdById: user.id,
        members: {
          create: {
            userId: user.id,
            role: "teacher",
          },
        },
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json({
      id: course.id,
      name: course.name,
      code: course.code,
      description: course.description,
      role: "teacher",
      moduleCount: 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

