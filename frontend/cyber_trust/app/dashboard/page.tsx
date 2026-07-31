"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, ShieldCheck, ChevronLeft, ChevronRight, Layers, Search, Activity, Filter, RefreshCw, AlertTriangle, X } from "lucide-react";
import axios from "axios";
import ClientOnly from "../components/ClientOnly";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";
const API_BASE_URL = rawApiUrl.replace(/\/+$/, "");

interface HistoryItem {
  id: string;
  extensionId: string;
  name: string;
  version: string;
  score: number;
  riskLevel: string;
  category: string;
  icon?: string;
  scannedAt: string;
}

interface StatsData {
  totalScans: number;
  avgScore: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  categoryBreakdown: Array<{
    category: string;
    count: number;
    avgScore: number;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/dashboard/stats`);
      if (res.data && res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err: any) {
      console.error("Failed to fetch dashboard stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchHistory = async (
    targetPage: number = page,
    category: string = selectedCategory,
    query: string = searchQuery,
    pageLimit: number = limit
  ) => {
    setLoadingHistory(true);
    setNetworkError(null);
    try {
      let params = `page=${targetPage}&limit=${pageLimit}`;
      if (category && category !== "All") {
        params += `&category=${encodeURIComponent(category)}`;
      }
      if (query && query.trim()) {
        params += `&search=${encodeURIComponent(query.trim())}`;
      }

      const res = await axios.get(`${API_BASE_URL}/dashboard/history?${params}`);
      if (res.data && res.data.success) {
        setHistoryItems(res.data.items);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.total || 0);
        setPage(res.data.page || targetPage);
      }
    } catch (err: any) {
      console.error("Failed to fetch scan history:", err);
      setHistoryItems([]);
      setTotalPages(1);
      setTotalCount(0);
      const msg = err.response?.data?.detail || err.message || "Failed to connect to backend server. Verify NEXT_PUBLIC_API_URL.";
      setNetworkError(msg);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchHistory(1, "All", "", 12);
  }, []);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    fetchHistory(1, category, searchQuery, limit);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory(1, selectedCategory, searchQuery, limit);
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-500/30";
    if (score >= 60) return "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-500/30";
    return "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-500/30";
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 bg-white dark:bg-transparent" suppressHydrationWarning>
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6" suppressHydrationWarning>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3 font-mono">
            <ClientOnly fallback={<div className="h-7 w-7" />}>
              <Activity className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </ClientOnly>
            Security Analytics & Scan Dashboard
          </h1>
          <p className="mt-1 text-xs font-mono text-slate-500 uppercase tracking-wider">
            REAL-TIME DATABASE TELEMETRY, CATEGORIZED STORE CATALOGUE, AND AUDIT LOGS
          </p>
        </div>
        <Link
          href="/analyze"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-mono font-bold uppercase text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all self-start md:self-auto"
        >
          <ClientOnly fallback={<div className="h-4 w-4" />}>
            <Search className="h-4 w-4" />
          </ClientOnly>
          EXECUTE_ANALYSIS →
        </Link>
      </div>

      {/* Network Error Alert */}
      {networkError && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-300 dark:border-red-800/80 bg-red-50 dark:bg-red-950/40 p-4 font-mono text-xs text-red-600 dark:text-red-400" suppressHydrationWarning>
          <ClientOnly fallback={<div className="h-5 w-5" />}>
            <AlertTriangle className="h-5 w-5 shrink-0" />
          </ClientOnly>
          <div className="flex-1">
            <span className="font-bold">Backend Connection Error:</span> {networkError}
          </div>
          <button
            onClick={() => { fetchStats(); fetchHistory(1); }}
            suppressHydrationWarning
            className="rounded bg-red-600 px-3 py-1 text-white font-bold uppercase hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top KPI Cards (Real DB Data) */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-4 font-mono" suppressHydrationWarning>
        <div className="tech-card rounded-xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">TOTAL SCANS IN DB</span>
          {loadingStats ? (
            <div className="mt-2 h-9 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          ) : (
            <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{stats?.totalScans ?? 0}</div>
          )}
        </div>

        <div className="tech-card rounded-xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">AVG TRUST SCORE</span>
          {loadingStats ? (
            <div className="mt-2 h-9 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          ) : (
            <div className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats?.avgScore ?? 100}/100</div>
          )}
        </div>

        <div className="tech-card rounded-xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">SAFE / LOW RISK</span>
          {loadingStats ? (
            <div className="mt-2 h-9 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          ) : (
            <div className="mt-2 text-3xl font-extrabold text-blue-600 dark:text-blue-400">{stats?.riskDistribution?.low ?? 0}</div>
          )}
        </div>

        <div className="tech-card rounded-xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">HIGH THREATS</span>
          {loadingStats ? (
            <div className="mt-2 h-9 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          ) : (
            <div className="mt-2 text-3xl font-extrabold text-red-600 dark:text-red-400">
              {(stats?.riskDistribution?.high ?? 0) + (stats?.riskDistribution?.critical ?? 0)}
            </div>
          )}
        </div>
      </div>

      {/* Web Store Risk Distribution by Category (Interactive Filter) */}
      <div className="mt-8 tech-card rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" suppressHydrationWarning>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <h2 className="text-sm font-mono font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
            <ClientOnly fallback={<div className="h-4 w-4" />}>
              <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </ClientOnly>
            Categorized Extension Store Risk Distribution
          </h2>

          <div className="flex items-center gap-2 font-mono text-xs font-bold" suppressHydrationWarning>
            <span className="text-slate-500 uppercase text-[11px]">Filter Catalogue:</span>
            <button
              onClick={() => handleCategorySelect("All")}
              suppressHydrationWarning
              className={`rounded-lg px-3 py-1.5 uppercase transition-all ${selectedCategory === "All"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
            >
              ALL CATEGORIES
            </button>
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 font-mono text-xs" suppressHydrationWarning>
          {loadingStats ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-20 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/60 p-3.5" />
            ))
          ) : !stats?.categoryBreakdown || stats.categoryBreakdown.length === 0 ? (
            <div className="col-span-3 py-6 text-center text-xs font-mono text-slate-500">
              No categories recorded in database yet. Execute an extension scan above!
            </div>
          ) : (
            stats.categoryBreakdown.map((cat, idx) => {
              const isSelected = selectedCategory === cat.category;
              return (
                <div
                  key={idx}
                  onClick={() => handleCategorySelect(cat.category)}
                  className={`cursor-pointer rounded-lg border p-3.5 transition-all ${isSelected
                    ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 ring-2 ring-blue-500/20 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-slate-800/80"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-white"}`}>
                      {cat.category}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                        }`}
                    >
                      {cat.count} {cat.count === 1 ? "scan" : "scans"}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-slate-500">
                    <span>Avg Score:</span>
                    <span
                      className={`font-bold ${cat.avgScore >= 80
                        ? "text-emerald-600 dark:text-emerald-400"
                        : cat.avgScore >= 60
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400"
                        }`}
                    >
                      {cat.avgScore}/100
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Categorized Extension Catalogue & History Table */}
      <div className="mt-8 tech-card rounded-xl p-6 font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" suppressHydrationWarning>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800" suppressHydrationWarning>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <ClientOnly fallback={<div className="h-4 w-4" />}>
                <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </ClientOnly>
              {selectedCategory === "All" ? "Complete Extension Catalogue (All Database Records)" : `Catalogue: ${selectedCategory}`}
            </h2>

            {selectedCategory !== "All" && (
              <button
                onClick={() => handleCategorySelect("All")}
                suppressHydrationWarning
                className="inline-flex items-center gap-1 rounded bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Clear Category Filter ✕
              </button>
            )}
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2" suppressHydrationWarning>
            <div className="relative flex-1 sm:w-64" suppressHydrationWarning>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search extensions by title or ID..."
                suppressHydrationWarning
                className="w-full rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-1.5 pl-3 pr-8 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); fetchHistory(1, selectedCategory, "", limit); }}
                  suppressHydrationWarning
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <ClientOnly fallback={<div className="h-3.5 w-3.5" />}>
                    <X className="h-3.5 w-3.5" />
                  </ClientOnly>
                </button>
              )}
            </div>
            <button
              type="submit"
              suppressHydrationWarning
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white uppercase hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Info Counter Bar */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500" suppressHydrationWarning>
          <div>
            Showing {historyItems.length} of {totalCount} total database extensions
          </div>
          <div className="flex items-center gap-2" suppressHydrationWarning>
            <span>Per Page:</span>
            {[12, 24, 48].map((l) => (
              <button
                key={l}
                onClick={() => { setLimit(l); fetchHistory(1, selectedCategory, searchQuery, l); }}
                suppressHydrationWarning
                className={`px-1.5 py-0.5 rounded font-bold ${limit === l ? "bg-blue-600 text-white" : "hover:text-slate-900 dark:hover:text-white"}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Catalogue Table */}
        <div className="mt-4 overflow-x-auto" suppressHydrationWarning>
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300" suppressHydrationWarning>
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/80 uppercase text-slate-500 font-bold">
              <tr>
                <th className="px-4 py-3">Extension</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Trust Score</th>
                <th className="px-4 py-3">Risk Level</th>
                <th className="px-4 py-3 text-right">Security Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {loadingHistory ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx}>
                    <td colSpan={5} className="py-4 px-4">
                      <div className="h-5 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    </td>
                  </tr>
                ))
              ) : historyItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                    <p className="text-xs uppercase font-bold text-slate-600 dark:text-slate-400">
                      No matching extensions found in database
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Try clearing your search query or scan a new extension from the Analyze page.
                    </p>
                  </td>
                </tr>
              ) : (
                historyItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {item.icon ? (
                          <img
                            src={item.icon}
                            alt=""
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                            className="h-8 w-8 rounded-lg object-contain bg-slate-100 dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-800 shrink-0"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-mono text-xs font-bold text-white shrink-0">
                            {item.name?.charAt(0) || "E"}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{item.extensionId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-slate-100 dark:bg-slate-900 px-2 py-0.5 text-[11px] border border-slate-200 dark:border-slate-800 font-bold">
                        {item.category || "General"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block rounded border px-2 py-0.5 text-[11px] font-bold ${getScoreBadge(item.score)}`}>
                        {item.score}/100
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold">{item.riskLevel || "Low"}</td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/results/${item.extensionId}`}
                        className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white uppercase shadow-sm hover:bg-blue-700 transition-all"
                      >
                        VIEW REPORT →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4" suppressHydrationWarning>
            <button
              onClick={() => fetchHistory(page - 1, selectedCategory, searchQuery, limit)}
              disabled={page <= 1 || loadingHistory}
              suppressHydrationWarning
              className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ClientOnly fallback={<div className="h-4 w-4" />}>
                <ChevronLeft className="h-4 w-4" />
              </ClientOnly>
              PREVIOUS
            </button>

            <span className="text-xs text-slate-500 font-bold">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => fetchHistory(page + 1, selectedCategory, searchQuery, limit)}
              disabled={page >= totalPages || loadingHistory}
              suppressHydrationWarning
              className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              NEXT
              <ClientOnly fallback={<div className="h-4 w-4" />}>
                <ChevronRight className="h-4 w-4" />
              </ClientOnly>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
