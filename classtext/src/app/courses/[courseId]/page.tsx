"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { FilterIcon, PlusIcon, BookOpenText, ListFilter } from "lucide-react";
import { apiFetch } from "@/lib/client-fetch";
import { useRequiredUsername } from "@/hooks/use-required-username";
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

export default function CourseModulesPage({
  params,
}: {
  params: { courseId: string };
}) {
  const username = useRequiredUsername();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<(typeof moduleTypes)[number]>(
    "all",
  );

  const { data: course } = useSWR<CourseSummary>(
    username ? `/api/courses/${params.courseId}` : null,
    (url) => apiFetch<CourseSummary>(url, username!),
  );

  const { data: modules } = useSWR<ModuleSummary[]>(
    username
      ? `/api/courses/${params.courseId}/modules?search=${encodeURIComponent(
          search,
        )}&type=${typeFilter}`
      : null,
    (url) => apiFetch<ModuleSummary[]>(url, username!),
  );

  const filteredCount = modules?.length ?? 0;

  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    modules?.forEach((module) =>
      module.tags.forEach((tag) => tagSet.add(tag.toLowerCase())),
    );
    return Array.from(tagSet).slice(0, 12);
  }, [modules]);

  if (!username) {
    return <p className="p-10 text-center">Redirecting…</p>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-600">
            Course
          </p>
          <h1 className="text-3xl font-bold text-slate-900">
            {course?.name ?? "Loading…"}
          </h1>
          <p className="text-sm text-slate-600">{course?.description}</p>
        </div>
        <div className="flex gap-3">
          <button
            className="btn-outline"
            onClick={() => router.push(`/courses/${params.courseId}/compile`)}
          >
            <BookOpenText className="h-4 w-4" />
            Compile textbook
          </button>
          <Link
            href={`/courses/${params.courseId}/modules/new`}
            className="btn-primary"
          >
            <PlusIcon className="h-4 w-4" />
            New module
          </Link>
        </div>
      </div>

      <div className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-3">
          <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <ListFilter className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title or tag"
              className="w-full border-none text-sm focus:outline-none"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value as (typeof moduleTypes)[number])
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            {moduleTypes.map((type) => (
              <option key={type} value={type}>
                {type === "all" ? "All types" : type}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-slate-500">
          Showing {filteredCount} module{filteredCount === 1 ? "" : "s"}
        </p>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <FilterIcon className="h-3.5 w-3.5" />
          {tags.map((tag) => (
            <button
              key={tag}
              className="rounded-full border border-slate-200 px-3 py-1 capitalize"
              onClick={() => setSearch(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {modules?.map((module) => (
          <Link
            key={module.id}
            href={`/courses/${params.courseId}/modules/${module.id}`}
            className="block rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:border-brand-200 hover:bg-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500">
                  {module.type}
                </p>
                <h3 className="text-xl font-semibold text-slate-900">
                  {module.title}
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Updated {new Date(module.updatedAt).toLocaleDateString()}
              </span>
            </div>
            {module.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                {module.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-2 py-0.5"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
        {!modules?.length && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
            No modules yet. Create the first one!
          </div>
        )}
      </div>
    </div>
  );
}

