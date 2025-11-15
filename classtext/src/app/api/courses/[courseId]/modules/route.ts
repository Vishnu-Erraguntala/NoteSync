import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCourseMember } from "@/lib/course";
import { replaceModuleTags } from "@/lib/module";
import { requireRequestUser } from "@/lib/user";
import { ModuleType } from "@/generated/prisma/enums";

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } },
) {
  try {
    const user = await requireRequestUser(request);
    await ensureCourseMember(params.courseId, user.id);
    const search = request.nextUrl.searchParams.get("search") ?? "";
    const type = request.nextUrl.searchParams.get("type");

    const moduleType =
      type && type !== "all" ? (type as ModuleType) : undefined;

    const modules = await prisma.module.findMany({
      where: {
        courseId: params.courseId,
        ...(moduleType ? { type: moduleType } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                {
                  tags: {
                    some: {
                      value: { contains: search, mode: "insensitive" },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        tags: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(
      modules.map((module) => ({
        id: module.id,
        title: module.title,
        type: module.type,
        updatedAt: module.updatedAt,
        tags: module.tags.map((tag) => tag.value),
      })),
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } },
) {
  try {
    const user = await requireRequestUser(request);
    await ensureCourseMember(params.courseId, user.id);
    const payload = await request.json();

    const title = String(payload?.title ?? "").trim();
    const type = String(payload?.type ?? "notes");
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

    const created = await prisma.module.create({
      data: {
        title,
        type,
        courseId: params.courseId,
        createdById: user.id,
        versions: {
          create: {
            versionNumber: 1,
            contentMarkdown: content,
            createdById: user.id,
          },
        },
      },
      include: {
        versions: true,
        tags: true,
      },
    });

    const firstVersion = created.versions[0];
    await prisma.module.update({
      where: { id: created.id },
      data: { currentVersionId: firstVersion.id },
    });

    if (tags.length) {
      await replaceModuleTags(created.id, tags);
    }

    return NextResponse.json({
      id: created.id,
      title: created.title,
      type: created.type,
      updatedAt: created.updatedAt,
      tags,
      versionNumber: firstVersion.versionNumber,
      contentMarkdown: firstVersion.contentMarkdown,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

