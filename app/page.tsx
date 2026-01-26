import Link from "next/link";
import { Navigation } from "@/components/navigation";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Navigation />
      <main className="animate-fade-in">
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
          {/* Background Ambience */}
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-card/20 via-background to-background" />
          <div className="z-10 animate-fade-in-up px-4 text-center">
            <h1 className="mb-6 font-serif text-6xl text-foreground tracking-tighter opacity-90 md:text-9xl">
              Bloom & Decay
            </h1>
            <p className="mx-auto mb-12 max-w-2xl font-serif text-primary/80 text-xl italic md:text-2xl">
              "The new album exploring the cyclical nature of light, sound, and
              the human spirit."
            </p>
            <Link
              className="inline-block rounded-full border border-primary bg-transparent px-8 py-3 text-primary text-sm uppercase tracking-widest transition-all duration-500 hover:bg-primary hover:text-primary-foreground"
              href="/sound"
            >
              Listen Now
            </Link>
          </div>

          {/* Decorative Elements */}
          <div className="absolute bottom-10 left-10 h-32 w-32 animate-pulse rounded-full border border-primary/10" />
          <div className="absolute top-20 right-20 h-64 w-64 rounded-full border border-primary/5" />
        </div>
      </main>
    </div>
  );
}
