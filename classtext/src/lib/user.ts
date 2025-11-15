import { NextRequest } from "next/server";
import { prisma } from "./prisma";

export const USER_HEADER = "x-user-name";

export async function upsertUserByName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("A username is required.");
  }

  const capped = trimmed.slice(0, 60);
  return prisma.user.upsert({
    where: { name: capped },
    update: {},
    create: {
      name: capped,
    },
  });
}

export async function requireRequestUser(request: NextRequest) {
  const supplied =
    request.headers.get(USER_HEADER) ??
    request.nextUrl.searchParams.get("username");
  if (!supplied) {
    throw new Error("Username header missing");
  }
  return upsertUserByName(supplied);
}

