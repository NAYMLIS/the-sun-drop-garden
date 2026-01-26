"use client";

import { useQuery } from "convex/react";
import { Lock } from "lucide-react";
import { useState } from "react";
import { AdminPanel } from "@/components/admin-panel";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";

export default function AdminPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");

  const dates = useQuery(api.tourDates.list) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET || "admin123";
    if (password === adminSecret) {
      setIsUnlocked(true);
    } else {
      console.error("Incorrect password");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="px-4 pt-24 pb-12">
        {isUnlocked ? (
          <AdminPanel dates={dates} />
        ) : (
          <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-md text-center">
              <Lock className="mx-auto mb-4 text-primary" size={48} />
              <h2 className="mb-4 font-serif text-2xl text-foreground">
                Restricted Access
              </h2>
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel className="text-foreground/70">
                      Admin Password
                    </FieldLabel>
                    <Input
                      className="border border-primary/20 bg-background/50 text-foreground"
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      type="password"
                      value={password}
                    />
                  </Field>
                  <Button
                    className="rounded border border-primary/50 px-6 py-2 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                    type="submit"
                  >
                    Enter Portal
                  </Button>
                </FieldGroup>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
