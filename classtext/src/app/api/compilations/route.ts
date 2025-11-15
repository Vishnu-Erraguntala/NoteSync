import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRequestUser } from "@/lib/user";
import { ensureCourseMember } from "@/lib/course";

type ModuleOrderItem = { moduleId: string; include: boolean };

export async function GET(request: NextRequest) {
  try {
    const user = await requireRequestUser(request);
    const courseId = request.nextUrl.searchParams.get("courseId");
    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required." },
        { status: 400 },
      );
    }
    await ensureCourseMember(courseId, user.id);

    const compilations = await prisma.compilation.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      compilations.map((comp) => ({
        id: comp.id,
        courseId: comp.courseId,
        name: comp.name,
        description: comp.description,
        moduleOrder: comp.moduleOrder as ModuleOrderItem[],
        createdAt: comp.createdAt,
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
    const courseId = String(payload?.courseId ?? "");
    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required." },
        { status: 400 },
      );
    }
    await ensureCourseMember(courseId, user.id);

    const name = String(payload?.name ?? "").trim();
    if (!name) {
      return NextResponse.json(
        { error: "Compilation name is required." },
        { status: 400 },
      );
    }

    const moduleOrder: ModuleOrderItem[] = Array.isArray(payload?.moduleOrder)
      ? payload.moduleOrder.map((entry: ModuleOrderItem) => ({
          moduleId: entry.moduleId,
          include: entry.include ?? true,
        }))
      : [];

    const moduleIds = moduleOrder.map((entry) => entry.moduleId);
    if (moduleIds.length) {
      const count = await prisma.module.count({
        where: { courseId, id: { in: moduleIds } },
      });
      if (count !== moduleIds.length) {
        return NextResponse.json(
          { error: "One or more modules are invalid for this course." },
          { status: 400 },
        );
      }
    }

    if (payload?.id) {
      const updated = await prisma.compilation.update({
        where: { id: payload.id },
        data: {
          name,
          description: payload?.description ?? null,
          moduleOrder,
        },
      });

      return NextResponse.json({
        ...updated,
        moduleOrder: updated.moduleOrder as ModuleOrderItem[],
      });
    }

    const created = await prisma.compilation.create({
      data: {
        courseId,
        name,
        description: payload?.description ?? null,
        moduleOrder,
        createdById: user.id,
      },
    });

    return NextResponse.json({
      ...created,
      moduleOrder: created.moduleOrder as ModuleOrderItem[],
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

