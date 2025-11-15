"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useUser } from "@/components/providers/user-provider";

const features = [
  "Write modular Markdown definitions, examples, and problems",
  "Track every revision with instant version history",
  "Reference other modules using @module shortcuts",
  "Compile a polished HTML + PDF textbook with a single click",
];

export default function Home() {
  const router = useRouter();
  const { username, setUsername } = useUser();
  const [name, setName] = useState(username ?? "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    setUsername(trimmed);
    router.push("/courses");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl space-y-10 rounded-3xl bg-white p-10 shadow-xl">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            NoteSync
          </p>
          <h1 className="text-4xl font-bold text-slate-900">
            The collaborative textbook built by your class.
          </h1>
          <p className="text-lg text-slate-600">
            High school students can draft modules, review previous versions,
            and compile a beautiful course reader without needing any extra
            tools. No AI shortcuts—just thoughtful writing together.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 shadow-inner"
          >
            <label className="text-sm font-medium text-slate-700">
              Enter a display name to get started
            </label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                placeholder="e.g. Maya P. or Coach Lopez"
              />
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="btn-primary min-w-[180px]"
              >
                {loading ? "Loading..." : "Enter NoteSync"}
              </button>
            </div>
            {username && (
              <button
                type="button"
                className="mt-4 text-sm font-medium text-brand-600 underline"
                onClick={() => router.push("/courses")}
              >
                Continue as {username}
              </button>
            )}
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Why NoteSync?
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              {features.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
