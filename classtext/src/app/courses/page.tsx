"use client";

import useSWR from "swr";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { apiFetch } from "@/lib/client-fetch";
import { useRequiredUsername } from "@/hooks/use-required-username";
import { CourseSummary } from "@/types";
import { useUser } from "@/components/providers/user-provider";

export default function CoursesPage() {
  const username = useRequiredUsername();
  const router = useRouter();
  const { setUsername } = useUser();
  const { data, isLoading, mutate: refreshCourses } = useSWR<CourseSummary[]>(
    username ? "/api/courses" : null,
    (url) => apiFetch<CourseSummary[]>(url, username!),
  );

  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);

  if (!username) {
    return (
      <div className="flex min-h-screen items-center justify-center text-lg">
        Redirecting to login...
      </div>
    );
  }

  const handleCreateCourse = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/api/courses", username, {
        method: "POST",
        body: JSON.stringify({
          name: courseName,
          code: courseCode,
          description: courseDescription,
        }),
      });
      toast.success("Course created!");
      setCourseName("");
      setCourseCode("");
      setCourseDescription("");
      refreshCourses();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinCourse = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/api/courses/join", username, {
        method: "POST",
        body: JSON.stringify({ code: joinCode }),
      });
      toast.success("Joined course!");
      setJoinCode("");
      refreshCourses();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-brand-600">
            Dashboard
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Your Courses</h1>
          <p className="text-slate-600">
            Welcome back, {username}. Choose a course or create a new one.
          </p>
        </div>
        <button
          className="btn-outline"
          onClick={() => {
            setUsername(null);
            window.location.href = "/";
          }}
        >
          Switch account
        </button>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <form
          onSubmit={handleCreateCourse}
          className="card space-y-3 border-brand-100 bg-gradient-to-br from-white via-white to-brand-50/40"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            Create a course
          </h2>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
            placeholder="Course name"
            value={courseName}
            onChange={(event) => setCourseName(event.target.value)}
          />
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 uppercase tracking-wide"
            placeholder="Code (ex: AP-CHEM)"
            value={courseCode}
            onChange={(event) => setCourseCode(event.target.value)}
          />
          <textarea
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
            placeholder="Short description"
            rows={3}
            value={courseDescription}
            onChange={(event) => setCourseDescription(event.target.value)}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full"
          >
            Save course
          </button>
        </form>

        <form
          onSubmit={handleJoinCourse}
          className="card space-y-3 border-slate-200"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            Join a course
          </h2>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 uppercase tracking-wide"
            placeholder="Join code"
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value)}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-outline w-full"
          >
            Join
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">
          Available courses
        </h2>
        {isLoading && <p>Loading courses…</p>}
        {!isLoading && (!data || data.length === 0) && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-6 text-slate-500">
            You are not enrolled in a course yet.
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {data?.map((course) => (
            <button
              key={course.id}
              className="card flex flex-col items-start text-left transition hover:border-brand-200 hover:shadow-md"
              onClick={() => router.push(`/courses/${course.id}`)}
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {course.role === "teacher" ? "Teacher" : "Student"}
              </p>
              <h3 className="text-lg font-semibold text-slate-900">
                {course.name}
              </h3>
              <p className="text-sm text-slate-600">{course.description}</p>
              <div className="mt-3 flex gap-3 text-xs text-slate-500">
                <span>Code: {course.code}</span>
                <span>{course.moduleCount} modules</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

