import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRequestUser } from "@/lib/user";
import { ensureCourseMember } from "@/lib/course";

export async function GET(
  request: NextRequest,
  { params }: { params: { compilationId: string } },
) {
  try {
    const user = await requireRequestUser(request);
    const compilation = await prisma.compilation.findUnique({
      where: { id: params.compilationId },
    });
    if (!compilation) {
      return NextResponse.json(
        { error: "Compilation not found." },
        { status: 404 },
      );
    }
    await ensureCourseMember(compilation.courseId, user.id);

    return NextResponse.json({
      ...compilation,
      moduleOrder: compilation.moduleOrder as {
        moduleId: string;
        include: boolean;
      }[],
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

