"use client";

import { useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ModuleEditor, ModuleFormState } from "@/components/modules/module-editor";
import { useRequiredUsername } from "@/hooks/use-required-username";
import { apiFetch } from "@/lib/client-fetch";
import { ModuleSummary } from "@/types";

const defaultState: ModuleFormState = {
  title: "",
  type: "notes",
  tags: [],
  contentMarkdown: "",
};

export default function NewModulePage({
  params,
}: {
  params: { courseId: string };
}) {
  const username = useRequiredUsername();
  const [formState, setFormState] = useState<ModuleFormState>(defaultState);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const { data: modules } = useSWR<ModuleSummary[]>(
    username ? `/api/courses/${params.courseId}/modules` : null,
    (url) => apiFetch<ModuleSummary[]>(url, username!),
  );

  if (!username) {
    return <p className="p-10 text-center">Redirecting…</p>;
  }

  const persistKey = `module-draft-${params.courseId}-new`;

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload = await apiFetch<{ id: string }>(
        `/api/courses/${params.courseId}/modules`,
        username,
        {
          method: "POST",
          body: JSON.stringify({
            ...formState,
            tags: formState.tags,
          }),
        },
      );
      toast.success("Module created!");
      localStorage.removeItem(persistKey);
      router.push(`/courses/${params.courseId}/modules/${payload.id}`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div>
        <p className="text-sm uppercase tracking-wide text-brand-600">
          New module
        </p>
        <h1 className="text-3xl font-bold text-slate-900">
          Create module draft
        </h1>
      </div>
      <ModuleEditor
        value={formState}
        onChange={setFormState}
        onSave={handleSave}
        isSaving={isSaving}
        availableModules={modules ?? []}
        persistKey={persistKey}
      />
    </div>
  );
}

