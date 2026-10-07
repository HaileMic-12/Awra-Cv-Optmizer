"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      // 1. Sign out of Firebase Auth
      await signOut(auth);
      
      // 2. Delete the Next.js auth cookie
      document.cookie = "awra_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      
      // 3. 🚨 FIX: Wipe the browser memory so no CVs or uploads leak to the next user
      localStorage.clear();
      sessionStorage.clear();
      
      // 4. Force a hard reload to the login page
      window.location.href = "/login";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const navItems = [
    { 
      name: "CV Optimizer", 
      href: "/chat", 
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ) 
    },
    { 
      name: "My Documents", 
      href: "/dashboard", 
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ) 
    },
    { 
      name: "Job Tracker", 
      href: "/tracker", 
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ) 
    },
    { 
      name: "My Profile", 
      href: "/profile", 
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ) 
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4">
        <span className="text-2xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700">
          AWRA
        </span>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-gray-100 rounded-lg text-gray-600"
        >
          {isMobileMenuOpen ? "✖" : "☰"}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div className={`
        ${isMobileMenuOpen ? "block" : "hidden"} 
        md:flex flex-col w-full md:w-64 bg-white border-r border-gray-200 h-auto md:h-[100dvh] sticky top-0 shrink-0
      `}>
        <div className="hidden md:flex items-center h-20 px-8 border-b border-gray-100 shrink-0">
          <span className="text-3xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700">
            AWRA
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  isActive 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div className={`${isActive ? "text-blue-600" : "text-gray-400"}`}>
                  {item.icon}
                </div>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 pb-10 border-t border-gray-100 shrink-0">
          <div className="px-4 py-3 mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Logged in as</p>
            <p className="text-sm font-bold text-gray-900 truncate">
              {user?.email || "User"}
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-hidden">
        {children}
      </div>

    </div>
  );
}