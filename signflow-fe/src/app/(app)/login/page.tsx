"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [users, setUsers] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("http://localhost:8080/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error("Error fetching users:", err));
  }, []);

  const handleLogin = (user: any) => {
    localStorage.setItem("signflow_user_id", String(user.id));
    localStorage.removeItem("signflow_read_notifs");
    
    // Catat ke Audit Log
    fetch("http://localhost:8080/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "LOGIN",
        description: `User ${user.name} berhasil login ke dalam sistem SignFlow.`,
        username: user.name
      })
    }).catch(e => console.error(e));

    router.push("/dashboard");
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f9fc] p-6">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Side: Branding */}
        <div className="md:w-5/12 bg-gradient-to-br from-[#006767] to-[#008282] p-10 flex flex-col justify-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <span className="material-symbols-outlined text-[120px]">signature</span>
          </div>
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#006767] text-2xl font-bold">edit_document</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">SignFlow</h1>
            </div>
            <h2 className="text-3xl font-bold mb-4">Selamat Datang</h2>
            <p className="text-[#e6f7f7] leading-relaxed">
              Pilih profil pengguna di bawah ini untuk mensimulasikan login dan menggunakan sistem sirkulir dokumen.
            </p>
          </div>
        </div>

        {/* Right Side: User Selection */}
        <div className="md:w-7/12 p-10">
          <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">
            Simulasi Login Akun
          </h3>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {users.length === 0 ? (
              <div className="text-center py-10 text-gray-500">Memuat profil pengguna...</div>
            ) : (
              users.map((user) => {
                const names = user.name.split(" ");
                const initials = names.length > 1 ? names[0][0] + names[1][0] : names[0][0];

                return (
                  <button
                    key={user.id}
                    onClick={() => handleLogin(user)}
                    className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-[#006767] hover:shadow-md transition-all group flex items-center space-x-4 bg-white"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#006767]/10 text-[#006767] flex items-center justify-center font-bold text-lg group-hover:bg-[#006767] group-hover:text-white transition-colors">
                      {initials.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-gray-900 truncate group-hover:text-[#006767] transition-colors">
                        {user.name}
                      </h4>
                      <p className="text-sm text-gray-500 truncate">{user.department}</p>
                    </div>
                    <div className="shrink-0 text-gray-300 group-hover:text-[#006767] transition-colors">
                      <span className="material-symbols-outlined">login</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
