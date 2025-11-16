import { NextRequest } from "next/server";
import { prisma } from "./prisma";

export async function requireRequestUser(request: NextRequest) {
  const userId = request.cookies.get("user_id")?.value;
  
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function getRequestUser(request: NextRequest) {
  const userId = request.cookies.get("user_id")?.value;
  
  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
  });
}

