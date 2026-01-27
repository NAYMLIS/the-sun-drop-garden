import Link from "next/link";
import { Navigation } from "@/components/navigation";

export default function Home({
  params: _params,
  searchParams: _searchParams,
}: {
  params?: Promise<Record<string, string | string[]>>;
  searchParams?: Promise<Record<string, string | string[]>>;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Navigation />
      <main className="animate-fade-in">
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
          {/* Background Ambience */}
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-card/20 via-background to-background" />
          <div className="z-10 animate-fade-in-up px-4 text-center">
            <h1 className="mb-6 pb-6 font-serif text-6xl text-[#36454F] tracking-tighter opacity-[0.44] md:text-9xl">
              (((O)))
            </h1>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                className="inline-block rounded-full bg-transparent px-8 py-3 text-foreground text-sm uppercase tracking-widest transition-all duration-500 hover:text-foreground"
                href="/sound"
              >
                Listen
              </Link>
              <Link
                className="inline-block rounded-full bg-transparent px-8 py-3 text-foreground text-sm uppercase tracking-widest transition-all duration-500 hover:text-foreground"
                href="/tour"
              >
                Tour
              </Link>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-20 right-20 h-64 w-64 rounded-full border border-primary/5" />
        </div>
      </main>
    </div>
  );
}
