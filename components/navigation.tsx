"use client";

import { Lock, Menu, X } from "lucide-react";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      // Handle ESC key to close mobile menu
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleNavClick = () => {
    closeMobileMenu();
  };

  return (
    <>
      <nav className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-primary/10 border-b bg-background/80 px-8 py-6 backdrop-blur-sm">
        <Link
          className="cursor-pointer font-serif text-2xl text-[#36454F] tracking-widest opacity-[0.44] transition-colors hover:opacity-100"
          href="/"
          onClick={handleNavClick}
        >
          (((O)))
        </Link>
        <div className="hidden gap-12 font-sans text-foreground/80 text-xs tracking-[0.2em] md:flex md:justify-end">
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
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          {showAdminLink && (
            <Link
              className="hidden text-foreground/30 transition-colors hover:text-foreground md:block"
              href="/admin"
            >
              <Lock size={14} />
            </Link>
          )}
          <button
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle mobile menu"
            className="flex items-center justify-center text-foreground transition-colors hover:text-foreground md:hidden"
            onClick={() => {
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            type="button"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={closeMobileMenu}
          />

          {/* Mobile Menu Drawer */}
          <div
            aria-label="Mobile navigation menu"
            aria-modal="true"
            className="fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] border-primary/10 border-l bg-background/95 p-6 shadow-2xl backdrop-blur-sm transition-transform duration-300 ease-in-out"
            role="dialog"
          >
            <div className="flex h-full flex-col">
              {/* Header with close button */}
              <div className="mb-8 flex items-center justify-end">
                <button
                  aria-label="Close mobile menu"
                  className="flex items-center justify-center rounded-lg p-2 text-foreground transition-colors hover:bg-muted"
                  onClick={closeMobileMenu}
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation Items */}
              <nav
                aria-label="Mobile navigation"
                className="flex flex-1 flex-col items-end gap-4"
              >
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      className={`group relative rounded-lg px-4 py-3 font-sans text-foreground/80 text-sm tracking-[0.2em] transition-colors hover:bg-muted hover:text-foreground ${isActive ? "bg-muted text-foreground" : ""}`}
                      href={item.href}
                      key={item.href}
                      onClick={handleNavClick}
                    >
                      {item.label}
                      {isActive && (
                        <span className="absolute top-0 right-0 h-full w-1 rounded-l bg-foreground" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Footer with theme toggle and admin link */}
              <div className="mt-auto flex items-center justify-end gap-4 border-primary/10 border-t pt-6">
                <ThemeToggle />
                {showAdminLink && (
                  <Link
                    className="text-foreground/30 transition-colors hover:text-foreground"
                    href="/admin"
                    onClick={handleNavClick}
                  >
                    <Lock size={14} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
