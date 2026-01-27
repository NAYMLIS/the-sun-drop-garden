"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_ITEMS = [
  { label: "TOUR", href: "/tour" },
  { label: "LIGHT", href: "/light" },
  { label: "SOUND", href: "/sound" },
  { label: "CONNECT", href: "/connect" },
] as const;

export function Navigation() {
  const pathname = usePathname();
  const [showAdminLink, setShowAdminLink] = useState(false);

  useEffect(() => {
    // Load preference from localStorage
    const stored = localStorage.getItem("showAdminLink");
    if (stored === "true") {
      setShowAdminLink(true);
    }

    // Handle Cmd+K (Mac) or Ctrl+K (Windows/Linux)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowAdminLink((prev) => {
          const newValue = !prev;
          localStorage.setItem("showAdminLink", String(newValue));
          return newValue;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-primary/10 border-b bg-background/80 px-8 py-6 backdrop-blur-sm">
      <Link
        className="cursor-pointer font-serif text-2xl text-[#36454F] tracking-widest opacity-[0.44] transition-colors hover:opacity-100"
        href="/"
      >
        (((O)))
      </Link>
      <div className="hidden gap-12 font-sans text-foreground/80 text-xs tracking-[0.2em] md:flex">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              className={`group relative transition-colors hover:text-foreground ${isActive ? "text-foreground" : ""}`}
              href={item.href}
              key={item.href}
            >
              {item.label}
              <span
                className={`absolute -bottom-2 left-0 h-px w-0 bg-foreground transition-all duration-300 group-hover:w-full ${isActive ? "w-full" : ""}`}
              />
            </Link>
          );
        })}
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {showAdminLink && (
          <Link
            className="text-foreground/30 transition-colors hover:text-foreground"
            href="/admin"
          >
            <Lock size={14} />
          </Link>
        )}
      </div>
    </nav>
  );
}
