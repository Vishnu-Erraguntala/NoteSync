import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRequestUser } from "@/lib/user";
import { ensureCourseMember } from "@/lib/course";

export async function GET(
  request: NextRequest,
  { params }: { params: { moduleId: string } },
) {
  try {
    const user = await requireRequestUser(request);
    const moduleRecord = await prisma.module.findUnique({
      where: { id: params.moduleId },
    });
    if (!moduleRecord) {
      return NextResponse.json({ error: "Module not found." }, { status: 404 });
    }
    await ensureCourseMember(moduleRecord.courseId, user.id);

    const versions = await prisma.moduleVersion.findMany({
      where: { moduleId: moduleRecord.id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { versionNumber: "desc" },
    });

    return NextResponse.json(
      versions.map((version) => ({
        id: version.id,
        versionNumber: version.versionNumber,
        createdAt: version.createdAt,
        createdBy: version.createdBy,
        contentMarkdown: version.contentMarkdown,
      })),
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

