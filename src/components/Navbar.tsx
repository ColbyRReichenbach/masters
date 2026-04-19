import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";

export default function Navbar() {
  const location = useLocation();

  const links = [
    { name: "Scorecard", path: "/" },
    { name: "Profile", path: "/profile" },
    { name: "The Repeat", path: "/the-repeat" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-bg-cream/90 backdrop-blur-md border-b border-line-subtle">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 min-h-[72px] py-3 md:py-0 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Link to="/" className="font-serif text-2xl font-semibold tracking-tight text-green-900 flex items-baseline gap-2">
          Rory at Augusta
          <span className="hidden md:inline-block text-xs font-sans font-medium text-ink-500 uppercase tracking-widest ml-2">Interactive Data Story</span>
        </Link>
        <div className="flex w-full md:w-auto items-center gap-5 md:gap-8 overflow-x-auto pb-1 md:pb-0">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "shrink-0 text-sm font-medium transition-colors",
                location.pathname === link.path
                  ? "text-green-800 border-b-2 border-green-800 pb-1"
                  : "text-ink-500 hover:text-ink-900"
              )}
            >
              {link.name}
            </Link>
          ))}
          <div className="hidden md:flex items-center justify-center px-3 py-1 bg-green-900 text-bg-cream rounded-full text-xs font-bold tracking-widest">
            2026
          </div>
        </div>
      </div>
    </nav>
  );
}
