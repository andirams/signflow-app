"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { getCurrentUserId } from "@/lib/auth";

interface ApprovalStep {
  name: string;
  role: string;
  status: "approved" | "waiting" | "rejected" | "pending";
  timestamp: string;
  note?: string | null;
  approverId?: number;
}

interface DocumentItem {
  id: string;
  title: string;
  category: string; // allow all categories
  projectName: string | null;
  createdAt: string;
  createdDate: string; // YYYY-MM-DD
  status: "Diproses" | "Disetujui" | "Ditolak";
  approvedCount: number;
  totalSteps: number;
  approvalSteps: ApprovalStep[];
}

export default function TrackingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedProject, setSelectedProject] = useState("Semua");
  const [selectedPeriod, setSelectedPeriod] = useState("Semua");
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [realDocuments, setRealDocuments] = useState<any[]>([]);
  const [availableProjects, setAvailableProjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Read params on mount safely
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const statusParam = params.get("status");
      if (statusParam) setSelectedStatus(statusParam);
    }
    
    // Fetch unique projects for filter dropdown
    fetch("http://localhost:8080/api/documents/projects")
      .then((res) => res.json())
      .then((data) => setAvailableProjects(data))
      .catch((err) => console.error("Gagal mengambil daftar project:", err));
  }, []);

  // Ambil data real dari API
  React.useEffect(() => {
    fetch(`http://localhost:8080/api/documents?t=${new Date().getTime()}`, { cache: "no-store" })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Map data backend ke format yang dibutuhkan UI
          const mappedDocs = data.map((item: any) => {
            const doc = item.document;
            const steps = item.approvalSteps || [];
            
            const approvedCount = steps.filter((s: any) => s.status === "Disetujui").length;
            
            return {
              id: doc.id.toString(),
              title: doc.title,
              category: doc.category,
              projectName: doc.projectName || null,
              createdAt: new Date(doc.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }),
              createdDate: doc.createdAt,
              status: doc.status,
              approvedCount: approvedCount,
              totalSteps: steps.length,
              approvalSteps: steps.map((s: any) => ({
                approverId: s.approver?.id,
                name: s.approver?.name || `Approver ID ${s.approver?.id}`,
                role: s.approver?.department || "Unit Kerja",
                status: s.status === "Disetujui" ? "approved" : (s.status === "Ditolak" ? "rejected" : (s.status === "Menunggu" ? "waiting" : "pending")),
                timestamp: s.actionDate ? new Date(s.actionDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Sedang Menunggu",
                note: s.comments || null
              }))
            };
          });
          setRealDocuments(mappedDocs);
        }
      })
      .catch(err => console.error("Error fetching documents:", err))
      .finally(() => setIsLoading(false));
  }, []);

  // Toggle card expansion
  const toggleExpand = (id: string) => {
    setExpandedDocId((prev) => (prev === id ? null : id));
  };

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return realDocuments.filter((doc) => {
      // Search
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        doc.title.toLowerCase().includes(query) ||
        (doc.projectName && doc.projectName.toLowerCase().includes(query)) ||
        doc.id.toLowerCase().includes(query);

      // Status
      const matchStatus =
        selectedStatus === "Semua" || doc.status === selectedStatus;

      // Category
      const matchCategory =
        selectedCategory === "Semua" || doc.category === selectedCategory;

      // Project
      const matchProject =
        selectedProject === "Semua" || doc.projectName === selectedProject;

      // Period (calculated relative to today instead of hardcoded 2026-09-06)
      let matchPeriod = true;
      if (selectedPeriod !== "Semua") {
        const docDate = new Date(doc.createdDate).getTime();
        const refDate = new Date().getTime(); // Hari ini
        const diffDays = (refDate - docDate) / (1000 * 3600 * 24);

        if (selectedPeriod === "7 hari") {
          matchPeriod = diffDays <= 7;
        } else if (selectedPeriod === "30 hari") {
          matchPeriod = diffDays <= 30;
        } else if (selectedPeriod === "3 bulan") {
          matchPeriod = diffDays <= 90;
        }
      }

      return matchSearch && matchStatus && matchCategory && matchProject && matchPeriod;
    });
  }, [realDocuments, searchQuery, selectedStatus, selectedCategory, selectedProject, selectedPeriod]);

  // Helpers for Status Badges
  const getStatusBadge = (status: DocumentItem["status"]) => {
    switch (status) {
      case "Diproses":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Diproses
          </span>
        );
      case "Disetujui":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Disetujui
          </span>
        );
      case "Ditolak":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
            <span className="material-symbols-outlined text-[14px]">cancel</span>
            Ditolak
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] flex flex-col">
      {/* Header */}
      <Header
        title="Tracking Dokumen"
        breadcrumbs={[
          { label: "SignFlow", href: "/dashboard" },
          { label: "Tracking Dokumen" },
        ]}
      />

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Top Section - Search, Filters & Action Button */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none">
                search
              </span>
              <input
                type="text"
                placeholder="Cari dokumen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#f7f9fc] text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006767]/30 focus:border-[#006767] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>

            {/* Action Button: Buat Sirkulir Baru */}
            <Link
              href="/buat-sirkulir"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#006767] hover:bg-[#004f4f] text-white font-medium text-sm shadow-sm hover:shadow transition-all group"
            >
              <span className="material-symbols-outlined text-lg group-hover:rotate-90 transition-transform">
                add
              </span>
              <span>Buat Sirkulir Baru</span>
            </Link>
          </div>

          {/* Filter Dropdowns in a Row */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mr-1">
              <span className="material-symbols-outlined text-base text-[#006767]">
                tune
              </span>
              <span>Filter:</span>
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs font-medium bg-[#f7f9fc] border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#006767] cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="Semua">Semua</option>
                <option value="Diproses">Diproses</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>

            {/* Filter Kategori */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Kategori:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs font-medium bg-[#f7f9fc] border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#006767] cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="Semua">Semua</option>
                <option value="Memo Internal">Memo Internal</option>
                <option value="Surat Edaran">Surat Edaran</option>
                <option value="Perjanjian Kerjasama">Perjanjian Kerjasama</option>
                <option value="Surat Keputusan">Surat Keputusan</option>
                <option value="Berita Acara">Berita Acara</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            {/* Filter Project */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Project:</span>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="text-xs font-medium bg-[#f7f9fc] border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#006767] cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="Semua">Semua</option>
                {availableProjects.map((proj, idx) => (
                  <option key={idx} value={proj}>{proj}</option>
                ))}
              </select>
            </div>

            {/* Filter Periode */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Periode:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="text-xs font-medium bg-[#f7f9fc] border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#006767] cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="7 hari">7 hari</option>
                <option value="30 hari">30 hari</option>
                <option value="3 bulan">3 bulan</option>
                <option value="Semua">Semua</option>
              </select>
            </div>

            {/* Reset Filters */}
            {(selectedStatus !== "Semua" ||
              selectedCategory !== "Semua" ||
              selectedPeriod !== "Semua" ||
              searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus("Semua");
                  setSelectedCategory("Semua");
                  setSelectedPeriod("Semua");
                  setSearchQuery("");
                }}
                className="ml-auto text-xs text-[#006767] hover:text-[#004f4f] font-medium flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                Reset Filter
              </button>
            )}
          </div>
        </section>

        {/* Document Cards List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-gray-700">
              Daftar Dokumen Diajukan ({filteredDocuments.length})
            </h2>
            <span className="text-xs text-gray-400">
              Klik pada baris kartu untuk melihat progres alur persetujuan
            </span>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center shadow-sm">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <span className="material-symbols-outlined text-3xl">search_off</span>
              </div>
              <h3 className="text-base font-medium text-gray-800">
                Tidak ada dokumen yang sesuai
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Coba sesuaikan kata kunci pencarian atau ubah kriteria filter status, kategori, dan periode.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus("Semua");
                  setSelectedCategory("Semua");
                  setSelectedPeriod("Semua");
                  setSearchQuery("");
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-[#006767]/10 text-[#006767] text-xs font-semibold hover:bg-[#006767]/20 transition-colors"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            filteredDocuments.map((doc) => {
              const isExpanded = expandedDocId === doc.id;
              const progressPercent = Math.round(
                (doc.approvedCount / doc.totalSteps) * 100
              );
              const needsMyAction = doc.approvalSteps.some((s: any) => s.approverId === getCurrentUserId() && s.status === "waiting");

              return (
                <div
                  key={doc.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${
                    isExpanded
                      ? "border-[#006767]/40 ring-1 ring-[#006767]/20"
                      : needsMyAction 
                        ? "border-[#fcbf46] ring-1 ring-[#fcbf46]/30 bg-orange-50/20" 
                        : "border-gray-100"
                  }`}
                >
                  {/* Card Header / Summary Row */}
                  <div
                    onClick={() => toggleExpand(doc.id)}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none hover:bg-gray-50/50 transition-colors relative"
                  >
                    {needsMyAction && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#fcbf46]"></div>
                    )}
                    {/* Left & Center: Icon + Document Details */}
                    <div className="flex items-start md:items-center gap-4 min-w-0 pl-1">
                      {/* Left: Document Icon in Teal BG Circle */}
                      <div className="w-12 h-12 shrink-0 rounded-full bg-[#006767]/10 text-[#006767] flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">
                          description
                        </span>
                      </div>

                      {/* Center: Title, Category Badge, Created Date */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-medium text-gray-400">
                            #{doc.id}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#006767]/10 text-[#006767]">
                            {doc.category}
                          </span>
                          {doc.projectName && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                              <span className="material-symbols-outlined text-[12px] mr-1">sell</span>
                              {doc.projectName}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm md:text-base leading-snug truncate">
                          {doc.title}
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">
                            calendar_today
                          </span>
                          <span>Dibuat: {doc.createdAt}</span>
                        </p>
                      </div>
                    </div>

                    {/* Right: Action Button, Status Badge, Mini Progress Bar, Expand Chevron */}
                    <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                      
                      {/* Action Button untuk Tanda Tangan Langsung */}
                      {needsMyAction && (
                        <Link
                          href={`/dokumen/${doc.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-[#006767] hover:bg-[#004f4f] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors animate-pulse hover:animate-none"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit_document</span>
                          <span>Review & TTD</span>
                        </Link>
                      )}

                      {/* Tombol Lihat & Unduh untuk dokumen selesai */}
                      {(doc.status === "Disetujui" || doc.status === "Ditolak") && (
                        <Link
                          href={`/dokumen/${doc.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold shadow-sm border border-gray-200 flex items-center gap-1.5 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          <span>Lihat & Unduh</span>
                        </Link>
                      )}

                      {/* Status Badge */}
                      <div className="shrink-0">{getStatusBadge(doc.status)}</div>

                      {/* Mini Progress Bar */}
                      <div className="w-32 hidden sm:block">
                        <div className="flex justify-between items-center text-[11px] mb-1">
                          <span className="text-gray-500 font-medium">Progress</span>
                          <span className="font-semibold text-gray-700">
                            {doc.approvedCount}/{doc.totalSteps} Approved
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              doc.status === "Ditolak"
                                ? "bg-rose-500"
                                : doc.status === "Disetujui"
                                ? "bg-emerald-500"
                                : "bg-[#006767]"
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Expand Chevron Icon */}
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 group-hover:text-gray-800 transition-colors">
                        <span
                          className={`material-symbols-outlined text-xl transition-transform duration-200 ${
                            isExpanded ? "rotate-180 text-[#006767]" : ""
                          }`}
                        >
                          expand_more
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Section: Inline Approval Timeline */}
                  {isExpanded && (
                    <div className="px-5 pb-6 pt-2 border-t border-gray-100 bg-[#f7f9fc]/50">
                      <div className="max-w-3xl">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#006767] flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-base">
                              timeline
                            </span>
                            Alur Persetujuan Dokumen ({doc.approvedCount}/{doc.totalSteps} Approved)
                          </h4>
                          <span className="text-xs text-gray-500">
                            Status: <strong className="text-gray-800">{doc.status}</strong>
                          </span>
                        </div>

                        {/* Vertical Stepper Timeline */}
                        <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                          {doc.approvalSteps.map((step, index) => {
                            let icon = (
                              <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                            );
                            let iconContainerClass =
                              "bg-white border-2 border-gray-300 text-gray-400";
                            let statusText = "Menunggu Giliran";
                            let statusBadgeColor = "text-gray-500 bg-gray-100";

                            if (step.status === "approved") {
                              icon = (
                                <span className="material-symbols-outlined text-sm font-bold text-white">
                                  check
                                </span>
                              );
                              iconContainerClass =
                                "bg-emerald-600 border-2 border-emerald-600 text-white shadow-sm";
                              statusText = "Disetujui";
                              statusBadgeColor = "text-emerald-700 bg-emerald-50 border border-emerald-200";
                            } else if (step.status === "waiting") {
                              icon = (
                                <span className="w-2.5 h-2.5 rounded-full bg-[#F0B43C]"></span>
                              );
                              iconContainerClass =
                                "bg-white border-2 border-[#F0B43C] text-[#F0B43C]";
                              statusText = "Sedang Ditinjau";
                              statusBadgeColor = "text-amber-700 bg-amber-50 border border-amber-200";
                            } else if (step.status === "rejected") {
                              icon = (
                                <span className="material-symbols-outlined text-sm font-bold text-white">
                                  close
                                </span>
                              );
                              iconContainerClass =
                                "bg-rose-600 border-2 border-rose-600 text-white shadow-sm";
                              statusText = "Ditolak";
                              statusBadgeColor = "text-rose-700 bg-rose-50 border border-rose-200";
                            }

                            return (
                              <div key={index} className="relative group">
                                {/* Step Circle Indicator */}
                                <div
                                  className={`absolute -left-[30px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all ${iconContainerClass}`}
                                >
                                  {icon}
                                </div>

                                {/* Step Content Card */}
                                <div className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-xs space-y-1.5">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                    <div>
                                      <span className="text-sm font-semibold text-gray-900 mr-2">
                                        {step.name}
                                      </span>
                                      <span className="text-xs text-gray-500 font-medium">
                                        • {step.role}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${statusBadgeColor}`}
                                      >
                                        {statusText}
                                      </span>
                                      <span className="text-xs text-gray-400 font-mono">
                                        {step.timestamp}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Step Notes / Catatan */}
                                  {step.note && (
                                    <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5 border-l-2 border-[#006767]">
                                      <span className="font-medium text-gray-700">Catatan: </span>
                                      &ldquo;{step.note}&rdquo;
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>

        {/* Bottom: Simple Pagination */}
        <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            Menampilkan <span className="font-semibold text-gray-800">{filteredDocuments.length}</span> dari{" "}
            <span className="font-semibold text-gray-800">{realDocuments.length}</span> total dokumen
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                currentPage === 1
                  ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100"
              }`}
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              className="w-8 h-8 rounded-lg text-xs font-semibold bg-[#006767] text-white flex items-center justify-center shadow-xs"
            >
              Page 1
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(2, p + 1))}
              disabled={currentPage === 2}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                currentPage === 2
                  ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100"
              }`}
            >
              Next
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
