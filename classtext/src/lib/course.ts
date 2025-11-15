import { prisma } from "./prisma";
import { CourseRole } from "@/generated/prisma/enums";

export async function ensureCourseMember(courseId: string, userId: string) {
  const member = await prisma.courseMember.findUnique({
    where: {
      courseId_userId: { courseId, userId },
    },
  });
  if (!member) {
    throw new Error("You are not a member of this course.");
  }
  return member;
}

export function canDeleteModule(params: {
  memberRole: CourseRole;
  createdById: string;
  userId: string;
}) {
  if (params.memberRole === "teacher") return true;
  return params.createdById === params.userId;
}

