"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/providers/user-provider";

export function useRequiredUsername() {
  const { username } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!username) {
      router.push("/");
    }
  }, [username, router]);

  return username;
}

