import { Outlet } from "react-router-dom";
import { ExternalLink, Linkedin } from "lucide-react";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-cream text-ink-700">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="bg-green-900 text-white py-10 md:py-12 px-4 md:px-6 lg:px-8 mt-16 md:mt-24">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <div className="font-serif text-xl md:text-2xl font-semibold !text-white">
              How the 2026 Masters Was Won
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <a
                href="https://www.linkedin.com/in/colby-reichenbach/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/80 transition hover:border-masters-yellow hover:text-masters-yellow"
              >
                <Linkedin size={14} />
                LinkedIn
              </a>
              <a
                href="https://colbyrreichenbach.github.io/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/80 transition hover:border-masters-yellow hover:text-masters-yellow"
              >
                <ExternalLink size={14} />
                Portfolio
              </a>
            </div>
          </div>
          <div className="text-sm font-sans text-white/75 text-center md:text-right max-w-md">
            Unofficial editorial analysis project. Not affiliated with or endorsed by the Masters Tournament or Augusta National.
            <br />
            <span className="text-xs text-masters-yellow/70 mt-2 block">Build Timestamp: 2026-04-13T12:00:00Z</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
