import Link from "next/link";
import { ShieldCheck, Lock, Cpu } from "lucide-react";
import ClientOnly from "./ClientOnly";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/80 py-12 text-slate-600 dark:text-slate-400 transition-colors" suppressHydrationWarning>
      <div className="mx-auto max-w-7xl px-6" suppressHydrationWarning>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                <ClientOnly fallback={<div className="h-4 w-4" />}>
                  <ShieldCheck className="h-4 w-4" />
                </ClientOnly>
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">Cyber-Trust</span>
            </div>
            <p className="mt-4 max-w-sm text-xs font-mono text-slate-600 dark:text-slate-400 leading-relaxed uppercase">
              AUTOMATED CHROME EXTENSION SECURITY ANALYZER POWERED BY STATIC CODE POLICY ENGINES AND AI THREAT CONTEXT EVALUATION.
            </p>
          </div>

          <div className="font-mono text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">Navigation</h4>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">HOME</Link></li>
              <li><Link href="/analyze" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">ANALYZE</Link></li>
              <li><Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">SCAN DASHBOARD</Link></li>
              <li><Link href="/checklist" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">23-POINT CHECKLIST</Link></li>
            </ul>
          </div>

          <div className="font-mono text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">Security Architecture</h4>
            <ul className="mt-4 space-y-2.5">
              <li className="flex items-center gap-2">
                <ClientOnly fallback={<div className="h-3.5 w-3.5" />}>
                  <Lock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </ClientOnly>
                23-Point Policy Engine
              </li>
              <li className="flex items-center gap-2">
                <ClientOnly fallback={<div className="h-3.5 w-3.5" />}>
                  <Cpu className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                </ClientOnly>
                AI Risk Contextualizer
              </li>
              <li className="flex items-center gap-2">
                <ClientOnly fallback={<div className="h-3.5 w-3.5" />}>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </ClientOnly>
                In-Memory CRX Unpacker
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200 dark:border-slate-800/80 pt-6 text-center text-xs font-mono text-slate-500">
          © {new Date().getFullYear()} Cyber-Trust Security Engine. Built for browser safety and transparency.
        </div>
      </div>
    </footer>
  );
}
