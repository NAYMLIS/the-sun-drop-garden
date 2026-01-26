"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { label: "TOUR", href: "/tour" },
  { label: "LIGHT", href: "/light" },
  { label: "SOUND", href: "/sound" },
  { label: "CONNECT", href: "/connect" },
] as const;

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-primary/10 border-b bg-background/80 px-8 py-6 backdrop-blur-sm">
      <Link
        className="cursor-pointer font-serif text-2xl text-primary tracking-widest transition-colors hover:text-foreground"
        href="/"
      >
        THE SUNDROP GARDEN
      </Link>
      <div className="hidden gap-12 font-sans text-foreground/80 text-xs tracking-[0.2em] md:flex">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              className={`group relative transition-colors hover:text-primary ${isActive ? "text-primary" : ""}`}
              href={item.href}
              key={item.href}
            >
              {item.label}
              <span
                className={`absolute -bottom-2 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full ${isActive ? "w-full" : ""}`}
              />
            </Link>
          );
        })}
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Link
          className="text-primary/30 transition-colors hover:text-primary"
          href="/admin"
        >
          <Lock size={14} />
        </Link>
      </div>
    </nav>
  );
}
