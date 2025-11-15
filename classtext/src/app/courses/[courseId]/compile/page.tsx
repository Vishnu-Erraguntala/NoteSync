"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  ArrowDown,
  ArrowUp,
  BookMarked,
  CheckSquare,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiFetch } from "@/lib/client-fetch";
import { useRequiredUsername } from "@/hooks/use-required-username";
import { ModuleSummary, CompilationConfig } from "@/types";

type ModuleOrderEntry = {
  moduleId: string;
  include: boolean;
};

export default function CompilePage({
  params,
}: {
  params: { courseId: string };
}) {
  const username = useRequiredUsername();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [moduleOrder, setModuleOrder] = useState<ModuleOrderEntry[]>([]);
  const [selectedCompilation, setSelectedCompilation] = useState<
    string | null
  >(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: modules } = useSWR<ModuleSummary[]>(
    username ? `/api/courses/${params.courseId}/modules` : null,
    (url) => apiFetch<ModuleSummary[]>(url, username!),
  );

  const { data: compilations, mutate } = useSWR<CompilationConfig[]>(
    username ? `/api/compilations?courseId=${params.courseId}` : null,
    (url) => apiFetch<CompilationConfig[]>(url, username!),
  );

  useEffect(() => {
    if (!modules) return;
    setModuleOrder((prev) => {
      if (!prev.length) {
        return modules.map((module) => ({
          moduleId: module.id,
          include: true,
        }));
      }
      const existing = new Set(prev.map((entry) => entry.moduleId));
      const additions = modules
        .filter((module) => !existing.has(module.id))
        .map((module) => ({ moduleId: module.id, include: true }));
      if (!additions.length) {
        return prev;
      }
      return [...prev, ...additions];
    });
  }, [modules]);

  const displayModules = useMemo(() => {
    if (!modules) return [];
    const map = new Map(modules.map((module) => [module.id, module]));
    return moduleOrder
      .map((entry) => map.get(entry.moduleId))
      .filter(Boolean) as ModuleSummary[];
  }, [modules, moduleOrder]);

  if (!username) {
    return <p className="p-10 text-center">Redirecting…</p>;
  }

  const upsertCompilation = async () => {
    if (!name.trim()) {
      toast.error("Give your compilation a name.");
      throw new Error("missing name");
    }
    setIsSaving(true);
    try {
      const payload = await apiFetch(
        "/api/compilations",
        username,
        {
          method: "POST",
          body: JSON.stringify({
            id: selectedCompilation ?? undefined,
            courseId: params.courseId,
            name,
            description,
            moduleOrder,
          }),
        },
      );
      setSelectedCompilation(payload.id);
      toast.success("Compilation saved");
      mutate();
      return payload.id as string;
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadCompilation = (compilationId: string) => {
    setSelectedCompilation(compilationId);
    const config = compilations?.find((comp) => comp.id === compilationId);
    if (config) {
      setName(config.name);
      setDescription(config.description ?? "");
      setModuleOrder(config.moduleOrder);
    }
  };

  const moveModule = (moduleId: string, direction: -1 | 1) => {
    setModuleOrder((prev) => {
      const index = prev.findIndex((item) => item.moduleId === moduleId);
      if (index === -1) return prev;
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const updated = [...prev];
      const [removed] = updated.splice(index, 1);
      updated.splice(newIndex, 0, removed);
      return updated;
    });
  };

  const toggleInclude = (moduleId: string) => {
    setModuleOrder((prev) =>
      prev.map((entry) =>
        entry.moduleId === moduleId
          ? { ...entry, include: !entry.include }
          : entry,
      ),
    );
  };

  const handlePreview = async () => {
    try {
      const compilationId = await upsertCompilation();
      setIsCompiling(true);
      const result = await apiFetch<{ html: string; pdfBase64: string }>(
        "/api/compile",
        username,
        {
          method: "POST",
          body: JSON.stringify({ compilationId }),
        },
      );
      setPreviewHtml(result.html);
      const blob = b64toBlob(result.pdfBase64, "application/pdf");
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      toast.success("Compilation ready!");
    } catch (error) {
      if ((error as Error).message !== "missing name") {
        toast.error((error as Error).message);
      }
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header>
        <p className="text-xs uppercase tracking-wide text-brand-600">
          Compiler
        </p>
        <h1 className="text-3xl font-bold text-slate-900">
          Build your textbook
        </h1>
        <p className="text-sm text-slate-600">
          Reorder modules, save configurations, and export HTML + PDF.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={selectedCompilation ?? ""}
            onChange={(event) => handleLoadCompilation(event.target.value)}
          >
            <option value="">Load saved compilation</option>
            {compilations?.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.name}
              </option>
            ))}
          </select>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Compilation name"
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2"
          />
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2"
          />
          <button className="btn-outline" onClick={upsertCompilation}>
            <BookMarked className="h-4 w-4" />
            Save
          </button>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Module order
          </h2>
          <div className="mt-4 space-y-3">
            {displayModules.map((module, index) => {
              const entry = moduleOrder[index];
              return (
                <div
                  key={module.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-semibold">{module.title}</p>
                    <p className="text-xs uppercase text-slate-400">
                      {module.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className={`rounded-full border px-2 py-1 text-xs ${
                        entry?.include
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 text-slate-500"
                      }`}
                      onClick={() => toggleInclude(module.id)}
                    >
                      <CheckSquare className="mr-1 inline h-3.5 w-3.5" />
                      {entry?.include ? "Included" : "Skip"}
                    </button>
                    <button
                      className="rounded-full border border-slate-200 p-1"
                      onClick={() => moveModule(module.id, -1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded-full border border-slate-200 p-1"
                      onClick={() => moveModule(module.id, 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Compile & export
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="btn-primary"
              onClick={handlePreview}
              disabled={isCompiling || isSaving}
            >
              {isCompiling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Compiling…
                </>
              ) : (
                "Preview HTML + PDF"
              )}
            </button>
            {pdfUrl && (
              <a
                href={pdfUrl}
                download={`${name || "textbook"}.pdf`}
                className="btn-outline"
              >
                Download PDF
              </a>
            )}
          </div>
          {previewHtml && (
            <div className="mt-4 h-[480px] overflow-hidden rounded-xl border">
              <iframe
                title="Compilation Preview"
                srcDoc={previewHtml}
                className="h-full w-full"
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function b64toBlob(b64Data: string, contentType = "", sliceSize = 512) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i += 1) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }

  return new Blob(byteArrays, { type: contentType });
}

