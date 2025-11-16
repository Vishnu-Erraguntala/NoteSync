"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const features = [
  {
    title: "Modular Knowledge",
    description: "Break down complex topics into digestible modules - definitions, examples, problems, and explanations.",
    icon: "📚",
  },
  {
    title: "Version Control",
    description: "Track every change with built-in version history. View diffs, restore previous versions, and see who contributed what.",
    icon: "🔄",
  },
  {
    title: "Smart References",
    description: "Link modules together with @module syntax. References automatically resolve in your compiled textbook.",
    icon: "🔗",
  },
  {
    title: "One-Click Publishing",
    description: "Compile your modules into beautiful HTML or PDF textbooks with table of contents and cross-references.",
    icon: "📖",
  },
];

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) {
          router.push("/courses");
        }
      })
      .catch(() => {
        // Not logged in, stay on home page
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold text-slate-900 mb-4">
              NoteSync
            </h1>
            <p className="text-2xl text-slate-600 mb-8">
              The collaborative textbook built by your class
            </p>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-12">
              Students can draft modules, review previous versions, and compile beautiful course readers. 
              No AI shortcuts—just thoughtful writing together.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/signup"
                className="rounded-lg bg-indigo-600 px-8 py-3 font-medium text-white hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="rounded-lg bg-white px-8 py-3 font-medium text-slate-900 hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl border border-slate-200"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mt-16">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl bg-white p-8 shadow-xl hover:shadow-2xl transition-shadow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
