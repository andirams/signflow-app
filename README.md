# 🖋️ SignFlow — BSI Internal Document Approval & E-Signature System

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.1-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-14.x-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC.svg)](https://tailwindcss.com/)

**SignFlow** adalah aplikasi sirkulir dokumen dan tanda tangan digital internal yang dirancang khusus untuk memenuhi alur kerja (*approval workflow*) birokrasi di lingkungan perbankan (**Bank Syariah Indonesia**). Sistem ini mengakomodasi persetujuan berjenjang multi-pejabat, pembubuhan paraf/tanda tangan ganda, pelacakan dokumen berbasis proyek, serta integrasi kecerdasan buatan (*On-Premise AI*) yang aman dan patuh terhadap regulasi kerahasiaan data perbankan.

---

## 🎨 Palet Identitas Bank Syariah Indonesia (BSI)
- **Teal Utama (Primary):** `#006767`
- **Kuning Emas (Accent):** `#fcbf46`
- **Dark Teal (Hover/Active):** `#004f4f`

---

## ✨ Fitur-Fitur Utama

### 1. Multi-Stage Document Circulation (Sirkulir Berjenjang)
- Inisiasi sirkulir dokumen dengan alur approval bertingkat (misal: *Inisiator ➔ Reviewer / SME ➔ Manager ➔ Department Head / VP*).
- Tagging & kategori dokumen IT baku: `CR`, `FSD`, `TSD`, `FKK`, `MEMO`, `BA`, `TMP`, `SME Review`, `Strategi Implementasi`, `Form Request`, `Form License`, `Form Open Koneksi`, dan opsi custom (*Lainnya...*).
- Tagging nama proyek / kode aplikasi (contoh: *Core E-Mas*, *BSI Mobile*).

### 2. Advanced Multi-Signature & Mode Paraf (Interactive Canvas)
- **Multiple Stamping:** Kemampuan membubuhkan banyak paraf dan tanda tangan sekaligus di lembar halaman yang berbeda sebelum difinalisasi.
- **Mode Paraf:** Penyesuaian ukuran stempel hingga skala mikro (hingga 20px) khusus inisial/paraf di samping tanda tangan atasan.
- **Unlock to Edit:** Elemen stempel yang telah dikunci dapat diklik kembali untuk diubah posisi/ukurannya secara fleksibel, dilengkapi tombol hapus cepat *(X)*.

### 3. Tanda Tangan Cepat (Quick Sign)
- Fasilitas stempel mandiri instan untuk dokumen ad-hoc tanpa melalui siklus sirkulir berjenjang.

### 4. Pelacakan & Filter Proyek (Document Tracking)
- Dashboard pemantauan status real-time (*Pending*, *Approved*, *Rejected*).
- Filter dokumen berdasarkan proyek/aplikasi dan kategori untuk kemudahan pencarian arsip.

### 5. Audit Trail & Riwayat Lengkap
- Pencatatan log aktivitas setiap penandatanganan, penolakan dokumen, beserta alasan penolakan dan stempel waktu.

### 6. AI Assistant Ready (On-Premise LLM Architecture)
- Dirancang untuk terhubung dengan server AI On-Premise (**Qwen 9B**) melalui REST API:
  - **Executive Summarization:** Ringkasan intisari dokumen teknis tebal (FSD/TSD) dalam 3-4 poin eksekutif.
  - **Key Point Extraction:** Ekstraksi otomatis dampak sistem, estimasi *downtime*, mitigasi risiko, dan rollback plan.
  - **Chat with Document:** Fitur interaktif tanya jawab berbasis isi dokumen PDF.
  - **Data Privacy Compliance:** Pemrosesan dokumen sepenuhnya berada di intranet bank (bebas dari risiko kebocoran data eksternal).

---

## 🛠️ Arsitektur & Teknologi

```text
signflow-app/
├── signflow-be/          # REST API Backend (Spring Boot 4 / Java 17)
│   ├── src/main/java/    # Controller, Service, Entity, DTO (PDFBox, Data JPA)
│   └── pom.xml           # Maven Dependencies (PDFBox, PostgreSQL, Jackson, Lombok)
└── signflow-fe/          # Frontend Web Application (Next.js 14 / TypeScript)
    ├── src/app/          # App Router (Dashboard, Buat Sirkulir, Dokumen, Tracking)
    └── tailwind.config.js# BSI Color Scheme & Styling
```

* **Backend:** Java 17, Spring Boot 4.x, Spring Data JPA, Apache PDFBox (untuk parsing & koordinat stempel PDF), Jackson Databind, PostgreSQL.
* **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, React PDF Viewer, Lucide / Material Symbols Icons.
* **Database:** PostgreSQL.

---

## 🚀 Panduan Menjalankan Aplikasi

### Prasyarat:
- **Java 17 JDK**
- **Node.js (v18+)** dan **npm**
- **PostgreSQL** running di local (`localhost:5432`)
  - Database: `signflow_db`
  - User: `signflow_user`
  - Password: `signflow_password`

### 1. Menjalankan Backend (Spring Boot)
```bash
cd signflow-be
./mvnw clean spring-boot:run
```
Backend akan aktif di `http://localhost:8080`.

### 2. Menjalankan Frontend (Next.js)
```bash
cd signflow-fe
npm install
npm run dev
```
Frontend akan aktif di `http://localhost:3000`.
