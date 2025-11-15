import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRequestUser } from "@/lib/user";
import { canDeleteModule, ensureCourseMember } from "@/lib/course";
import { replaceModuleTags } from "@/lib/module";

async function fetchModuleRecord(moduleId: string) {
  return prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      tags: true,
      currentVersion: true,
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { moduleId: string } },
) {
  try {
    const user = await requireRequestUser(request);
    const moduleRecord = await fetchModuleRecord(params.moduleId);
    if (!moduleRecord) {
      return NextResponse.json({ error: "Module not found." }, { status: 404 });
    }
    await ensureCourseMember(moduleRecord.courseId, user.id);

    return NextResponse.json({
      id: moduleRecord.id,
      courseId: moduleRecord.courseId,
      title: moduleRecord.title,
      type: moduleRecord.type,
      updatedAt: moduleRecord.updatedAt,
      tags: moduleRecord.tags.map((tag) => tag.value),
      contentMarkdown: moduleRecord.currentVersion?.contentMarkdown ?? "",
      versionNumber: moduleRecord.currentVersion?.versionNumber ?? 1,
      createdById: moduleRecord.createdById,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { moduleId: string } },
) {
  try {
    const user = await requireRequestUser(request);
    const moduleRecord = await fetchModuleRecord(params.moduleId);
    if (!moduleRecord) {
      return NextResponse.json({ error: "Module not found." }, { status: 404 });
    }
    await ensureCourseMember(moduleRecord.courseId, user.id);

    const payload = await request.json();
    const title = String(payload?.title ?? moduleRecord.title).trim();
    const type = String(payload?.type ?? moduleRecord.type);
    const content = String(payload?.contentMarkdown ?? "").trim();
    const tags: string[] = Array.isArray(payload?.tags)
      ? payload.tags.map((tag: string) => tag.trim()).filter(Boolean)
      : [];

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required." },
        { status: 400 },
      );
    }

    const nextVersionNumber =
      (moduleRecord.currentVersion?.versionNumber ?? 0) + 1;
    const newVersion = await prisma.moduleVersion.create({
      data: {
        moduleId: moduleRecord.id,
        versionNumber: nextVersionNumber,
        contentMarkdown: content,
        createdById: user.id,
      },
    });

    const updated = await prisma.module.update({
      where: { id: moduleRecord.id },
      data: {
        title,
        type,
        currentVersionId: newVersion.id,
      },
      include: {
        tags: true,
        currentVersion: true,
      },
    });

    await replaceModuleTags(moduleRecord.id, tags);

    return NextResponse.json({
      id: updated.id,
      courseId: updated.courseId,
      title: updated.title,
      type: updated.type,
      updatedAt: updated.updatedAt,
      tags,
      contentMarkdown: updated.currentVersion?.contentMarkdown ?? "",
      versionNumber: updated.currentVersion?.versionNumber ?? nextVersionNumber,
      createdById: updated.createdById,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { moduleId: string } },
) {
  try {
    const user = await requireRequestUser(request);
    const moduleRecord = await fetchModuleRecord(params.moduleId);
    if (!moduleRecord) {
      return NextResponse.json({ error: "Module not found." }, { status: 404 });
    }
    const member = await ensureCourseMember(moduleRecord.courseId, user.id);

    if (
      !canDeleteModule({
        memberRole: member.role,
        createdById: moduleRecord.createdById,
        userId: user.id,
      })
    ) {
      return NextResponse.json(
        { error: "Only teachers or the author can delete this module." },
        { status: 403 },
      );
    }

    await prisma.moduleVersion.deleteMany({
      where: { moduleId: moduleRecord.id },
    });
    await prisma.module.delete({ where: { id: moduleRecord.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

