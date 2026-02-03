"use client";

import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { AdminPanel } from "@/components/admin-panel";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { api } from "@/convex/_generated/api";
import { verifyAdminPassword } from "./actions";

const ADMIN_AUTH_KEY = "adminAuthenticated";

export default function AdminPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const { addToast } = useToast();

  const dates = useQuery(api.tourDates.list) || [];

  // Check localStorage on mount to restore authentication state
  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_AUTH_KEY);
    if (stored === "true") {
      setIsUnlocked(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      return;
    }

    const isValid = await verifyAdminPassword(password);

    if (isValid) {
      setIsUnlocked(true);
      localStorage.setItem(ADMIN_AUTH_KEY, "true");
    } else {
      addToast("Incorrect password", "destructive");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="animate-fade-in px-4 pt-24 pb-12">
        {isUnlocked ? (
          <AdminPanel dates={dates} />
        ) : (
          <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-md text-center">
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  <Field>
                    <Input
                      className="border-0 bg-background/50 text-foreground focus-visible:border-0 focus-visible:ring-0"
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      type="password"
                      value={password}
                    />
                  </Field>
                  <Button
                    className="rounded border border-foreground bg-transparent px-6 py-2 text-foreground transition-colors hover:bg-transparent hover:text-foreground"
                    type="submit"
                  >
                    Enter
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
