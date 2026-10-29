"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";

interface AuditLog {
  id: number;
  action: string;
  description: string;
  username: string;
  timestamp: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLogs = () => {
    fetch("http://localhost:8080/api/logs")
      .then((res) => res.json())
      .then((data) => setLogs(data))
      .catch((err) => console.error("Error fetching logs:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
    // Auto-refresh every 10 seconds for real-time feel
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = logs.filter((log) => {
    const query = search.toLowerCase();
    return (
      log.action?.toLowerCase().includes(query) ||
      log.description?.toLowerCase().includes(query) ||
      log.username?.toLowerCase().includes(query)
    );
  });

  const getActionBadge = (action: string) => {
    const act = action?.toUpperCase() || "";
    if (act.includes("LOGIN")) return "bg-blue-100 text-blue-700";
    if (act.includes("SIGN") || act.includes("APPROVE") || act.includes("DISETUJUI")) return "bg-emerald-100 text-emerald-700";
    if (act.includes("REJECT") || act.includes("DITOLAK")) return "bg-rose-100 text-rose-700";
    if (act.includes("CREATE") || act.includes("BUAT")) return "bg-amber-100 text-amber-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <>
      <Header
        title="Log Aktivitas Sistem"
        breadcrumbs={[
          { label: "SignFlow", href: "/dashboard" },
          { label: "Admin" },
          { label: "Log Aktivitas" },
        ]}
      />
      <main className="p-6 space-y-6 flex-1 overflow-y-auto bg-[#f7f9fc]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Cari aktivitas, user, atau deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006767] placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={fetchLogs}
            className="inline-flex items-center space-x-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            <span>Refresh</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Waktu
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Deskripsi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading && logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      Memuat log aktivitas...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-gray-400">
                      <span className="material-symbols-outlined text-4xl mb-2">
                        history_toggle_off
                      </span>
                      <p className="text-sm">Belum ada riwayat aktivitas.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-xs">
                        {new Date(log.timestamp).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {log.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${getActionBadge(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {log.description}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
