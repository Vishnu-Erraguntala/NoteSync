import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { UserProvider } from "@/components/providers/user-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NoteSync",
  description:
    "Collaborative, student-built textbooks with modular Markdown content.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <UserProvider>
          <Toaster position="top-right" />
          <div className="min-h-screen">{children}</div>
        </UserProvider>
      </body>
    </html>
  );
}
