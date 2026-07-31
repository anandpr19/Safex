"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Sun, Moon, Github } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import ClientOnly from "./ClientOnly";

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const navLinks = [
    { name: "HOME", href: "/" },
    { name: "ANALYZE", href: "/analyze" },
    { name: "DASHBOARD", href: "/dashboard" },
    { name: "CHECKLIST", href: "/checklist" },
    { name: "ABOUT", href: "/about" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1117] transition-colors" suppressHydrationWarning>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5" suppressHydrationWarning>
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform" suppressHydrationWarning>
            <ClientOnly fallback={<div className="h-5 w-5" />}>
              <ShieldCheck className="h-5 w-5" />
            </ClientOnly>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
            Safex
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6 text-xs font-semibold font-mono tracking-wider">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors py-1 ${isActive
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-3" suppressHydrationWarning>
          <a
            href="https://github.com/anandpr19/Cyber-Trust"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            title="GitHub Repository"
            suppressHydrationWarning
          >
            <ClientOnly fallback={<div className="h-5 w-5" />}>
              <Github className="h-5 w-5" />
            </ClientOnly>
          </a>

          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            suppressHydrationWarning
          >
            <ClientOnly fallback={<div className="h-4 w-4" />}>
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </ClientOnly>
          </button>
        </div>
      </div>
    </nav>
  );
}
