"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ShieldAlert, Sparkles, Code2, Lock, ExternalLink, ArrowLeft, Copy, Check, Info } from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";

interface ResultsProps {
  params: Promise<{ id: string }>;
}

export default function ResultsPage({ params }: ResultsProps) {
  const resolvedParams = use(params);
  const extensionId = resolvedParams.id;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"simple" | "detailed">("simple");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const cachedStr = localStorage.getItem(`scan_${extensionId}`);
    if (cachedStr) {
      try {
        setData(JSON.parse(cachedStr));
        setLoading(false);
      } catch (e) {}
    }

    axios.post(`${API_BASE_URL}/scan`, { extensionId })
      .then((res) => {
        if (res.data && res.data.success) {
          setData(res.data);
          localStorage.setItem(`scan_${extensionId}`, JSON.stringify(res.data));
        }
      })
      .catch((err) => {
        console.error("Backend fetch error:", err);
      })
      .finally(() => setLoading(false));
  }, [extensionId]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center font-mono">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="mt-4 text-xs uppercase font-bold text-slate-600 dark:text-slate-400">EXECUTING_ANALYSIS FOR {extensionId}...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center font-mono">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">SCAN RESULT NOT FOUND</h2>
        <p className="mt-2 text-xs text-slate-500">Could not retrieve findings for target {extensionId}.</p>
        <Link href="/analyze" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-bold text-white uppercase shadow-md">
          <ArrowLeft className="h-4 w-4" /> RETURN TO ANALYZER
        </Link>
      </div>
    );
  }

  const { name, version, report, rawData, storeMetadata, aiAnalysis } = data;
  const score = report?.score ?? rawData?.score ?? 85;

  const getScoreBadge = () => {
    if (score >= 80) return { label: "LOW RISK", color: "text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40" };
    if (score >= 60) return { label: "MODERATE RISK", color: "text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/40" };
    return { label: "HIGH / CRITICAL RISK", color: "text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-950/40" };
  };

  const badge = getScoreBadge();

  const handleCopyManifest = () => {
    navigator.clipboard.writeText(JSON.stringify(rawData?.manifest || {}, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Back Link */}
      <Link href="/analyze" className="inline-flex items-center gap-2 text-xs font-mono font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" /> ← BACK TO ANALYZER
      </Link>

      {/* Extension Header Card */}
      <div className="mt-6 tech-card rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {storeMetadata?.icon ? (
            <img src={storeMetadata.icon} alt="" className="h-16 w-16 rounded-xl object-contain bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-600 font-mono text-2xl font-extrabold text-white">
              {name?.charAt(0) || "E"}
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{name}</h1>
              <span className="rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-400 font-mono font-bold">
                v{version}
              </span>
            </div>
            <p className="mt-1 text-xs font-mono text-slate-500">ID: {extensionId}</p>
            {storeMetadata && (
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-mono text-slate-600 dark:text-slate-400 font-medium">
                <span className="rounded bg-blue-100 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 px-2 py-0.5 text-blue-700 dark:text-blue-400 font-bold">
                  {storeMetadata.category || "Chrome Extension"}
                </span>
                <span>• {storeMetadata.users || "10,000+ users"}</span>
                <span>• Rating: {storeMetadata.rating || "4.5"} ★</span>
              </div>
            )}
          </div>
        </div>

        {/* Score Ring / Badge */}
        <div className="flex items-center gap-4 self-stretch md:self-auto justify-between border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-8 font-mono">
          <div>
            <div className="text-xs uppercase text-slate-500 font-bold">Trust Score</div>
            <div className={`text-4xl font-extrabold mt-1 ${score >= 80 ? "text-emerald-600 dark:text-emerald-400" : score >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
              {score}<span className="text-sm text-slate-400">/100</span>
            </div>
            <span className={`inline-block mt-2 rounded border px-3 py-0.5 text-[10px] font-bold ${badge.color}`}>
              {badge.label}
            </span>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="mt-8 flex border-b border-slate-200 dark:border-slate-800 font-mono text-xs font-bold">
        <button
          onClick={() => setActiveTab("simple")}
          className={`w-1/2 py-3 uppercase transition-colors ${
            activeTab === "simple"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-b-0 border-slate-200 dark:border-slate-800"
          }`}
        >
          SIMPLE_OVERVIEW
        </button>
        <button
          onClick={() => setActiveTab("detailed")}
          className={`w-1/2 py-3 uppercase transition-colors ${
            activeTab === "detailed"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-b-0 border-slate-200 dark:border-slate-800"
          }`}
        >
          STATS_FOR_NERDS
        </button>
      </div>

      {/* TAB CONTENT 1: SIMPLE VIEW */}
      {activeTab === "simple" && (
        <div className="mt-6 space-y-6">
          {/* AI Summary Box */}
          {aiAnalysis && (
            <div className="tech-card rounded-xl p-6 border-l-4 border-l-purple-500">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-mono font-bold text-xs uppercase">
                <Sparkles className="h-4 w-4" />
                AI Executive Threat Context ({aiAnalysis.riskLevel || "Contextual"} Risk)
              </div>
              <p className="mt-3 text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                {aiAnalysis.summary}
              </p>
            </div>
          )}

          {/* User Recommendation */}
          <div className="tech-card rounded-xl p-6">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Security Recommendation
            </h3>
            <p className="mt-2 text-xs font-mono text-slate-700 dark:text-slate-300 font-medium">
              {report?.recommendation || "Review permissions before installing."}
            </p>
          </div>

          {/* Key Findings List */}
          <div className="tech-card rounded-xl p-6">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Permission & Security Risks
            </h3>
            <div className="mt-4 space-y-3 font-mono">
              {(rawData?.findings || []).map((finding: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3.5">
                  <span className={`mt-0.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                    finding.severity === "critical" ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800/60" :
                    finding.severity === "high" ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60" :
                    finding.severity === "medium" ? "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800/60" :
                    "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800/60"
                  }`}>
                    {finding.severity || "info"}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{finding.description}</div>
                    {finding.permission && (
                      <div className="mt-1 text-[11px] text-slate-500 font-medium">Target Permission: {finding.permission}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: STATS FOR NERDS */}
      {activeTab === "detailed" && (
        <div className="mt-6 space-y-6">
          {/* Extracted Embedded URLs */}
          <div className="tech-card rounded-xl p-6">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              Extracted Embedded External URLs ({(rawData?.embeddedUrls || []).length})
            </h3>
            <div className="mt-4 max-h-48 overflow-y-auto space-y-1 rounded-lg bg-[#0d1117] p-4 text-xs font-mono text-cyan-400 border border-slate-800">
              {(rawData?.embeddedUrls || []).length === 0 ? (
                <div className="text-slate-500">No external URLs extracted.</div>
              ) : (
                rawData.embeddedUrls.map((url: string, idx: number) => (
                  <div key={idx} className="truncate hover:text-cyan-200">{url}</div>
                ))
              )}
            </div>
          </div>

          {/* Raw Syntax Highlighted Manifest Viewer */}
          <div className="terminal-card rounded-xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
                <Code2 className="h-4 w-4 text-blue-400" />
                Raw Manifest.json Viewer
              </h3>
              <button
                onClick={handleCopyManifest}
                className="flex items-center gap-1.5 rounded border border-slate-700 bg-slate-800 px-3 py-1 text-[11px] font-mono text-slate-300 hover:text-white transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy JSON"}
              </button>
            </div>
            <pre className="mt-4 max-h-96 overflow-auto rounded bg-slate-950 p-4 text-xs font-mono text-emerald-400 border border-slate-800 leading-relaxed">
              {JSON.stringify(rawData?.manifest || {}, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
