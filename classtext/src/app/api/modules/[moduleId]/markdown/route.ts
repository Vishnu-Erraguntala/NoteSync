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
      include: {
        currentVersion: true,
      },
    });
    if (!moduleRecord) {
      return NextResponse.json({ error: "Module not found." }, { status: 404 });
    }
    await ensureCourseMember(moduleRecord.courseId, user.id);

    const markdown = moduleRecord.currentVersion?.contentMarkdown ?? "";
    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${moduleRecord.title}.md"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

