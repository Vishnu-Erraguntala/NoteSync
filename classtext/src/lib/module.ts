import { prisma } from "./prisma";

export async function replaceModuleTags(moduleId: string, tags: string[]) {
  await prisma.moduleTag.deleteMany({ where: { moduleId } });

  if (!tags.length) return;

  await prisma.moduleTag.createMany({
    data: tags.map((value) => ({
      moduleId,
      value,
    })),
  });
}

