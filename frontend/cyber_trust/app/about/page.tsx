import { ShieldCheck, Cpu, Lock, FileCode, CheckCircle2, AlertTriangle, Terminal, HelpCircle } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16 bg-white dark:bg-transparent">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 px-4 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 backdrop-blur-md">
          <ShieldCheck className="h-4 w-4" />
          <span>Security Architecture & Methodology</span>
        </div>
        <h1 className="mt-6 text-4xl font-extrabold text-slate-900 dark:text-white sm:text-5xl">
          About <span className="gradient-text">Safex</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          Safex is an enterprise-grade automated security analyzer built to demystify Chrome extension risks and protect users from data exfiltration, malicious permissions, and vulnerable code patterns.
        </p>
      </div>

      {/* Brand Mission Section */}
      <div className="mt-16 rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 shadow-sm dark:shadow-none">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Why We Built Safex</h2>
        <p className="mt-4 text-slate-700 dark:text-slate-300 leading-relaxed">
          Chrome extensions execute with privileged access inside user browsers—reading sensitive browsing data, interacting with web pages, and storing local auth credentials. Yet users are expected to accept cryptic permission prompts like <code className="rounded bg-slate-200 dark:bg-slate-900 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-400 font-mono">"Read and change all your data on all websites"</code> without understanding the true security context.
        </p>
        <p className="mt-3 text-slate-700 dark:text-slate-300 leading-relaxed">
          Safex bridges this gap by statically auditing extension binaries, parsing Content Security Policies, extracting hidden external domain URLs, and translating technical risk vectors into plain-English summaries.
        </p>
      </div>

      {/* Analysis Pipeline Flow */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center">Under the Hood: 4-Stage Analysis Pipeline</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-2xl p-6 border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 shadow-sm dark:shadow-none">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 font-bold">1</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Automated CRX Fetching</h3>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Extracts 32-character extension IDs from Web Store links and retrieves official CRX binaries from Google's distribution servers with fallback mirror support.
            </p>
          </div>

          <div className="rounded-2xl p-6 border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 shadow-sm dark:shadow-none">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400 font-bold">2</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">In-Memory Binary Unpacking</h3>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Strips Chrome CRXv2/CRXv3 headers in Node/Python memory to inspect pure ZIP payload contents without writing untrusted code to server disks.
            </p>
          </div>

          <div className="rounded-2xl p-6 border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 shadow-sm dark:shadow-none">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-600/20 text-purple-700 dark:text-purple-400 font-bold">3</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">23-Point Calibrated Policy Engine</h3>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Evaluates manifest permissions, content script scopes, CSP unsafe-eval directives, and comment-stripped regex code patterns (eval, innerHTML, hardcoded credentials).
            </p>
          </div>

          <div className="rounded-2xl p-6 border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 shadow-sm dark:shadow-none">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-600/20 text-cyan-700 dark:text-cyan-400 font-bold">4</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">AI Contextual Analysis</h3>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Sends manifest details and findings to an OpenAI-compatible LLM (Groq / OpenRouter) to generate executive risk summaries and user action recommendations.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-20">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center">Frequently Asked Questions</h2>
        <div className="mt-8 space-y-4">
          <div className="rounded-xl p-6 border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 shadow-sm dark:shadow-none">
            <h4 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
              <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              How is the Trust Score calculated?
            </h4>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Every extension starts with a base score of 100. Penalties are deducted based on risk severity (Critical, High, Medium, Low). We apply calibrated soft caps so safe, popular extensions using standard permissions like <code className="text-blue-600 dark:text-blue-400 font-mono">storage</code> or <code className="text-blue-600 dark:text-blue-400 font-mono">activeTab</code> do not unfairly drop to 0/100.
            </p>
          </div>

          <div className="rounded-xl p-6 border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 shadow-sm dark:shadow-none">
            <h4 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
              <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Is my uploaded or scanned extension data stored securely?
            </h4>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Scan results are cached in MongoDB for 24 hours to optimize performance and save API quota. No personal browser data or user tokens are ever collected or stored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
