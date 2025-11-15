"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ModuleSummary } from "@/types";
import { ModuleType } from "@/generated/prisma/enums";
import { resolveModuleReferences } from "@/lib/reference";

const MODULE_TYPES: { label: string; value: ModuleType }[] = [
  { label: "Definition", value: "definition" },
  { label: "Explanation", value: "explanation" },
  { label: "Example", value: "example" },
  { label: "Problem", value: "problem" },
  { label: "Notes", value: "notes" },
  { label: "Other", value: "other" },
];

export type ModuleFormState = {
  title: string;
  type: ModuleType;
  tags: string[];
  contentMarkdown: string;
};

type ModuleEditorProps = {
  value: ModuleFormState;
  onChange: (value: ModuleFormState) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
  availableModules: ModuleSummary[];
  persistKey: string;
  lastServerUpdatedAt?: string;
};

export function ModuleEditor(props: ModuleEditorProps) {
  const {
    value,
    onChange,
    onSave,
    isSaving,
    availableModules,
    persistKey,
    lastServerUpdatedAt,
  } = props;

  const [referenceSearch, setReferenceSearch] = useState("");
  const [isRestored, setIsRestored] = useState(false);
  const restoreChecked = useRef(false);

  const handleFieldChange = <K extends keyof ModuleFormState>(
    key: K,
    input: ModuleFormState[K],
  ) => {
    onChange({ ...value, [key]: input });
  };

  useEffect(() => {
    if (typeof window === "undefined" || restoreChecked.current) return;
    const rawDraft = localStorage.getItem(persistKey);
    if (!rawDraft) return;
    try {
      const parsed = JSON.parse(rawDraft);
      if (
        parsed?.contentMarkdown &&
        (!lastServerUpdatedAt ||
          parsed.updatedAt > new Date(lastServerUpdatedAt).getTime())
      ) {
        const shouldRestore = window.confirm(
          "A newer local draft was found. Restore it?",
        );
        if (shouldRestore) {
          onChange({
            title: parsed.title ?? value.title,
            type: parsed.type ?? value.type,
            tags: parsed.tags ?? value.tags,
            contentMarkdown: parsed.contentMarkdown ?? value.contentMarkdown,
          });
          setIsRestored(true);
        }
      }
    } catch {
      // ignore bad drafts
    } finally {
      restoreChecked.current = true;
    }
  }, [persistKey, lastServerUpdatedAt, onChange, value]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const timeout = setTimeout(() => {
      localStorage.setItem(
        persistKey,
        JSON.stringify({
          ...value,
          updatedAt: Date.now(),
        }),
      );
    }, 2000);
    return () => clearTimeout(timeout);
  }, [persistKey, value]);

  const matchedModules = useMemo(() => {
    if (!referenceSearch) return availableModules;
    return availableModules.filter((module) =>
      module.title.toLowerCase().includes(referenceSearch.toLowerCase()),
    );
  }, [referenceSearch, availableModules]);

  const resolvedPreview = useMemo(
    () =>
      resolveModuleReferences(
        value.contentMarkdown,
        availableModules.map((module) => ({
          id: module.id,
          title: module.title,
        })),
      ),
    [value.contentMarkdown, availableModules],
  );

  const tagsInput = value.tags.join(", ");

  return (
    <div className="space-y-4">
      {isRestored && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-800">
          Restored draft from your device.
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <input
            value={value.title}
            onChange={(event) => handleFieldChange("title", event.target.value)}
            placeholder="Module title"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-semibold"
          />
          <div className="flex gap-3">
            <select
              value={value.type}
              onChange={(event) =>
                handleFieldChange("type", event.target.value as ModuleType)
              }
              className="w-40 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              {MODULE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <input
              value={tagsInput}
              onChange={(event) =>
                handleFieldChange(
                  "tags",
                  event.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                )
              }
              placeholder="Tags separated by commas"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <textarea
            value={value.contentMarkdown}
            onChange={(event) =>
              handleFieldChange("contentMarkdown", event.target.value)
            }
            className="h-[480px] w-full rounded-2xl border border-slate-200 bg-white/70 p-4 font-mono text-sm shadow-inner"
            placeholder="Write your Markdown content here..."
          />
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Reference helper
                </p>
                <p className="text-xs text-slate-500">
                  Insert @module references without remembering IDs.
                </p>
              </div>
              <button
                type="button"
                className="btn-outline text-xs"
                onClick={onSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving…" : "Save module"}
              </button>
            </div>
            <input
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Search modules"
              value={referenceSearch}
              onChange={(event) => setReferenceSearch(event.target.value)}
            />
            <div className="mt-3 max-h-48 overflow-y-auto text-sm">
              {matchedModules.map((module) => (
                <div
                  key={module.id}
                  className="flex items-center justify-between border-b border-slate-100 py-2 last:border-none"
                >
                  <div>
                    <p className="font-medium text-slate-800">{module.title}</p>
                    <p className="text-xs uppercase text-slate-400">
                      {module.type}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="text-xs text-brand-600 underline"
                      onClick={() =>
                        handleFieldChange(
                          "contentMarkdown",
                          `${value.contentMarkdown} @module:${module.id} `,
                        )
                      }
                    >
                      By ID
                    </button>
                    <button
                      className="text-xs text-slate-600 underline"
                      onClick={() =>
                        handleFieldChange(
                          "contentMarkdown",
                          `${value.contentMarkdown} @module[${module.title}] `,
                        )
                      }
                    >
                      By title
                    </button>
                  </div>
                </div>
              ))}
              {!matchedModules.length && (
                <p className="py-4 text-center text-xs text-slate-500">
                  No modules found.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Live preview
          </p>
          <div className="prose prose-slate mt-4 max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {resolvedPreview || "_Start writing to see the preview..._"}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}

