"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

interface Approver {
  id: number;
  name: string;
  department: string;
  email: string;
}

const CATEGORY_OPTIONS = [
  "Memo Internal",
  "Surat Edaran",
  "Perjanjian Kerjasama",
  "Surat Keputusan",
  "Berita Acara",
  "Lainnya",
];

export default function BuatSirkulirPage() {
  const router = useRouter();

  // Data Asli dari Backend
  const [availableUsers, setAvailableUsers] = useState<Approver[]>([]);
  const [existingProjects, setExistingProjects] = useState<string[]>([]);

  useEffect(() => {
    fetch("http://localhost:8080/api/users")
      .then((res) => res.json())
      .then((data) => setAvailableUsers(data))
      .catch((err) => console.error("Gagal mengambil data user:", err));
      
    fetch("http://localhost:8080/api/documents/projects")
      .then((res) => res.json())
      .then((data) => setExistingProjects(data))
      .catch((err) => console.error("Gagal mengambil daftar project:", err));
  }, []);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newDocumentId, setNewDocumentId] = useState<number | null>(null);

  // Form State: Step 1
  const [judulDokumen, setJudulDokumen] = useState("");
  const [projectName, setProjectName] = useState("");
  const [kategori, setKategori] = useState(CATEGORY_OPTIONS[0]);
  const [deskripsi, setDeskripsi] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State: Step 2
  const [approvers, setApprovers] = useState<Approver[]>([]);

  // Initialize first approver when users are loaded
  useEffect(() => {
    if (availableUsers.length > 0 && approvers.length === 0) {
      setApprovers([availableUsers[0]]);
    }
  }, [availableUsers]);

  // Handle Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSimulateUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Approver Management
  const handleAddApprover = () => {
    if (availableUsers.length > 0) {
      setApprovers([...approvers, availableUsers[0]]);
    }
  };

  const handleRemoveApprover = (indexToRemove: number) => {
    if (approvers.length <= 1) {
      alert("Minimal harus ada 1 approver dalam sirkulasi dokumen.");
      return;
    }
    setApprovers(approvers.filter((_, idx) => idx !== indexToRemove));
  };

  const handleApproverChange = (index: number, userId: number) => {
    const selectedUser = availableUsers.find((u) => u.id === userId);
    if (selectedUser) {
      const newApprovers = [...approvers];
      newApprovers[index] = selectedUser;
      setApprovers(newApprovers);
    }
  };

  // Step Validation & Navigation
  const handleNextStep1 = () => {
    if (!judulDokumen.trim()) {
      alert("Mohon isi Judul Dokumen terlebih dahulu.");
      return;
    }
    if (!projectName.trim()) {
      alert("Mohon isi Nama / Kode Project terlebih dahulu.");
      return;
    }
    if (!file) {
      alert("Mohon unggah dokumen terlebih dahulu.");
      return;
    }
    setCurrentStep(2);
  };

  const handleNextStep2 = () => {
    const hasEmpty = approvers.some((a) => !a || !a.id);
    if (hasEmpty) {
      alert("Mohon lengkapi pilihan seluruh approver.");
      return;
    }
    setCurrentStep(3);
  };

  const handleSubmitSirkulir = async () => {
    if (!file) return;

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", judulDokumen);
      formData.append("category", kategori);
      formData.append("description", deskripsi);
      formData.append("projectName", projectName);
      formData.append("initiatorId", "1"); // Asumsi initiator ID = 1 (Misal: Ahmad Fauzi)
      
      const approverIds = approvers.map(a => a.id);
      formData.append("approverIds", JSON.stringify(approverIds));

      const response = await fetch("http://localhost:8080/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setNewDocumentId(data.id);
      setShowSuccessModal(true);
    } catch (error: any) {
      alert("Terjadi kesalahan: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishAndRedirect = () => {
    setShowSuccessModal(false);
    router.push(newDocumentId ? `/dokumen/${newDocumentId}` : "/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <Header
        title="Buat Sirkulir Baru"
        breadcrumbs={[
          { label: "SignFlow", href: "/dashboard" },
          { label: "Buat Sirkulir Baru" },
        ]}
      />

      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
        {/* Step Indicator */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="relative flex items-center justify-between max-w-2xl mx-auto">
            {/* Connecting Lines */}
            <div className="absolute top-5 left-8 right-8 h-1 bg-gray-200 -z-0">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{
                  width:
                    currentStep === 1
                      ? "0%"
                      : currentStep === 2
                      ? "50%"
                      : "100%",
                }}
              />
            </div>

            {/* Step 1 */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                  currentStep > 1
                    ? "bg-emerald-500 text-white ring-4 ring-emerald-100"
                    : currentStep === 1
                    ? "bg-[#006767] text-white ring-4 ring-teal-100 shadow-md"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {currentStep > 1 ? (
                  <span className="material-symbols-outlined text-xl">check</span>
                ) : (
                  "1"
                )}
              </div>
              <span
                className={`mt-2 text-xs md:text-sm text-center font-medium ${
                  currentStep === 1
                    ? "text-[#006767] font-semibold"
                    : currentStep > 1
                    ? "text-emerald-700"
                    : "text-gray-400"
                }`}
              >
                Upload Dokumen
              </span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                  currentStep > 2
                    ? "bg-emerald-500 text-white ring-4 ring-emerald-100"
                    : currentStep === 2
                    ? "bg-[#006767] text-white ring-4 ring-teal-100 shadow-md"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {currentStep > 2 ? (
                  <span className="material-symbols-outlined text-xl">check</span>
                ) : (
                  "2"
                )}
              </div>
              <span
                className={`mt-2 text-xs md:text-sm text-center font-medium ${
                  currentStep === 2
                    ? "text-[#006767] font-semibold"
                    : currentStep > 2
                    ? "text-emerald-700"
                    : "text-gray-400"
                }`}
              >
                Tentukan Alur Approval
              </span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                  currentStep === 3
                    ? "bg-[#006767] text-white ring-4 ring-teal-100 shadow-md"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                3
              </div>
              <span
                className={`mt-2 text-xs md:text-sm text-center font-medium ${
                  currentStep === 3
                    ? "text-[#006767] font-semibold"
                    : "text-gray-400"
                }`}
              >
                Konfirmasi & Kirim
              </span>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          {/* STEP 1: Upload Dokumen */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-[#004f4f] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006767]">
                    note_add
                  </span>
                  Langkah 1: Upload & Informasi Dokumen
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Masukkan rincian dokumen dan unggah berkas PDF betulan yang akan disirkulasikan.
                </p>
              </div>

              {/* Judul Dokumen */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Judul Dokumen <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={judulDokumen}
                  onChange={(e) => setJudulDokumen(e.target.value)}
                  placeholder="Contoh: Pengajuan Pengadaan Server Core Banking Q3 2026"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#006767] focus:ring-2 focus:ring-[#006767]/20 text-gray-800 placeholder-gray-400 text-sm transition-all"
                />
              </div>

              {/* Nama / Kode Project */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama / Kode Project <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  list="project-list"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Ketik project baru atau pilih dari daftar existing..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#006767] focus:ring-2 focus:ring-[#006767]/20 text-gray-800 placeholder-gray-400 text-sm transition-all"
                />
                <datalist id="project-list">
                  {existingProjects.map((proj, idx) => (
                    <option key={idx} value={proj} />
                  ))}
                </datalist>
                <p className="text-xs text-gray-500 mt-1.5">Anda bisa memilih project yang sudah ada atau mengetik nama project baru.</p>
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kategori Dokumen <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white appearance-none focus:outline-none focus:border-[#006767] focus:ring-2 focus:ring-[#006767]/20 text-gray-800 text-sm cursor-pointer pr-10 transition-all"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deskripsi / Catatan (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Berikan ringkasan singkat atau catatan pengantar untuk para pihak approver..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#006767] focus:ring-2 focus:ring-[#006767]/20 text-gray-800 placeholder-gray-400 text-sm transition-all"
                />
              </div>

              {/* Drag-and-drop Upload Zone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unggah Berkas Dokumen <span className="text-red-500">*</span>
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf"
                  className="hidden"
                />

                {!file ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleSimulateUpload}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all bg-[#e6f7f7] ${
                      isDragging
                        ? "border-[#006767] bg-teal-100/70 scale-[0.99]"
                        : "border-[#006767]/40 hover:border-[#006767]"
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-3 text-[#006767]">
                      <span className="material-symbols-outlined text-3xl">
                        cloud_upload
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      Drag & drop file PDF di sini atau klik untuk memilih
                    </p>
                    <p className="text-xs text-gray-500">
                      Hanya format PDF (Maks. 25MB)
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-[#e6f7f7]/60 border border-[#006767]/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#006767] text-white flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined">
                          picture_as_pdf
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSimulateUpload}
                        className="p-1.5 text-gray-500 hover:text-[#006767] rounded-lg hover:bg-white transition-colors"
                        title="Ganti Berkas"
                      >
                        <span className="material-symbols-outlined text-xl">
                          sync
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                        title="Hapus Berkas"
                      >
                        <span className="material-symbols-outlined text-xl">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 1 Actions */}
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleNextStep1}
                  className="px-6 py-2.5 rounded-xl font-semibold bg-[#006767] hover:bg-[#004f4f] text-white shadow-sm flex items-center gap-2 transition-all"
                >
                  Selanjutnya
                  <span className="material-symbols-outlined text-lg">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Tentukan Alur Approval */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-[#004f4f] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006767]">
                    account_tree
                  </span>
                  Tentukan Urutan Approval
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Pilih approver dari daftar pengguna aktif. Dokumen akan diteruskan secara sekuensial.
                </p>
              </div>

              {/* Vertical Numbered List of Approvers */}
              <div className="space-y-4">
                {approvers.map((approver, index) => (
                  <div
                    key={index}
                    className="relative flex items-center gap-3 md:gap-4 p-4 rounded-xl border border-gray-200 bg-[#f7f9fc] hover:border-gray-300 transition-all"
                  >
                    {/* Number circle */}
                    <div className="w-8 h-8 rounded-full bg-[#006767] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                      {index + 1}
                    </div>

                    {/* Approver Selection */}
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        Pilih Approver
                      </label>
                      <select
                        value={approver.id}
                        onChange={(e) => handleApproverChange(index, Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-gray-200 focus:outline-none focus:border-[#006767] text-gray-800"
                      >
                        <option value="" disabled>Pilih Pegawai...</option>
                        {availableUsers.map(u => (
                          <option key={u.id} value={u.id}>{u.name} - {u.department}</option>
                        ))}
                      </select>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveApprover(index)}
                      disabled={approvers.length <= 1}
                      title="Hapus Approver"
                      className={`p-2 rounded-lg transition-colors shrink-0 ${
                        approvers.length <= 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">
                        close
                      </span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Approver Button */}
              <div>
                <button
                  type="button"
                  onClick={handleAddApprover}
                  className="w-full py-2.5 px-4 rounded-xl border border-[#006767] border-dashed text-[#006767] hover:bg-[#006767]/5 flex items-center justify-center gap-2 font-semibold text-sm transition-all"
                >
                  <span className="material-symbols-outlined text-lg">
                    person_add
                  </span>
                  + Tambah Approver
                </button>
              </div>

              {/* Step 2 Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-2.5 rounded-xl font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">
                    arrow_back
                  </span>
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={handleNextStep2}
                  className="px-6 py-2.5 rounded-xl font-semibold bg-[#006767] hover:bg-[#004f4f] text-white shadow-sm flex items-center gap-2 transition-all"
                >
                  Selanjutnya
                  <span className="material-symbols-outlined text-lg">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Konfirmasi & Kirim */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-[#004f4f] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006767]">
                    fact_check
                  </span>
                  Langkah 3: Konfirmasi & Kirim
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Harap periksa kembali informasi dokumen dan rangkaian approver sebelum mengirimkan sirkulir ke Database.
                </p>
              </div>

              {/* Document Summary Card */}
              <div className="bg-[#f7f9fc] rounded-xl p-5 border border-gray-200/80 space-y-4">
                <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006767] text-lg">
                    description
                  </span>
                  Rincian Dokumen
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 block">Judul Dokumen</span>
                      <span className="font-medium text-gray-800">
                        {judulDokumen || "Tanpa Judul"}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-gray-500 block">Nama / Kode Project</span>
                      <span className="font-medium text-gray-800">
                        {projectName || "Tidak ada"}
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <span className="text-xs text-gray-500 block">Kategori</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-[#004f4f]">
                      {kategori}
                    </span>
                  </div>

                  <div className="md:col-span-2">
                    <span className="text-xs text-gray-500 block">
                      Deskripsi / Catatan
                    </span>
                    <p className="text-gray-700 text-sm mt-0.5 bg-white p-3 rounded-lg border border-gray-100">
                      {deskripsi || "Tidak ada catatan tambahan."}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <span className="text-xs text-gray-500 block mb-1">
                      File Lampiran
                    </span>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
                      <span className="material-symbols-outlined text-red-500">
                        picture_as_pdf
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">
                          {file?.name || "Tidak ada file"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Approval Flow Mini Timeline */}
              <div className="bg-[#f7f9fc] rounded-xl p-5 border border-gray-200/80 space-y-4">
                <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006767] text-lg">
                    linear_scale
                  </span>
                  Urutan Penandatanganan ({approvers.length} Approver)
                </h3>

                <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-teal-200">
                  {approvers.map((approver, idx) => (
                    <div key={idx} className="relative flex items-start gap-3">
                      {/* Step Dot */}
                      <div className="absolute -left-6 w-6 h-6 rounded-full bg-[#006767] text-white flex items-center justify-center text-xs font-bold ring-4 ring-white shadow-sm">
                        {idx + 1}
                      </div>

                      <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 flex-1 shadow-xs">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                          <p className="font-semibold text-gray-800 text-sm">
                            {approver.name}
                          </p>
                          <span className="text-xs font-medium text-[#006767] bg-[#e6f7f7] px-2 py-0.5 rounded-md self-start md:self-auto">
                            {approver.department}
                          </span>
                        </div>
                        {approver.email && (
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">
                              mail
                            </span>
                            {approver.email}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gold Info Banner */}
              <div className="bg-[#F0B43C]/10 border border-[#F0B43C] text-amber-900 rounded-xl p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#F0B43C] text-2xl shrink-0 mt-0.5">
                  info
                </span>
                <div className="text-sm">
                  <p className="font-semibold mb-0.5">Menyimpan ke Database</p>
                  <p className="text-amber-950/90 leading-relaxed">
                    Menekan Kirim Sirkulir akan mengunggah file fisik PDF ke server, membuat data dokumen baru di database, dan mencatatkan urutan persetujuan.
                  </p>
                </div>
              </div>

              {/* Step 3 Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">
                    arrow_back
                  </span>
                  Kembali
                </button>

                <button
                  type="button"
                  onClick={handleSubmitSirkulir}
                  disabled={isSubmitting}
                  className="px-8 py-3 rounded-xl font-semibold bg-[#006767] hover:bg-[#004f4f] text-white shadow-md hover:shadow-lg flex items-center gap-2 text-base transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-xl">
                        progress_activity
                      </span>
                      Mengirimkan...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xl">
                        send
                      </span>
                      Kirim Sirkulir
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-xl transform animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-4xl">
                check_circle
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Sirkulir Berhasil Dibuat!
            </h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Dokumen telah tersimpan di Database dan file aslinya telah diamankan. Kamu bisa melihat hasilnya secara langsung di halaman *viewer*.
            </p>
            <button
              type="button"
              onClick={handleFinishAndRedirect}
              className="w-full py-3 rounded-xl font-semibold bg-[#006767] hover:bg-[#004f4f] text-white shadow-md transition-all flex items-center justify-center gap-2"
            >
              Lihat Dokumen
              <span className="material-symbols-outlined text-lg">
                visibility
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
