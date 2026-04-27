"use client";

import { useEffect, useState } from "react";
import { CuratorMap } from "@/components/curator-map";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { CuratorMe } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function CuratePage() {
  const [me, setMe] = useState<CuratorMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetch("/api/curator/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setMe(d.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/curator/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMe({ email: data.email, displayName: data.displayName });
        setEmail("");
        setPassword("");
      } else {
        addToast(data.error || "Login failed", "destructive");
        setPassword("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/curator/logout", { method: "POST" });
    setMe(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <div className="flex min-h-screen items-center justify-center text-foreground/50">
          Loading…
        </div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <main className="px-4 pt-24 pb-12">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center">
                <h1 className="font-light text-2xl tracking-wide">
                  Curator Sign In
                </h1>
                <p className="mt-2 text-foreground/50 text-sm">
                  Private curation tools for the Sun Drop Garden tour map.
                </p>
              </div>
              <form onSubmit={handleLogin}>
                <FieldGroup>
                  <Field>
                    <Input
                      autoComplete="email"
                      className="border-0 bg-background/50 text-foreground focus-visible:border-0 focus-visible:ring-0"
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email"
                      type="email"
                      value={email}
                    />
                  </Field>
                  <Field>
                    <Input
                      autoComplete="current-password"
                      className="border-0 bg-background/50 text-foreground focus-visible:border-0 focus-visible:ring-0"
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="password"
                      type="password"
                      value={password}
                    />
                  </Field>
                  <Button
                    className="rounded border border-foreground bg-transparent px-6 py-2 text-foreground transition-colors hover:bg-transparent hover:text-foreground"
                    disabled={submitting}
                    type="submit"
                  >
                    {submitting ? "Signing in…" : "Enter"}
                  </Button>
                </FieldGroup>
              </form>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <CuratorMap me={me} onLogout={handleLogout} />;
}
