"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { CourseSummary, ModuleSummary } from "@/types";

const moduleTypes = [
  "all",
  "definition",
  "explanation",
  "example",
  "problem",
  "notes",
  "other",
] as const;

const moduleTypeIcons: Record<string, string> = {
  definition: "📖",
  explanation: "💡",
  example: "✏️",
  problem: "🧮",
  notes: "📝",
  other: "📄",
};

const moduleTypeColors: Record<string, string> = {
  definition: "bg-blue-100 text-blue-700 border-blue-200",
  explanation: "bg-yellow-100 text-yellow-700 border-yellow-200",
  example: "bg-green-100 text-green-700 border-green-200",
  problem: "bg-red-100 text-red-700 border-red-200",
  notes: "bg-purple-100 text-purple-700 border-purple-200",
  other: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function CourseModulesPage({
  params,
}: {
  params: { courseId: string };
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<(typeof moduleTypes)[number]>("all");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/login");
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setUser(data);
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const { data: course } = useSWR<CourseSummary>(
    user ? `/api/courses/${params.courseId}` : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load course");
      return res.json();
    },
  );

  const { data: modules } = useSWR<ModuleSummary[]>(
    user
      ? `/api/courses/${params.courseId}/modules?search=${encodeURIComponent(search)}&type=${typeFilter}`
      : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load modules");
      return res.json();
    },
  );

  const filteredCount = modules?.length ?? 0;

  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    modules?.forEach((module) =>
      module.tags.forEach((tag) => tagSet.add(tag.toLowerCase())),
    );
    return Array.from(tagSet).slice(0, 12);
  }, [modules]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/courses" className="text-2xl font-bold text-indigo-600">
                NoteSync
              </Link>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-2">
                <Link
                  href="/courses"
                  className="text-sm text-slate-600 hover:text-indigo-600"
                >
                  Courses
                </Link>
                <span className="text-slate-400">/</span>
                <span className="text-sm font-medium text-slate-900">
                  {course?.name || "Loading..."}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Course Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-4xl font-bold text-slate-900">
                {course?.name || "Loading..."}
              </h1>
              <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-mono text-slate-600">
                {course?.code}
              </span>
            </div>
            {course?.description && (
              <p className="text-lg text-slate-600">{course.description}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/courses/${params.courseId}/compile`)}
              className="flex items-center gap-2 rounded-lg border border-indigo-600 px-4 py-2 font-medium text-indigo-600 hover:bg-indigo-50"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Compile
            </button>
            <Link
              href={`/courses/${params.courseId}/modules/new`}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 shadow-sm"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Module
            </Link>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search modules by title or tag..."
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="rounded-lg border border-slate-300 px-4 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {moduleTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "all" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            <span className="text-sm text-slate-600 whitespace-nowrap">
              {filteredCount} module{filteredCount !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Tag Filters */}
          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearch(tag)}
                  className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modules List */}
        {!modules ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Loading modules...</p>
          </div>
        ) : modules.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto max-w-sm">
              <div className="mb-4 text-6xl">📚</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No modules yet
              </h3>
              <p className="text-slate-600 mb-6">
                Get started by creating your first module. Break down complex topics into modular, collaborative content.
              </p>
              <Link
                href={`/courses/${params.courseId}/modules/new`}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create First Module
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <Link
                key={module.id}
                href={`/courses/${params.courseId}/modules/${module.id}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
              >
                <div className="mb-3 flex items-start justify-between">
                  <span className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${moduleTypeColors[module.type] || moduleTypeColors.other}`}>
                    <span>{moduleTypeIcons[module.type] || moduleTypeIcons.other}</span>
                    {module.type}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(module.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {module.title}
                </h3>
                {module.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {module.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                      >
                        #{tag}
                      </span>
                    ))}
                    {module.tags.length > 3 && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        +{module.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

