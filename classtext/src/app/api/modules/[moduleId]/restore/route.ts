import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRequestUser } from "@/lib/user";
import { ensureCourseMember } from "@/lib/course";

export async function POST(
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

    const payload = await request.json();
    const versionId = String(payload?.versionId ?? "");
    if (!versionId) {
      return NextResponse.json(
        { error: "versionId is required." },
        { status: 400 },
      );
    }

    const previous = await prisma.moduleVersion.findUnique({
      where: { id: versionId },
    });
    if (!previous || previous.moduleId !== moduleRecord.id) {
      return NextResponse.json(
        { error: "Version not found for this module." },
        { status: 404 },
      );
    }

    const latestVersion = await prisma.moduleVersion.findFirst({
      where: { moduleId: moduleRecord.id },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });
    const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;

    const restoredVersion = await prisma.moduleVersion.create({
      data: {
        moduleId: moduleRecord.id,
        versionNumber: nextVersionNumber,
        contentMarkdown: previous.contentMarkdown,
        createdById: user.id,
      },
    });

    const updated = await prisma.module.update({
      where: { id: moduleRecord.id },
      data: {
        title: moduleRecord.title,
        type: moduleRecord.type,
        currentVersionId: restoredVersion.id,
      },
      include: {
        currentVersion: true,
        tags: true,
      },
    });

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      type: updated.type,
      updatedAt: updated.updatedAt,
      tags: updated.tags.map((tag) => tag.value),
      contentMarkdown: updated.currentVersion?.contentMarkdown ?? "",
      versionNumber: updated.currentVersion?.versionNumber ?? nextVersionNumber,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

