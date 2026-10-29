"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("andi.ramadhani@bankbsi.co.id");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 600);
  };

  return (
    <main className="w-full min-h-screen bg-[#f7f9fc]">
      <div className="w-full flex flex-col lg:flex-row min-h-screen">
        {/* Left Panel: BSI Brand Showcase */}
        <div className="lg:w-[48%] bg-[#006767] relative flex flex-col justify-between p-8 lg:p-12 text-white overflow-hidden shadow-xl">
          {/* Ambient Radiance */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#008282] opacity-40 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-10 -left-20 w-80 h-80 rounded-full bg-[#006a6a] opacity-30 blur-2xl pointer-events-none"></div>

          {/* Top Branding */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-white p-2 shadow-md flex items-center justify-center text-[#006767]">
                <span className="material-symbols-outlined text-[32px] text-[#006767]">
                  draw
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-2xl font-bold tracking-tight text-white">
                    SignFlow
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fcbf46] shadow-sm mb-1 inline-block"></span>
                </div>
                <p className="text-xs text-white/90 tracking-wide font-medium">
                  Sirkulir & Approval Dokumen Digital
                </p>
              </div>
            </div>

            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md">
              <span className="material-symbols-outlined text-[#fcbf46] text-[18px]">
                verified_user
              </span>
              <span className="text-[11px] font-semibold text-[#fcbf46] tracking-wider uppercase">
                Amanah • Sharia Compliant Verification
              </span>
            </div>
          </div>

          {/* Center Visual Mockup */}
          <div className="relative z-10 my-8 flex flex-col items-center">
            <div className="relative w-full max-w-md rounded-2xl overflow-hidden bg-[#008282]/40 p-4 shadow-2xl backdrop-blur-sm border border-white/10">
              <div className="flex items-center justify-between mb-3 text-white/90">
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-[#fcbf46] text-[20px]">
                    history_edu
                  </span>
                  <span className="text-sm font-semibold text-white">
                    BSI Document Clearance Engine
                  </span>
                </div>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-white font-mono">
                  v4.8.2
                </span>
              </div>
              <div className="space-y-2 bg-white/10 rounded-xl p-3 text-xs text-white/90">
                <div className="flex justify-between items-center pb-2 border-b border-white/15">
                  <span className="font-medium">Status Sirkulir Aktif</span>
                  <span className="bg-[#fcbf46] text-[#271900] px-2 py-0.5 rounded font-bold text-[10px]">
                    LIVE
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Memo IT Upgrade Q4</span>
                  <span className="text-[#7ff5f4]">Menunggu Dept Head</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>PKS Vendor Integrasi</span>
                  <span className="text-[#a7f3d0]">✅ Selesai Ditandatangani</span>
                </div>
              </div>
            </div>

            {/* Trust Pills */}
            <div className="mt-6 grid grid-cols-1 gap-2.5 w-full max-w-md">
              <div className="flex items-center space-x-3 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-[#fcbf46] shrink-0">
                  <span className="material-symbols-outlined text-[18px]">
                    electric_bolt
                  </span>
                </div>
                <span className="text-xs text-white font-medium">
                  Alur Approval Terstruktur & Cepat
                </span>
              </div>
              <div className="flex items-center space-x-3 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-[#fcbf46] shrink-0">
                  <span className="material-symbols-outlined text-[18px]">
                    lock
                  </span>
                </div>
                <span className="text-xs text-white font-medium">
                  Tanda Tangan Digital & Stamping PDF Otomatis
                </span>
              </div>
              <div className="flex items-center space-x-3 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-[#fcbf46] shrink-0">
                  <span className="material-symbols-outlined text-[18px]">
                    fact_check
                  </span>
                </div>
                <span className="text-xs text-white font-medium">
                  Audit Trail & Kepatuhan Regulasi Lengkap
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Authority */}
          <div className="relative z-10 pt-4 flex items-center justify-between text-white/80 border-t border-white/10">
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-[#fcbf46] text-[18px]">
                account_balance
              </span>
              <span className="text-xs font-medium">
                Sistem Resmi Internal Bank Syariah Indonesia
              </span>
            </div>
            <span className="text-xs text-white/60 font-mono">SECR-A4901</span>
          </div>
        </div>

        {/* Right Panel: Authentication Form */}
        <div className="lg:w-[52%] bg-white flex flex-col justify-between p-6 sm:p-10 lg:p-16 min-h-screen">
          {/* Top Utility */}
          <div className="w-full flex justify-end">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#f2f4f7] text-[#3d4949] shadow-sm">
              <span className="material-symbols-outlined text-[#006767] text-[18px]">
                shield
              </span>
              <span className="text-xs font-semibold text-[#006767]">
                Portal Internal Karyawan
              </span>
            </div>
          </div>

          {/* Main Login Form */}
          <div className="w-full max-w-md mx-auto my-auto py-8">
            <div className="space-y-2 mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e] tracking-tight">
                Selamat Datang
              </h1>
              <p className="text-sm text-[#718096]">
                Masuk ke akun SignFlow Anda untuk memproses dokumen dan verifikasi otorisasi.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#191c1e]" htmlFor="bsiEmail">
                  Email Perusahaan
                </label>
                <div className="relative rounded-xl bg-white shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <span className="material-symbols-outlined text-[20px]">
                      alternate_email
                    </span>
                  </div>
                  <input
                    className="w-full pl-11 pr-4 py-3 bg-[#f2f4f7] rounded-xl text-[#191c1e] text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006767] transition-all placeholder:text-gray-400"
                    id="bsiEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Gunakan akun email resmi domain @bankbsi.co.id
                </p>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#191c1e]" htmlFor="bsiPassword">
                  Password
                </label>
                <div className="relative rounded-xl bg-white shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <span className="material-symbols-outlined text-[20px]">
                      key
                    </span>
                  </div>
                  <input
                    className="w-full pl-11 pr-11 py-3 bg-[#f2f4f7] rounded-xl text-[#191c1e] text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006767] transition-all placeholder:text-gray-400"
                    id="bsiPassword"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    aria-label="Toggle password visibility"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#006767] transition-colors focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                  <input
                    className="w-4 h-4 rounded text-[#006767] focus:ring-0 accent-[#006767] cursor-pointer"
                    id="rememberDevice"
                    type="checkbox"
                    defaultChecked
                  />
                  <span className="text-xs text-[#718096]">Ingat saya di perangkat ini</span>
                </label>
                <button
                  className="text-xs text-[#006767] hover:underline font-semibold focus:outline-none"
                  type="button"
                >
                  Lupa Password?
                </button>
              </div>

              {/* Login Button */}
              <div className="pt-2">
                <button
                  className="w-full py-3.5 px-6 rounded-xl bg-[#006767] text-white text-sm font-bold shadow-md hover:bg-[#004f4f] transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer focus:outline-none disabled:opacity-50"
                  type="submit"
                  disabled={isLoading}
                >
                  <span>{isLoading ? "Memproses..." : "Masuk ke Dashboard"}</span>
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_forward
                  </span>
                </button>
              </div>
            </form>

            {/* Help Box */}
            <div className="mt-8 p-4 rounded-xl bg-[#f2f4f7] flex items-start space-x-3.5 shadow-sm border border-gray-100">
              <span className="material-symbols-outlined text-[#7c5800] text-[22px] shrink-0 mt-0.5">
                headset_mic
              </span>
              <div className="space-y-0.5">
                <p className="text-[11px] text-[#7c5800] font-bold uppercase tracking-wider">
                  Layanan Bantuan Akun
                </p>
                <p className="text-xs text-[#718096] leading-relaxed">
                  Kendala akses akun? Hubungi <span className="font-semibold text-gray-800">IT Service Desk ext. 4400</span> atau hubungi Administrator Departemen Anda.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full pt-6 flex flex-col sm:flex-row items-center justify-between text-gray-400 border-t border-gray-100">
            <span className="text-xs">
              © 2026 SignFlow — Internal Use Only
            </span>
            <div className="flex items-center space-x-4 mt-2 sm:mt-0 text-[11px] font-mono text-gray-400">
              <span>TLS 1.3 ENCRYPTED</span>
              <span>•</span>
              <span>BSI SOC PROTECTED</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
