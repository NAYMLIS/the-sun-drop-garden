import Image from "next/image";
import { Navigation } from "@/components/navigation";

export default function LightPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="mx-auto max-w-7xl px-6 pt-32 md:px-12">
        <h2 className="mb-12 text-center font-serif text-4xl text-foreground">
          Visual Echoes
        </h2>
        <div className="grid auto-rows-[300px] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              className={`group relative overflow-hidden rounded-lg ${i % 3 === 0 ? "md:col-span-2" : ""}`}
              key={i}
            >
              <Image
                alt={`Gallery memory ${i}`}
                className="h-full w-full object-cover grayscale transition-transform duration-700 group-hover:scale-110 group-hover:grayscale-0"
                height={600}
                src={`https://picsum.photos/800/600?random=${i}`}
                width={800}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="font-serif text-2xl text-primary italic">
                  Memory {i}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
