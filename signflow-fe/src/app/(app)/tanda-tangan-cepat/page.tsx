"use client";

import dynamic from "next/dynamic";
import React from "react";

// Memuat komponen secara dinamis dan mematikan SSR
// agar library react-pdf (yang membutuhkan DOM/Browser murni) tidak crash di server Node.js
const TandaTanganClient = dynamic(() => import("./TandaTanganClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f9fc]">
      <div className="flex flex-col items-center">
        <span className="animate-spin material-symbols-outlined text-4xl text-[#006767] mb-4">sync</span>
        <p className="text-[#006767] font-semibold">Memuat Modul PDF...</p>
      </div>
    </div>
  ),
});

export default function TandaTanganCepatPage() {
  return <TandaTanganClient />;
}
