import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    /**
     * Next.js was inferring the workspace root as the parent directory because
     * there are multiple package-lock.json files. Pinning the root ensures
     * Turbopack resolves relative paths (like our SQLite DATABASE_URL) using
     * the NoteSync folder instead of the monorepo root.
     */
    root: __dirname,
  },
};

export default nextConfig;
