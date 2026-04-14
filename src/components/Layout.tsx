import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-cream text-ink-700">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="bg-green-900 text-bg-cream py-12 px-4 md:px-6 lg:px-8 mt-24">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-serif text-2xl font-semibold">
            How the 2026 Masters Was Won
          </div>
          <div className="text-sm font-sans text-bg-cream-2 text-center md:text-right max-w-md">
            Unofficial editorial analysis project. Not affiliated with or endorsed by the Masters Tournament or Augusta National.
            <br />
            <span className="text-xs opacity-60 mt-2 block">Build Timestamp: 2026-04-13T12:00:00Z</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
