"use client";

import { useState } from "react";
import { Search, Info } from "lucide-react";

interface CheckItem {
  key: string;
  category: "permission" | "code" | "csp" | "combo";
  severity: "critical" | "high" | "medium" | "low";
  penalty: number;
  title: string;
  description: string;
  recommendation: string;
}

const CHECKLIST_ITEMS: CheckItem[] = [
  // Critical
  { key: "camera", category: "permission", severity: "critical", penalty: 15, title: "Camera Access", description: "Grants extension access to physical webcam video stream.", recommendation: "Only allow for dedicated video chat/meeting extensions." },
  { key: "microphone", category: "permission", severity: "critical", penalty: 15, title: "Microphone Access", description: "Grants access to record audio from device microphone.", recommendation: "Avoid unless required for voice notes or recording tools." },
  { key: "management", category: "permission", severity: "critical", penalty: 15, title: "Extension Management", description: "Allows extension to enable, disable, or uninstall other extensions.", recommendation: "Extremely sensitive privilege; avoid in general tools." },
  { key: "debugger", category: "permission", severity: "critical", penalty: 15, title: "Browser Debugger API", description: "Attaches debugger to network traffic and browser tabs.", recommendation: "Developer-only privilege. High potential for session hijack." },

  // High
  { key: "history", category: "permission", severity: "high", penalty: 10, title: "Browsing History", description: "Reads complete history of visited URLs and page titles.", recommendation: "Privacy risk; verify if extension truly requires history access." },
  { key: "webRequestBlocking", category: "permission", severity: "high", penalty: 12, title: "Blocking Web Requests", description: "Intercepts and blocks or modifies network traffic in real-time.", recommendation: "Used by adblockers; ensure developer reputation is verified." },
  { key: "cookies", category: "permission", severity: "high", penalty: 10, title: "Cookie Storage Access", description: "Reads and modifies browser session cookies across websites.", recommendation: "High risk for session hijacking and credential theft." },
  { key: "clipboardRead", category: "permission", severity: "high", penalty: 10, title: "Clipboard Read Access", description: "Reads contents copied to user's system clipboard.", recommendation: "Can expose sensitive copied passwords or private notes." },
  { key: "webRequest", category: "permission", severity: "high", penalty: 8, title: "Network Request Monitoring", description: "Observes HTTP/HTTPS request metadata and headers.", recommendation: "Verify extension target host permissions." },
  { key: "proxy", category: "permission", severity: "high", penalty: 10, title: "Proxy Configuration", description: "Controls browser proxy settings to reroute network traffic.", recommendation: "Used by VPNs; risky if requested by general utilities." },
  { key: "webNavigation", category: "permission", severity: "high", penalty: 8, title: "Web Navigation Tracking", description: "Monitors page load lifecycles and URL changes.", recommendation: "Check host match patterns." },
  { key: "downloads", category: "permission", severity: "high", penalty: 8, title: "File Download Manager", description: "Initiates downloads and accesses download history.", recommendation: "Verify file management purpose." },
  { key: "privacy", category: "permission", severity: "high", penalty: 8, title: "Privacy Settings Manager", description: "Modifies browser privacy configurations like WebRTC.", recommendation: "Audit settings changed." },
  { key: "identity", category: "permission", severity: "high", penalty: 6, title: "OAuth Identity Access", description: "Requests OAuth tokens for signed-in Google users.", recommendation: "Ensure OAuth scopes requested are minimal." },
  { key: "bookmarks", category: "permission", severity: "high", penalty: 6, title: "Bookmark Access", description: "Reads and modifies user browser bookmarks.", recommendation: "Low privacy concern unless bookmarks contain private links." },

  // Medium
  { key: "clipboardWrite", category: "permission", severity: "medium", penalty: 6, title: "Clipboard Write Access", description: "Modifies system clipboard content.", recommendation: "Low-to-medium risk." },
  { key: "geolocation", category: "permission", severity: "medium", penalty: 8, title: "GPS Geolocation Access", description: "Accesses device physical geographic location.", recommendation: "Only allow for location-based maps/weather tools." },
  { key: "notifications", category: "permission", severity: "medium", penalty: 4, title: "Desktop Notifications", description: "Displays OS-level desktop notification popups.", recommendation: "Standard UX permission." },
  { key: "unlimitedStorage", category: "permission", severity: "medium", penalty: 4, title: "Unlimited Storage", description: "Bypasses 5MB local IndexedDB storage limits.", recommendation: "Common for offline apps or games." },
  { key: "contextMenus", category: "permission", severity: "medium", penalty: 2, title: "Right-Click Context Menu", description: "Adds custom options to right-click menus.", recommendation: "Standard UX enhancement." },

  // Low
  { key: "tabs", category: "permission", severity: "low", penalty: 5, title: "Tab Access", description: "Accesses active tab URLs, favicons, and titles.", recommendation: "Common utility permission." },
  { key: "activeTab", category: "permission", severity: "low", penalty: 2, title: "Active Tab Temporary Grant", description: "Grants access to active tab only on icon click.", recommendation: "Chrome recommended security best practice." },
  { key: "storage", category: "permission", severity: "low", penalty: 2, title: "Local Storage API", description: "Stores extension preferences locally.", recommendation: "Safe standard permission." },
];

export default function ChecklistPage() {
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = CHECKLIST_ITEMS.filter((item) => {
    const matchesFilter = filter === "all" || item.severity === filter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 bg-white dark:bg-transparent">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-3 py-1 text-xs font-mono text-slate-800 dark:text-slate-300 font-bold">
          <span># SECURITY CHECKLIST & SCORING METHODOLOGY V2.0</span>
        </div>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
          HOW SAFEX EVALUATES & SCORES EXTENSIONS
        </h1>
        <p className="mt-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
          COMPLETE SPECIFICATION OF PERMISSION RISKS, CATEGORY JUSTIFICATIONS, AND PENALTY DISCOUNT RULES
        </p>
      </div>

      {/* Category-Aware Contextual Justification Notice */}
      <div className="mt-8 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/40 p-6 font-mono">
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-xs uppercase">
          <Info className="h-4 w-4 shrink-0" />
          Category-Aware Contextual Scoring (V2.0 Engine)
        </div>
        <p className="mt-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          Standard security scanners deduct rigid points for permissions regardless of purpose. Safex utilizes <strong>Permission-to-Category Correlation</strong>:
        </p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="rounded border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/30 p-3">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">✅ Expected / Justified Permissions</span>
            <p className="mt-1">Permissions matching the extension category (e.g. <code>cookies</code> for Email tools or <code>webRequestBlocking</code> for Adblockers) receive a <strong>70% penalty waiver</strong>.</p>
          </div>
          <div className="rounded border border-amber-300 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/30 p-3">
            <span className="font-bold text-amber-700 dark:text-amber-400">⚠️ Unjustified / Excessive Permissions</span>
            <p className="mt-1">Permissions outside the scope of declared utility (e.g. <code>debugger</code> or <code>camera</code> in a Calculator) trigger full severity penalties.</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter security checks by keyword or permission name..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2 pl-9 pr-4 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 font-mono text-xs font-bold">
          {["all", "critical", "high", "medium", "low"].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilter(sev)}
              className={`rounded-lg px-3 py-1.5 uppercase transition-colors ${filter === sev
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Checklist Cards Grid */}
      <div className="mt-6 space-y-3 font-mono">
        {filteredItems.map((item) => (
          <div key={item.key} className="tech-card rounded-xl p-5 border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${item.severity === "critical"
                    ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800/60"
                    : item.severity === "high"
                      ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60"
                      : item.severity === "medium"
                        ? "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800/60"
                        : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800/60"
                    }`}
                >
                  {item.severity}
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</h3>
                <span className="text-xs text-slate-500 font-mono">[{item.key}]</span>
              </div>

              <div className="text-xs font-bold text-red-600 dark:text-red-400 font-mono">
                -{item.penalty} PTS
              </div>
            </div>

            <p className="mt-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {item.description}
            </p>

            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 border-t border-slate-200 dark:border-slate-800/60 pt-2 font-medium">
              <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Recommendation: {item.recommendation}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
