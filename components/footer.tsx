"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { WebsiteInquiryModal } from "@/components/website-inquiry-modal";

const NAV_ITEMS = [
  { label: "TOUR", href: "/tour" },
  { label: "LIGHT", href: "/light" },
  { label: "SOUND", href: "/sound" },
] as const;

export function Footer() {
  const { theme } = useTheme();

  return (
    <footer className="border-primary/10 border-t bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-8 py-12">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {/* Brand Section */}
          <div className="flex flex-col gap-4">
            <Link
              className="cursor-pointer font-serif text-2xl text-[#36454F] tracking-widest opacity-[0.44] transition-colors hover:opacity-100"
              href="/"
            >
              (((O)))
            </Link>
            <p className="text-foreground/60 text-sm">The Sundrop Garden</p>
          </div>

          {/* Navigation Section */}
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-foreground text-sm uppercase tracking-wider">
              Navigation
            </h3>
            <nav aria-label="Footer navigation" className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  className="text-foreground/60 text-sm transition-colors hover:text-foreground"
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Connect Section */}
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-foreground text-sm uppercase tracking-wider">
              Connect
            </h3>
            <div className="flex flex-col gap-2">
              <Link
                className="text-foreground/60 text-sm transition-colors hover:text-foreground"
                href="/connect"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 grid grid-cols-1 items-center gap-4 border-primary/10 border-t pt-8 sm:grid-cols-3">
          <div className="flex flex-col items-center sm:items-start">
            <p className="text-left text-foreground/40 text-xs">
              © {new Date().getFullYear()} The Sundrop Garden
            </p>
          </div>
          <div className="flex justify-center">
            <WebsiteInquiryModal>
              <button
                className="transition-opacity hover:opacity-80"
                type="button"
              >
                <Image
                  alt="the cloud"
                  height={24}
                  src={
                    theme === "dark" ? "/thecloud(light).png" : "/thecloud.png"
                  }
                  width={100}
                />
              </button>
            </WebsiteInquiryModal>
          </div>
        </div>
      </div>
    </footer>
  );
}
