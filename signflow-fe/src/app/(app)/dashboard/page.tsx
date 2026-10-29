"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { getCurrentUserId } from "@/lib/auth";

interface DocumentData {
  id: number;
  title: string;
  category: string;
  createdAt: string;
  status: string;
}

interface ApprovalStepData {
  id: number;
  document: DocumentData;
  status: string;
  actionDate: string | null;
}

export default function DashboardPage() {
  const [pendingDocs, setPendingDocs] = useState<ApprovalStepData[]>([]);
  const [recentDocs, setRecentDocs] = useState<DocumentData[]>([]);

  const currentUserId = getCurrentUserId();

  const [user, setUser] = useState<{name: string}>({ name: "Loading..." });

  useEffect(() => {
    // Fetch info user aktif
    fetch(`http://localhost:8080/api/users/${getCurrentUserId()}`)
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data && data.name) setUser(data);
        else setUser({ name: "User Tidak Ditemukan" });
      })
      .catch(err => {
        console.log("Error dashboard user fetch:", err);
        setUser({ name: "User Tidak Ditemukan" });
      });

    // Gunakan timestamp untuk mencegah cache di browser / Next.js
    const t = new Date().getTime();
    
    // 1. Fetch Dokumen Menunggu Approval Saya
    fetch(`http://localhost:8080/api/documents/pending/${currentUserId}?t=${t}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setPendingDocs(data || []))
      .catch((err) => console.error("Error fetching pending docs:", err));

    // 2. Fetch Semua Dokumen (Untuk disimulasikan sebagai dokumen yang saya buat)
    fetch(`http://localhost:8080/api/documents?t=${t}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        // Ambil 5 dokumen terbaru, data sekarang berformat [{document, approvalSteps}]
        const extractedDocs = (data || []).map((item: any) => item.document);
        setRecentDocs(extractedDocs.slice(0, 5));
      })
      .catch((err) => console.error("Error fetching all docs:", err));
  }, []);

  const stats = [
    { title: "Menunggu TTD Saya", count: pendingDocs.length.toString(), desc: "Perlu tindakan segera", icon: "pending_actions", iconBg: "bg-[#fcbf46] text-[#271900]", link: "#perlu-tindakan" },
    { title: "Sirkulir Diproses", count: recentDocs.filter(d => d.status === "Diproses").length.toString(), desc: "Sedang dalam alur approval", icon: "sync", iconBg: "bg-[#006767] text-white", link: "/tracking?status=Diproses" },
    { title: "Disetujui Bulan Ini", count: recentDocs.filter(d => d.status === "Disetujui").length.toString(), desc: "Dokumen resmi selesai", icon: "verified", iconBg: "bg-emerald-600 text-white", link: "/tracking?status=Disetujui" },
    { title: "Ditolak / Revisi", count: recentDocs.filter(d => d.status === "Ditolak").length.toString(), desc: "Membutuhkan perbaikan", icon: "cancel", iconBg: "bg-rose-600 text-white", link: "/tracking?status=Ditolak" },
  ];

  return (
    <>
      <Header title="Dashboard Sirkulir Dokumen" breadcrumbs={[{ label: "SignFlow" }, { label: "Dashboard" }]} />
      <main className="p-6 space-y-6 flex-1 overflow-y-auto">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#006767] to-[#008282] rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold text-[#fcbf46] mb-2">
              <span>PORTAL RESMI BSI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Assalamu&apos;alaikum, {user.name.split(' ')[0]}!</h2>
            <p className="text-xs sm:text-sm text-white/80 mt-1">
              Ada <span className="font-bold text-[#fcbf46]">{pendingDocs.length} dokumen</span> yang membutuhkan tanda tangan dan persetujuan Anda hari ini.
            </p>
          </div>
          <Link href="/buat-sirkulir" className="inline-flex items-center justify-center space-x-2 bg-[#fcbf46] text-[#271900] px-5 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-[#f9bc44] transition-all shrink-0">
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>Buat Sirkulir Baru</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((item, idx) => {
            const Wrapper = item.link.startsWith('#') ? 'a' : Link;
            return (
              <Wrapper href={item.link} key={idx} className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md hover:border-[#006767]/30 transition-all group cursor-pointer relative overflow-hidden">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-gray-300 text-sm">open_in_new</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 group-hover:text-[#006767] transition-colors">{item.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{item.count}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${item.iconBg} group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-[26px]">{item.icon}</span>
                </div>
              </Wrapper>
            );
          })}
        </div>

        {/* Perlu Tindakan Saya (Disembunyikan jika role Initiator murni tanpa tugas TTD, tapi tampil default untuk Approver/Admin) */}
        {user.role !== "Initiator" && (
          <div id="perlu-tindakan" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">assignment_late</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Perlu Tindakan Saya</h3>
                  <p className="text-xs text-gray-500">Dokumen masuk yang menunggu tanda tangan Anda</p>
                </div>
              </div>
              <span className="bg-[#fcbf46] text-[#271900] text-xs font-bold px-2.5 py-1 rounded-full">{pendingDocs.length} Dokumen</span>
            </div>
            <div className="divide-y divide-gray-100">
              {pendingDocs.length === 0 ? (
                <p className="py-8 text-center text-gray-500 text-sm">Tidak ada dokumen yang menunggu persetujuan Anda saat ini.</p>
              ) : (
                pendingDocs.map((step) => (
                  <div key={step.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/80 -mx-2 px-2 rounded-xl transition-colors">
                    <div className="flex items-start space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#006767]/10 text-[#006767] flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[22px]">description</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="text-xs font-semibold text-[#006767] bg-[#006767]/10 px-2 py-0.5 rounded">{step.document.category}</span>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">MENUNGGU</span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 mt-1">{step.document.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Dibuat pada: {new Date(step.document.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <Link href={`/dokumen/${step.document.id}`} className="px-4 py-2 bg-[#006767] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#004f4f] transition-colors flex items-center space-x-1.5 self-end md:self-center shrink-0">
                      <span className="material-symbols-outlined text-[16px]">edit_document</span>
                      <span>Review & Tanda Tangan</span>
                    </Link>
                  </div>
              ))
            )}
          </div>
        </div>
        )}
        {/* Sirkulir yang Saya Buat (Terkirim) - Hanya tampil untuk Initiator/Admin */}
        {user.role !== "Approver" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#006767]/10 text-[#006767] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Sirkulir yang Saya Buat</h3>
                  <p className="text-xs text-gray-500">Pantau status dokumen yang telah Anda kirim</p>
                </div>
              </div>
              <Link href="/tracking" className="text-xs font-bold text-[#006767] hover:underline flex items-center">
                Lihat Semua <span className="material-symbols-outlined text-[14px] ml-0.5">arrow_forward</span>
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recentDocs.length === 0 ? (
                <p className="py-8 text-center text-gray-500 text-sm">Anda belum membuat dokumen sirkulir.</p>
              ) : (
                recentDocs.map((doc) => (
                  <div key={doc.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-gray-50/80 -mx-2 px-2 rounded-xl transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-[#006767] bg-[#006767]/10 px-2 py-0.5 rounded uppercase tracking-wider">{doc.category}</span>
                        {doc.projectName && (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded uppercase tracking-wider flex items-center">
                            <span className="material-symbols-outlined text-[10px] mr-1">sell</span>
                            {doc.projectName}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          doc.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' :
                          doc.status === 'Ditolak' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 truncate pr-4">{doc.title}</h4>
                    </div>
                    <div className="flex items-center space-x-4 shrink-0 text-xs">
                      <div className="text-right hidden sm:block">
                        <p className="text-gray-500 font-medium">Tanggal Dibuat</p>
                        <p className="font-semibold text-gray-700">{new Date(doc.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <Link href={`/tracking`} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-[#006767] hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
