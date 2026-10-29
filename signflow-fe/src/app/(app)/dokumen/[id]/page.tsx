"use client";

import dynamic from "next/dynamic";

// Mematikan SSR agar react-pdf bisa berjalan lancar di browser
const DocumentDetailClient = dynamic(() => import("./DocumentDetailClient"), {
  ssr: false,
});

export default function DocumentPage() {
  return <DocumentDetailClient />;
}
