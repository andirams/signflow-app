"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUserId } from "@/lib/auth";

interface HeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export default function Header({ title, subtitle, breadcrumbs }: HeaderProps) {
  const [user, setUser] = useState<{name: string, department: string, initials: string}>({
    name: "Loading...", department: "", initials: "..."
  });
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    // 1. Fetch User
    fetch(`http://localhost:8080/api/users/${getCurrentUserId()}`)
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if(data && data.name) {
          const names = data.name.split(" ");
          const initials = names.length > 1 ? names[0][0] + names[1][0] : names[0][0];
          setUser({ name: data.name, department: data.department, initials: initials.toUpperCase() });
        } else {
          setUser({ name: "User Tidak Ditemukan", department: "Sistem", initials: "??" });
        }
      })
      .catch(err => {
        console.log("Error fetching user header:", err);
        setUser({ name: "User Tidak Ditemukan", department: "Sistem", initials: "??" });
      });

    // 2. Fetch Pending Docs for Notification Count
    fetch(`http://localhost:8080/api/documents/pending/${getCurrentUserId()}?t=${new Date().getTime()}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (!Array.isArray(data)) {
          setUnreadCount(0);
          return;
        }
        const savedReadIds = JSON.parse(localStorage.getItem("signflow_read_notifs") || "[]");
        const unreadDocs = data.filter((step: any) => !savedReadIds.includes(`notif-${step.id}`));
        setUnreadCount(unreadDocs.length);
      })
      .catch(() => setUnreadCount(0));
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Breadcrumbs & Title */}
      <div>
        {breadcrumbs && (
          <div className="flex items-center space-x-1.5 text-xs text-gray-500 mb-0.5">
            {breadcrumbs.map((bc, idx) => (
              <span key={idx} className="flex items-center space-x-1.5">
                {bc.href ? (
                  <Link href={bc.href} className="hover:text-[#006767]">
                    {bc.label}
                  </Link>
                ) : (
                  <span className="text-gray-700 font-medium">{bc.label}</span>
                )}
                {idx < breadcrumbs.length - 1 && <span>/</span>}
              </span>
            ))}
          </div>
        )}
        <h1 className="text-lg font-bold text-[#191c1e] tracking-tight">{title}</h1>
      </div>

      {/* Right: Actions & Status */}
      <div className="flex items-center space-x-4">
        <Link
          href="/notifikasi"
          className="relative w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:text-[#006767] hover:bg-gray-200 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#fcbf46] text-[#271900] text-[9px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Link>

        <div className="h-6 w-px bg-gray-200 hidden sm:block"></div> {/* Divider */}
        
        {/* User Profile */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-[#006767] text-white flex items-center justify-center font-bold text-sm shadow-sm">
            {user.initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-gray-900">
              {user.name}
            </p>
            <p className="text-[10px] text-gray-500">
              {user.department}
            </p>
          </div>
          <Link
            href="/"
            title="Keluar"
            className="ml-1 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
