"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Lock, Code2, BarChart3, Check, AlertTriangle, XCircle } from "lucide-react";
import axios from "axios";
import ClientOnly from "./components/ClientOnly";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";
const API_BASE_URL = rawApiUrl.replace(/\/+$/, "");

export default function HomePage() {
  const [stats, setStats] = useState<{ totalScans: number; avgScore: number; categoriesCount: number } | null>(null);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/dashboard/stats`)
      .then((res) => {
        if (res.data && res.data.stats) {
          setStats({
            totalScans: res.data.stats.totalScans || 0,
            avgScore: res.data.stats.avgScore || 100,
            categoriesCount: (res.data.stats.categoryBreakdown || []).length || 0,
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load homepage stats:", err);
      });
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 bg-white dark:bg-transparent" suppressHydrationWarning>
      {/* HERO SECTION - MATCHING SCREENSHOT #1 */}
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        {/* Left Column: Marketing Copy */}
        <div className="lg:col-span-7">
          {/* Version Tag */}
          <div className="inline-flex items-center gap-2 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1 text-xs font-mono text-slate-800 dark:text-slate-300 font-bold">
            <span># SECURITY ANALYZER V1.0</span>
          </div>

          {/* Main Headline */}
          <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-7xl leading-none">
            Know Before <br />
            <span className="text-blue-600 dark:text-blue-500">You Install</span>
          </h1>

          {/* Technical Subtitle */}
          <p className="mt-6 font-mono text-xs sm:text-sm leading-relaxed tracking-wide text-slate-600 dark:text-slate-300 uppercase max-w-2xl font-medium">
            STATIC SECURITY ANALYSIS FOR CHROME EXTENSIONS. UPLOAD A PAYLOAD OR INPUT A WEB STORE URL TO SCAN PERMISSIONS, DETECT VULNERABILITIES, AND RETRIEVE A TRUST SCORE - POWERED BY AI.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-4 font-mono text-xs font-bold tracking-wider">
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 text-white shadow-md hover:bg-blue-700 transition-all"
            >
              EXECUTE_ANALYSIS →
            </Link>

            <Link
              href="/checklist"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3.5 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              VIEW_DOCUMENTATION ↓
            </Link>
          </div>
        </div>

        {/* Right Column: Terminal Mockup Card (Screenshot #1) */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-800 bg-[#0d1117] p-6 shadow-2xl font-mono text-xs text-slate-300 leading-relaxed" suppressHydrationWarning>
            {/* Terminal Window Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-green-500/80 inline-block" />
              </div>
              <span className="text-slate-500 text-[11px]">safex scan</span>
            </div>

            {/* Simulated Scan Tree Output */}
            <div className="space-y-2 text-slate-300" suppressHydrationWarning>
              <div className="text-slate-500">┌ manifest.json</div>
              <div className="flex items-center gap-2 pl-4">
                <ClientOnly fallback={<div className="h-3.5 w-3.5" />}>
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                </ClientOnly>
                <span className="text-slate-200">Manifest v3</span>
              </div>

              <div className="flex items-center gap-2 pl-4 text-amber-400">
                <ClientOnly fallback={<div className="h-3.5 w-3.5" />}>
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                </ClientOnly>
                <span>Permission: cookies <span className="font-bold text-amber-400 uppercase">HIGH</span></span>
              </div>

              <div className="flex items-center gap-2 pl-4 text-amber-400">
                <ClientOnly fallback={<div className="h-3.5 w-3.5" />}>
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                </ClientOnly>
                <span>Permission: webRequest <span className="font-bold text-amber-400 uppercase">HIGH</span></span>
              </div>

              <div className="flex items-center gap-2 pl-4 text-red-400">
                <ClientOnly fallback={<div className="h-3.5 w-3.5" />}>
                  <XCircle className="h-3.5 w-3.5 shrink-0" />
                </ClientOnly>
                <span>Permission: &lt;all_urls&gt; <span className="font-bold text-red-400 uppercase">CRITICAL</span></span>
              </div>

              <div className="flex items-center gap-2 pl-4 text-red-400">
                <ClientOnly fallback={<div className="h-3.5 w-3.5" />}>
                  <XCircle className="h-3.5 w-3.5 shrink-0" />
                </ClientOnly>
                <span>eval() detected in bg.js <span className="font-bold text-red-400 uppercase">CRITICAL</span></span>
              </div>
            </div>

            {/* Score Output Banner */}
            <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
              <div>
                <span className="text-slate-400">Trust Score: </span>
                <span className="text-white font-bold text-sm">31/100</span>
              </div>
              <span className="rounded bg-red-950/90 border border-red-800/80 px-2.5 py-1 text-[11px] font-bold text-red-400 uppercase">
                🔴 HIGH RISK
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* STAT COUNTERS BAR (DYNAMIC LIVE METRICS) */}
      <div className="mt-20 border-y border-slate-200 dark:border-slate-800 py-10 bg-white dark:bg-transparent">
        <div className="grid grid-cols-2 gap-8 text-center sm:grid-cols-4 font-mono">
          <div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats ? `${stats.totalScans}` : "6+"}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">EXTENSIONS SCANNED</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats ? `${stats.categoriesCount}` : "4"}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">CATEGORIES AUDITED</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats ? `${stats.avgScore}/100` : "84/100"}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">AVG TRUST SCORE</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">23</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">SECURITY CHECKS</div>
          </div>
        </div>
      </div>

      {/* CAPABILITIES SECTION */}
      <div className="mt-20">
        <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">CAPABILITIES</h2>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="tech-card rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <ClientOnly fallback={<div className="h-5 w-5" />}>
              <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </ClientOnly>
            <h3 className="mt-4 text-xs font-mono font-bold uppercase text-slate-900 dark:text-white">INSTANT ANALYSIS</h3>
            <p className="mt-2 text-xs font-mono text-slate-500 dark:text-slate-400 uppercase leading-relaxed font-medium">
              RESULTS IN UNDER 5 SECONDS
            </p>
          </div>

          <div className="tech-card rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <ClientOnly fallback={<div className="h-5 w-5" />}>
              <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </ClientOnly>
            <h3 className="mt-4 text-xs font-mono font-bold uppercase text-slate-900 dark:text-white">PERMISSION AUDIT</h3>
            <p className="mt-2 text-xs font-mono text-slate-500 dark:text-slate-400 uppercase leading-relaxed font-medium">
              EVERY PERMISSION EXPLAINED
            </p>
          </div>

          <div className="tech-card rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <ClientOnly fallback={<div className="h-5 w-5" />}>
              <Code2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </ClientOnly>
            <h3 className="mt-4 text-xs font-mono font-bold uppercase text-slate-900 dark:text-white">CODE SCANNING</h3>
            <p className="mt-2 text-xs font-mono text-slate-500 dark:text-slate-400 uppercase leading-relaxed font-medium">
              DETECT EVAL(), OBFUSCATION, RISKY PATTERNS
            </p>
          </div>

          <div className="tech-card rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <ClientOnly fallback={<div className="h-5 w-5" />}>
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </ClientOnly>
            <h3 className="mt-4 text-xs font-mono font-bold uppercase text-slate-900 dark:text-white">TRUST SCORE</h3>
            <p className="mt-2 text-xs font-mono text-slate-500 dark:text-slate-400 uppercase leading-relaxed font-medium">
              0-100 QUANTIFIED RISK RATING
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
