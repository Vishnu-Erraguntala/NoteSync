import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRequestUser } from "@/lib/user";
import { ensureCourseMember } from "@/lib/course";
import { buildTextbookHtml } from "@/lib/markdown";
import { htmlToPdfBuffer } from "@/lib/pdf";

type ModuleOrderItem = { moduleId: string; include: boolean };

export async function POST(request: NextRequest) {
  try {
    const user = await requireRequestUser(request);
    const payload = await request.json();
    const compilationId = String(payload?.compilationId ?? "");

    if (!compilationId) {
      return NextResponse.json(
        { error: "compilationId is required." },
        { status: 400 },
      );
    }

    const compilation = await prisma.compilation.findUnique({
      where: { id: compilationId },
      include: {
        course: true,
      },
    });
    if (!compilation) {
      return NextResponse.json(
        { error: "Compilation not found." },
        { status: 404 },
      );
    }
    await ensureCourseMember(compilation.courseId, user.id);

    const moduleOrder = (compilation.moduleOrder as ModuleOrderItem[]) ?? [];
    const moduleIds = moduleOrder.map((item) => item.moduleId);

    const courseModules = await prisma.module.findMany({
      where: { courseId: compilation.courseId },
      include: { currentVersion: true },
    });

    const moduleMap = new Map(
      courseModules.map((module) => [module.id, module]),
    );

    let orderedModules = moduleOrder
      .filter((item) => item.include)
      .map((item) => moduleMap.get(item.moduleId))
      .filter(Boolean);

    if (!orderedModules.length) {
      orderedModules = courseModules;
    } else {
      const missing = courseModules.filter(
        (module) => !moduleIds.includes(module.id),
      );
      orderedModules = [...orderedModules, ...missing];
    }

    const selectedModules = orderedModules
      .map((module) => {
        if (!module?.currentVersion) return null;
        return {
          id: module.id,
          title: module.title,
          type: module.type,
          contentMarkdown: module.currentVersion.contentMarkdown,
        };
      })
      .filter(Boolean) as {
      id: string;
      title: string;
      type: string;
      contentMarkdown: string;
    }[];

    const html = buildTextbookHtml({
      courseName: compilation.course.name,
      compilationName: compilation.name,
      modules: selectedModules,
    });

    const pdfBuffer = await htmlToPdfBuffer(html);

    return NextResponse.json({
      html,
      pdfBase64: pdfBuffer.toString("base64"),
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

