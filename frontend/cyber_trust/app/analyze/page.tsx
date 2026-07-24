"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Upload, ShieldAlert, Info } from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";

const EXAMPLE_TARGETS = [
  {
    name: "Google Translate",
    id: "aapbdbdomjkkjkaonfhkkikfgjllcleb",
    url: "https://chromewebstore.google.com/detail/google-translate/aapbdbdomjkkjkaonfhkkikfgjllcleb",
  },
  {
    name: "React DevTools",
    id: "fmkadmapgofadopljbjfkapdkoienihi",
    url: "https://chromewebstore.google.com/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi",
  },
  {
    name: "uBlock Origin",
    id: "cjpalhdlnbpafiamejdnhcphjbkeiagm",
    url: "https://chromewebstore.google.com/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm",
  },
];

export default function AnalyzePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"url" | "upload">("url");
  const [inputUrl, setInputUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheItems, setCacheItems] = useState<any[]>([]);

  useEffect(() => {
    const cached: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("scan_")) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || "");
          cached.push(item);
        } catch (e) {}
      }
    }
    setCacheItems(cached.slice(0, 4));
  }, []);

  const handleScan = async (target?: string) => {
    const query = target || inputUrl;
    if (!query.trim()) {
      setError("Please enter a Chrome Web Store URL or 32-letter Extension ID.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(`${API_BASE_URL}/scan`, { url: query });
      if (res.data && res.data.success) {
        localStorage.setItem(`scan_${res.data.extensionId}`, JSON.stringify(res.data));
        router.push(`/results/${res.data.extensionId}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to execute analysis. Verify the Extension ID or URL.";
      setError(msg);
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data && res.data.success) {
        localStorage.setItem(`scan_${res.data.extensionId}`, JSON.stringify(res.data));
        router.push(`/results/${res.data.extensionId}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || "File upload analysis failed.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 bg-white dark:bg-transparent">
      {/* HEADER SECTION (MATCHING SCREENSHOT #2) */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
          Analyze_Extension
        </h1>
        <p className="mt-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
          INPUT WEB STORE URL OR UPLOAD .CRX
        </p>
      </div>

      {/* INPUT TABS & CONTAINER */}
      <div className="mt-8">
        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 font-mono text-xs font-bold">
          <button
            onClick={() => setActiveTab("url")}
            className={`w-1/2 py-3 uppercase tracking-wider transition-colors ${
              activeTab === "url"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-b-0 border-slate-200 dark:border-slate-800"
            }`}
          >
            URL_INPUT
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`w-1/2 py-3 uppercase tracking-wider transition-colors ${
              activeTab === "upload"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-b-0 border-slate-200 dark:border-slate-800"
            }`}
          >
            CRX_UPLOAD
          </button>
        </div>

        {/* Input Form Box */}
        <div className="tech-card p-6 rounded-b-xl border-t-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {activeTab === "url" ? (
            <div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 font-mono text-xs text-slate-500">
                <span className="font-bold">&gt;</span>
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScan()}
                  placeholder="Paste Chrome Web Store URL or ID [e.g. aapbdbdomjkkjkaonfhkkikfgjllcleb]"
                  className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none font-medium"
                />
              </div>

              <button
                onClick={() => handleScan()}
                disabled={loading}
                className="mt-4 w-full rounded-lg bg-blue-600 py-3.5 text-xs font-mono font-bold uppercase text-white shadow-md hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {loading ? "EXECUTING_ANALYSIS..." : "EXECUTE_ANALYSIS"}
              </button>
            </div>
          ) : (
            <div className="text-center py-6 font-mono">
              <label className="cursor-pointer inline-flex flex-col items-center gap-3">
                <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                  CLICK TO SELECT .CRX OR .ZIP FILE
                </span>
                <span className="text-xs text-slate-500">MAXIMUM SIZE 50MB</span>
                <input type="file" accept=".crx,.zip" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 p-3 text-xs font-mono text-red-600 dark:text-red-400 font-medium">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* EXAMPLE TARGETS SECTION (MATCHING SCREENSHOT #2) */}
      <div className="mt-10 tech-card rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">EXAMPLE_TARGETS:</h3>
        <div className="mt-4 space-y-2 font-mono text-xs">
          {EXAMPLE_TARGETS.map((target, idx) => (
            <div
              key={idx}
              onClick={() => {
                setInputUrl(target.url);
                handleScan(target.url);
              }}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3 hover:border-blue-500/40 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div>
                <span className="font-bold text-slate-900 dark:text-white">[{target.name}]</span>{" "}
                <span className="text-slate-500">{target.id}</span>
              </div>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold uppercase">SCAN →</span>
            </div>
          ))}
        </div>
      </div>

      {/* LOCAL CACHE SECTION (MATCHING SCREENSHOT #2) */}
      <div className="mt-10">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">LOCAL_CACHE</h2>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cacheItems.length === 0 ? (
            <div className="col-span-2 tech-card rounded-xl p-6 text-center text-xs font-mono text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              NO LOCAL CACHED EXTENSIONS YET. EXECUTE AN ANALYSIS ABOVE TO POPULATE CACHE.
            </div>
          ) : (
            cacheItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => router.push(`/results/${item.extensionId}`)}
                className="tech-card cursor-pointer rounded-xl p-5 hover:border-blue-500/40 transition-colors bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-start justify-between font-mono">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{item.name}</h4>
                    <p className="text-xs text-slate-500">v{item.version || "1.0.0"}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-extrabold ${item.report?.score >= 80 ? "text-emerald-600 dark:text-emerald-400" : item.report?.score >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                      {item.report?.score ?? 85}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase">/100</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* OPERATION MANUAL SECTION (MATCHING SCREENSHOT #2) */}
      <div className="mt-10 tech-card rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-blue-600 dark:text-blue-400">
          <Info className="h-4 w-4" />
          OPERATION_MANUAL
        </div>
        <p className="mt-3 font-mono text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
          URL INGEST: Input Chrome Web Store URL or ID. The system autonomously retrieves the extension binary payload, inspects manifest permissions, analyzes Content Security Policies, extracts hidden external domain URLs, and quantifies risk into a 0-100 trust rating.
        </p>
      </div>
    </div>
  );
}
