import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAG Vector DB Manager",
  description: "Create and manage vector stores from PDFs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
