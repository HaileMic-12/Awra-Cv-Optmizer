
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);

      document.cookie =
        "awra_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      localStorage.clear();
      sessionStorage.clear();

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
        <svg
          className="h-[19px] w-[19px]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      name: "My Documents",
      href: "/dashboard",
      icon: (
        <svg
          className="h-[19px] w-[19px]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.5 7.5A2.5 2.5 0 016 5h4l2 2h6.5A2.5 2.5 0 0121 9.5v8A2.5 2.5 0 0118.5 20h-13A2.5 2.5 0 013 17.5v-10z"
          />
        </svg>
      ),
    },
    {
      name: "Job Tracker",
      href: "/tracker",
      icon: (
        <svg
          className="h-[19px] w-[19px]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 6V4.5A1.5 1.5 0 0110.5 3h3A1.5 1.5 0 0115 4.5V6M5 6h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 11h18"
          />
        </svg>
      ),
    },
    {
      name: "My Profile",
      href: "/profile",
      icon: (
        <svg
          className="h-[19px] w-[19px]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 21a7 7 0 0114 0"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f8f9fb] text-gray-900">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-gray-200/80 bg-white/95 px-5 backdrop-blur md:hidden">
        <Link
          href="/chat"
          onClick={() => setIsMobileMenuOpen(false)}
          className="flex items-center gap-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-sm font-black text-white">
            A
          </div>

          <span className="text-[17px] font-bold tracking-tight">AWRA</span>
        </Link>

        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50"
        >
          {isMobileMenuOpen ? (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6l12 12M18 6L6 18"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </header>

      <div className="flex min-h-[calc(100dvh-68px)] md:min-h-[100dvh]">
        {/* Desktop Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-[250px] border-r border-gray-200/80
            bg-white transition-transform duration-200
            md:sticky md:top-0 md:flex md:h-[100dvh] md:translate-x-0 md:flex-col
            ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* Brand */}
          <div className="flex h-[76px] items-center border-b border-gray-100 px-6">
            <Link
              href="/chat"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-sm font-black text-white">
                A
              </div>

              <div>
                <div className="text-[17px] font-bold tracking-tight">
                  AWRA
                </div>
                <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-gray-400">
                  Career toolkit
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
              Workspace
            </p>

            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/chat" &&
                    pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      group flex items-center gap-3 rounded-lg px-3 py-2.5
                      text-[14px] font-medium transition-all
                      ${
                        isActive
                          ? "bg-gray-100 text-gray-950"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
                  >
                    <span
                      className={`
                        transition-colors
                        ${
                          isActive
                            ? "text-gray-900"
                            : "text-gray-400 group-hover:text-gray-700"
                        }
                      `}
                    >
                      {item.icon}
                    </span>

                    <span>{item.name}</span>

                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Account */}
          <div className="border-t border-gray-100 p-3">
            <div className="mb-1 flex items-center gap-3 rounded-lg px-3 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  Account
                </p>

                <p className="mt-0.5 truncate text-[13px] font-semibold text-gray-800">
                  {user?.email || "User"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <svg
                className="h-[19px] w-[19px]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17l5-5-5-5M20 12H9"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 19H6a2 2 0 01-2-2V7a2 2 0 012-2h7"
                />
              </svg>

              Log out
            </button>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] md:hidden"
          />
        )}

        {/* Main Content */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

