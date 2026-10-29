"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";

interface User {
  id: string;
  name: string;
  initials: string;
  email: string;
  department: string;
  role: "Admin" | "Approver" | "Initiator";
  status: "Aktif" | "Nonaktif";
}

const roleBadge = (role: string) => {
  switch (role) {
    case "Admin": return "bg-teal-100 text-[#006767]";
    case "Approver": return "bg-amber-100 text-amber-800";
    default: return "bg-gray-100 text-gray-700";
  }
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", department: "IT Innovation", role: "Initiator" as const });
  const [loading, setLoading] = useState(true);

  // Fetch users from API
  const fetchUsers = () => {
    fetch("http://localhost:8080/api/users")
      .then(res => res.json())
      .then(data => {
        // Tambahkan inisial jika tidak ada dari backend
        const formatted = data.map((u: any) => {
          const names = u.name.split(" ");
          const initials = names.length > 1 ? names[0][0] + names[1][0] : names[0][0];
          return { ...u, id: String(u.id), initials: initials.toUpperCase() };
        });
        setUsers(formatted);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "Semua" || u.role === roleFilter;
    const matchStatus = statusFilter === "Semua" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) return;
    
    try {
      const res = await fetch("http://localhost:8080/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        fetchUsers();
        setNewUser({ name: "", email: "", department: "IT Innovation", role: "Initiator" });
        setShowModal(false);
      }
    } catch (error) {
      console.error("Gagal menambahkan user", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Yakin ingin menghapus user ini?")) {
      try {
        const res = await fetch(`http://localhost:8080/api/users/${id}`, { method: "DELETE" });
        if (res.ok) {
          fetchUsers();
        }
      } catch (error) {
        console.error("Gagal menghapus user", error);
      }
    }
  };

  const roles = ["Semua", "Admin", "Approver", "Initiator"];
  const statuses = ["Semua", "Aktif", "Nonaktif"];
  const departments = ["IT Innovation", "IT Infrastructure", "IT Architecture", "IT Operations", "Digital Banking", "Finance", "Compliance"];

  return (
    <>
      <Header title="Kelola User" breadcrumbs={[{ label: "SignFlow", href: "/dashboard" }, { label: "Admin" }, { label: "Kelola User" }]} />
      <main className="p-6 space-y-6 flex-1 overflow-y-auto">
        {/* Top: Search & Add */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006767] placeholder:text-gray-400"
            />
          </div>
          <button onClick={() => setShowModal(true)} className="inline-flex items-center space-x-2 bg-[#006767] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-[#004f4f] transition-colors shrink-0">
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span>+ Tambah User</span>
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Role:</span>
            {roles.map((r) => (
              <button key={r} onClick={() => setRoleFilter(r)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${roleFilter === r ? "bg-[#006767] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
                {r}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Status:</span>
            {statuses.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-[#006767] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Departemen</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((user, idx) => (
                  <tr key={user.id} className={`hover:bg-gray-50/80 transition-colors ${idx % 2 === 1 ? "bg-gray-50/40" : ""}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-[#006767] text-white flex items-center justify-center text-xs font-bold shrink-0">{user.initials}</div>
                        <span className="font-semibold text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-gray-600">{user.department}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${roleBadge(user.role)}`}>{user.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${user.status === "Aktif" ? "bg-emerald-500" : "bg-gray-400"}`}></span>
                        <span className={`text-xs font-medium ${user.status === "Aktif" ? "text-emerald-700" : "text-gray-500"}`}>{user.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="p-1.5 rounded-lg text-gray-400 hover:text-[#006767] hover:bg-gray-100 transition-colors" title="Edit">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Hapus">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
              <p className="text-sm">Tidak ada user ditemukan.</p>
            </div>
          )}
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Menampilkan {filtered.length} dari {users.length} user</span>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-medium">Sebelumnya</button>
              <span className="px-3 py-1.5 rounded-lg bg-[#006767] text-white font-bold">1</span>
              <button className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-medium">Selanjutnya</button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Tambah User Baru */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Tambah User Baru</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nama Lengkap</label>
                <input type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Masukkan nama lengkap" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006767]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
                <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="nama@bankbsi.co.id" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006767]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Departemen</label>
                <select value={newUser.department} onChange={(e) => setNewUser({ ...newUser, department: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#006767]">
                  {departments.map((d) => (<option key={d} value={d}>{d}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Role</label>
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as "Admin" | "Approver" | "Initiator" })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#006767]">
                  <option value="Initiator">Initiator</option>
                  <option value="Approver">Approver</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Batal</button>
              <button onClick={handleAddUser} className="px-5 py-2.5 rounded-xl bg-[#006767] text-white text-sm font-bold shadow-sm hover:bg-[#004f4f] transition-colors">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
