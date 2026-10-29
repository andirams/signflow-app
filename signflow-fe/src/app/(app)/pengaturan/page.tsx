"use client";

import { useState, useRef, useEffect } from "react";
import Header from "@/components/Header";
import SignatureCanvas from "react-signature-canvas";
import { getCurrentUserId } from "@/lib/auth";

export default function PengaturanProfilPage() {
  const [user, setUser] = useState<any>(null);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const sigCanvas = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const id = getCurrentUserId();
        const res = await fetch(`http://localhost:8080/api/users/${id}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          
          // Load signature from localStorage
          const sig = localStorage.getItem(`signflow_saved_signature_${id}`);
          if (sig) setSavedSignature(sig);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveSignature = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("Harap gambar tanda tangan terlebih dahulu.");
      return;
    }
    const dataURL = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
    localStorage.setItem(`signflow_saved_signature_${user?.id}`, dataURL);
    setSavedSignature(dataURL);
    
    // Audit Log
    fetch("http://localhost:8080/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPDATE_PROFILE",
        description: `User ${user?.name} memperbarui Tanda Tangan Default mereka.`,
        username: user?.name
      })
    }).catch(e => console.error(e));

    alert("Tanda Tangan berhasil disimpan! Sekarang Anda bisa menggunakannya secara otomatis saat menyetujui dokumen.");
  };

  const clearCanvas = () => {
    sigCanvas.current?.clear();
  };

  const deleteSignature = () => {
    if (confirm("Apakah Anda yakin ingin menghapus tanda tangan default ini?")) {
      localStorage.removeItem(`signflow_saved_signature_${user?.id}`);
      setSavedSignature(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] flex flex-col">
      <Header
        title="Pengaturan Profil"
        breadcrumbs={[
          { label: "SignFlow", href: "/dashboard" },
          { label: "Pengaturan Profil" },
        ]}
      />
      
      <main className="flex-1 p-6 md:p-8 max-w-4xl w-full mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Pengaturan Akun & Tanda Tangan</h2>
        
        {loading ? (
          <div className="text-gray-500">Memuat profil...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kartu Profil */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-semibold text-lg text-gray-900 border-b border-gray-100 pb-3">
                Informasi Pengguna
              </h3>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-[#006767] text-white flex items-center justify-center text-xl font-bold">
                  {user?.name?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">{user?.name}</h4>
                  <p className="text-sm text-gray-500">{user?.role}</p>
                </div>
              </div>
              
              <div className="space-y-3 pt-2 text-sm">
                <div>
                  <span className="block text-gray-500 text-xs font-semibold mb-1">Email</span>
                  <p className="font-medium text-gray-800">{user?.email}</p>
                </div>
                <div>
                  <span className="block text-gray-500 text-xs font-semibold mb-1">Departemen</span>
                  <p className="font-medium text-gray-800">{user?.department}</p>
                </div>
                <div>
                  <span className="block text-gray-500 text-xs font-semibold mb-1">Status Akun</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700">
                    {user?.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Kartu Tanda Tangan Default */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-semibold text-lg text-gray-900 border-b border-gray-100 pb-3 flex justify-between items-center">
                <span>Tanda Tangan Default</span>
                {savedSignature && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Tersimpan</span>
                )}
              </h3>
              
              <p className="text-xs text-gray-500">
                Gambar dan simpan tanda tangan Anda di sini agar tidak perlu menggambar ulang setiap kali menyetujui dokumen.
              </p>

              {savedSignature ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-[#006767]/30 rounded-xl p-4 bg-[#f7fffe] flex items-center justify-center">
                    <img src={savedSignature} alt="Tanda Tangan Tersimpan" className="max-h-32 object-contain" />
                  </div>
                  <button
                    onClick={deleteSignature}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 font-semibold hover:bg-rose-50 transition-colors text-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    <span>Hapus & Ganti Tanda Tangan</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border border-gray-300 rounded-xl overflow-hidden bg-white relative">
                    <SignatureCanvas
                      ref={sigCanvas}
                      penColor="black"
                      canvasProps={{
                        className: "w-full h-40 cursor-crosshair",
                      }}
                    />
                    <button
                      onClick={clearCanvas}
                      className="absolute bottom-2 right-2 px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold hover:bg-gray-200"
                    >
                      HAPUS ULANG
                    </button>
                  </div>
                  <button
                    onClick={handleSaveSignature}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#006767] text-white font-semibold hover:bg-[#004f4f] transition-colors text-sm shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>Simpan Tanda Tangan</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
