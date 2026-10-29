"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";

type NotificationType = "teal" | "emerald" | "rose" | "amber" | "gray";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: NotificationType;
  icon: string;
  isRead: boolean;
  actionUrl: string;
}

import { getCurrentUserId } from "@/lib/auth";

export default function NotifikasiPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ambil daftar notifikasi yang sudah dibaca dari LocalStorage
    const savedReadIds = JSON.parse(localStorage.getItem("signflow_read_notifs") || "[]");

    fetch(`http://localhost:8080/api/documents/pending/${getCurrentUserId()}?t=${new Date().getTime()}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        
        const dynamicNotifs: NotificationItem[] = data.map((step: any) => {
          const notifId = `notif-${step.id}`;
          return {
            id: notifId,
            title: "Dokumen baru menunggu approval Anda",
            description: `Dokumen "${step.document.title}" (${step.document.category}) membutuhkan persetujuan dan tanda tangan digital Anda.`,
            timestamp: new Date(step.document.createdAt).toLocaleDateString("id-ID", {
              day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
            }),
            type: "teal",
            icon: "pending_actions",
            isRead: savedReadIds.includes(notifId),
            actionUrl: `/dokumen/${step.document.id}`,
          };
        });

        setNotifications(dynamicNotifs);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load notifications", err);
        setLoading(false);
      });
  }, []);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "unread") {
      return !item.isRead;
    }
    return true;
  });

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    localStorage.setItem("signflow_read_notifs", JSON.stringify(allIds));
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, isRead: true }))
    );
  };

  const handleMarkAsRead = (id: string) => {
    const savedReadIds = JSON.parse(localStorage.getItem("signflow_read_notifs") || "[]");
    if (!savedReadIds.includes(id)) {
      savedReadIds.push(id);
      localStorage.setItem("signflow_read_notifs", JSON.stringify(savedReadIds));
    }
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
  };

  const getIconStyles = (type: NotificationType) => {
    switch (type) {
      case "teal":
        return "bg-[#006767]/10 text-[#006767]";
      case "emerald":
        return "bg-emerald-50 text-emerald-600";
      case "rose":
        return "bg-rose-50 text-rose-600";
      case "amber":
        return "bg-amber-50 text-amber-600";
      case "gray":
      default:
        return "bg-gray-100 text-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <Header
        title="Notifikasi"
        breadcrumbs={[
          { label: "SignFlow", href: "/dashboard" },
          { label: "Notifikasi" },
        ]}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Section */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notifikasi</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#006767]/10 text-[#006767]">
                ({unreadCount} belum dibaca)
              </span>
            </div>

            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="self-start sm:self-auto text-sm font-medium text-[#006767] hover:text-[#004f4f] hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">done_all</span>
              Tandai semua sudah dibaca
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 ${
                filter === "all"
                  ? "bg-[#006767] text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <span>Semua</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  filter === "all"
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {notifications.length}
              </span>
            </button>

            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 ${
                filter === "unread"
                  ? "bg-[#006767] text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <span>Belum Dibaca</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  filter === "unread"
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {unreadCount}
              </span>
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                <span className="material-symbols-outlined text-3xl">notifications_off</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900">Tidak ada notifikasi</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                {filter === "unread"
                  ? "Semua notifikasi telah Anda baca."
                  : "Belum ada riwayat notifikasi pada akun Anda."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={`transition-all duration-150 rounded-xl p-4 sm:p-5 flex items-start gap-4 shadow-sm border ${
                  !item.isRead
                    ? "bg-[#f7fffe] border-gray-200 border-l-4 border-l-[#006767]"
                    : "bg-white border-gray-200"
                }`}
              >
                {/* Icon Circle */}
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${getIconStyles(
                    item.type
                  )}`}
                >
                  <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h2
                      className={`text-sm sm:text-base leading-snug ${
                        !item.isRead
                          ? "font-bold text-gray-900"
                          : "font-medium text-gray-700"
                      }`}
                    >
                      {item.title}
                    </h2>
                    {!item.isRead && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#006767] shrink-0 mt-1.5" title="Belum dibaca" />
                    )}
                  </div>

                  <p
                    className={`mt-1 text-sm leading-relaxed ${
                      !item.isRead ? "text-gray-600" : "text-gray-500"
                    }`}
                  >
                    {item.description}
                  </p>

                  <div className="mt-2.5 flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span>{item.timestamp}</span>
                  </div>
                </div>

                {/* Right Action */}
                <div className="shrink-0 self-center sm:self-start pt-1">
                  <Link
                    href={item.actionUrl}
                    onClick={() => handleMarkAsRead(item.id)}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-sm font-semibold text-[#006767] bg-[#006767]/10 hover:bg-[#006767] hover:text-white transition-colors"
                  >
                    <span>Lihat</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Section: Muat lebih banyak */}
        {filteredNotifications.length > 0 && (
          <div className="flex justify-center pt-4 pb-8">
            <button
              type="button"
              className="px-6 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg text-gray-500">expand_more</span>
              <span>Muat lebih banyak</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
