import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ThemeProvider } from "./context/ThemeContext";

export const metadata = {
  title: "Cyber-Trust | Chrome Extension Security Analyzer",
  description: "Static security analysis for Chrome extensions. Scan permissions, detect vulnerabilities, and retrieve trust scores.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors" suppressHydrationWarning>
        <ThemeProvider>
          <Navbar />
          <main className="flex-1 bg-white dark:bg-[#090d16]">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
