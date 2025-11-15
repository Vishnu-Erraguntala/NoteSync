"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { diffLines } from "diff";
import {
  ArrowLeft,
  Download,
  History,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { ModuleEditor, ModuleFormState } from "@/components/modules/module-editor";
import { useRequiredUsername } from "@/hooks/use-required-username";
import { apiFetch } from "@/lib/client-fetch";
import { ModuleDetail, ModuleSummary, ModuleVersionDTO } from "@/types";
import Link from "next/link";

export default function ModuleDetailPage({
  params,
}: {
  params: { courseId: string; moduleId: string };
}) {
  const username = useRequiredUsername();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  const { data: module, mutate } = useSWR<ModuleDetail>(
    username ? `/api/modules/${params.moduleId}` : null,
    (url) => apiFetch<ModuleDetail>(url, username!),
  );

  const { data: versions, mutate: refreshVersions } = useSWR<
    ModuleVersionDTO[]
  >(
    username ? `/api/modules/${params.moduleId}/versions` : null,
    (url) => apiFetch<ModuleVersionDTO[]>(url, username!),
  );

  const { data: courseModules } = useSWR<ModuleSummary[]>(
    module ? `/api/courses/${module.courseId}/modules` : null,
    (url) => apiFetch<ModuleSummary[]>(url, username!),
  );

  const [editorState, setEditorState] = useState<ModuleFormState>(() => ({
    title: module?.title ?? "",
    type: module?.type ?? "notes",
    tags: module?.tags ?? [],
    contentMarkdown: module?.contentMarkdown ?? "",
  }));

  useEffect(() => {
    if (module) {
      setEditorState({
        title: module.title,
        type: module.type,
        tags: module.tags,
        contentMarkdown: module.contentMarkdown,
      });
    }
  }, [module]);

  const persistKey = `module-draft-${params.moduleId}`;

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await apiFetch(`/api/modules/${params.moduleId}`, username, {
        method: "PUT",
        body: JSON.stringify(editorState),
      });
      toast.success("Module updated");
      localStorage.removeItem(persistKey);
      mutate();
      refreshVersions();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    try {
      await apiFetch(`/api/modules/${params.moduleId}/restore`, username, {
        method: "POST",
        body: JSON.stringify({ versionId }),
      });
      toast.success("Version restored");
      mutate();
      refreshVersions();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Delete this module? This removes all versions permanently.",
      )
    ) {
      return;
    }
    try {
      await apiFetch(`/api/modules/${params.moduleId}`, username, {
        method: "DELETE",
      });
      toast.success("Module deleted.");
      router.push(`/courses/${params.courseId}`);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(
        `/api/modules/${params.moduleId}/markdown`,
        {
          headers: {
            "x-user-name": username,
          },
        },
      );
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${module.title}.md`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const diffContent = useMemo(() => {
    if (!selectedVersion || !module) return null;
    const version = versions?.find((ver) => ver.id === selectedVersion);
    if (!version) return null;
    return diffLines(version.contentMarkdown, module.contentMarkdown);
  }, [selectedVersion, versions, module]);

  if (!username) {
    return <p className="p-10 text-center">Redirecting…</p>;
  }

  if (!module) {
    return <p className="p-10 text-center">Loading module…</p>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/courses/${params.courseId}`}
            className="text-sm text-brand-600 underline"
          >
            <ArrowLeft className="mr-1 inline h-4 w-4" />
            Back to modules
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            {module.title}
          </h1>
          <p className="text-sm text-slate-500">
            Version {module.versionNumber}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Markdown
          </button>
          <button className="btn-outline text-red-600" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <ModuleEditor
        value={editorState}
        onChange={(state) => {
          setEditorState(state);
        }}
        onSave={handleSave}
        isSaving={isSaving}
        availableModules={courseModules ?? []}
        persistKey={persistKey}
        lastServerUpdatedAt={module.updatedAt}
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <History className="h-5 w-5 text-slate-400" />
              Version history
            </h2>
          </div>
          <div className="mt-4 space-y-2">
            {versions?.map((version) => (
              <div
                key={version.id}
                className={`rounded-xl border px-4 py-3 ${
                  selectedVersion === version.id
                    ? "border-brand-200 bg-brand-50/70"
                    : "border-slate-100 bg-white"
                }`}
              >
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold">
                      v{version.versionNumber} ·{" "}
                      {new Date(version.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      {version.createdBy.name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="text-xs text-brand-600 underline"
                      onClick={() => setSelectedVersion(version.id)}
                    >
                      Diff
                    </button>
                    <button
                      className="text-xs text-slate-600 underline"
                      onClick={() => handleRestore(version.id)}
                    >
                      <RotateCcw className="mr-1 inline h-3.5 w-3.5" />
                      Restore
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!versions?.length && (
              <p className="text-sm text-slate-500">
                No alternate versions yet.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Diff viewer</h2>
          {diffContent ? (
            <div className="mt-4 max-h-[420px] overflow-y-auto text-sm font-mono">
              {diffContent.map((part, index) => (
                <pre
                  key={`${part.value}-${index}`}
                  className={`whitespace-pre-wrap rounded-lg px-3 py-2 ${
                    part.added
                      ? "bg-emerald-50 text-emerald-800"
                      : part.removed
                        ? "bg-rose-50 text-rose-700"
                        : "bg-slate-50 text-slate-700"
                  }`}
                >
                  {part.value}
                </pre>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Select a version to compare against the current content.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

