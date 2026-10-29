"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { name: "Buat Sirkulir", href: "/buat-sirkulir", icon: "add_circle" },
    { name: "Tracking Dokumen", href: "/tracking", icon: "history" },
    { name: "Tanda Tangan Cepat", href: "/tanda-tangan-cepat", icon: "draw" },
    { name: "Kelola User (Admin)", href: "/admin/users", icon: "manage_accounts" },
  ];

  return (
    <aside className="w-64 bg-[#006767] text-white flex flex-col h-screen sticky top-0 shrink-0 shadow-lg">
      {/* Top Branding (Fixed) */}
      <div className="shrink-0">
        <div className="p-6 border-b border-white/10 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#006767] shadow-md">
            <span className="material-symbols-outlined text-[26px] text-[#006767]">
              draw
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className="text-xl font-bold tracking-tight text-white">SignFlow</span>
              <span className="w-2 h-2 rounded-full bg-[#fcbf46] inline-block mb-1"></span>
            </div>
            <span className="text-[10px] text-white/70 tracking-wider uppercase font-semibold">
              Bank Syariah Indonesia
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Menu (Flexible space) */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2">
          Menu Utama
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-white text-[#006767] shadow-sm font-bold"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    isActive ? "text-[#006767]" : "text-white/70"
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Network Alert Bottom (Fixed) */}
      <div className="shrink-0 p-4 border-t border-white/10">
        <div className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl bg-black/20 text-xs font-medium text-white/90 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
          <span className="tracking-wide">Sirkulir System Online</span>
        </div>
      </div>
    </aside>
  );
}
