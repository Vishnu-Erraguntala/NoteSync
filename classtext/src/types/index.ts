import { CourseRole, ModuleType } from "@/generated/prisma/enums";

export type CourseSummary = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  role: CourseRole;
  moduleCount: number;
};

export type ModuleSummary = {
  id: string;
  title: string;
  type: ModuleType;
  updatedAt: string;
  tags: string[];
};

export type ModuleDetail = ModuleSummary & {
  courseId: string;
  contentMarkdown: string;
  createdById: string;
  versionNumber: number;
};

export type ModuleVersionDTO = {
  id: string;
  versionNumber: number;
  createdAt: string;
  createdBy: { id: string; name: string };
  contentMarkdown: string;
};

export type CompilationConfig = {
  id: string;
  courseId: string;
  name: string;
  description?: string | null;
  moduleOrder: { moduleId: string; include: boolean }[];
  createdAt: string;
};

