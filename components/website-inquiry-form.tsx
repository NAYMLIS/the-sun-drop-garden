"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { api } from "@/convex/_generated/api";

interface WebsiteInquiryFormProps {
  onSuccess: () => void;
}

export function WebsiteInquiryForm({ onSuccess }: WebsiteInquiryFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitWebsiteInquiry = useMutation(api.forms.submitWebsiteInquiry);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      await submitWebsiteInquiry({
        name: formData.name,
        email: formData.email,
        message: formData.message || undefined,
      });

      addToast("Message sent! We'll get back to you soon!");

      setFormData({
        name: "",
        email: "",
        message: "",
      });

      onSuccess();
    } catch {
      addToast("Failed to send message. Please try again.", "destructive");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label className="text-white" htmlFor="name">
          Name *
        </Label>
        <Input
          className="border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:bg-white/15"
          id="name"
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          value={formData.name}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white" htmlFor="email">
          Email *
        </Label>
        <Input
          className="border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:bg-white/15"
          id="email"
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          type="email"
          value={formData.email}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white" htmlFor="message">
          Message (optional)
        </Label>
        <Textarea
          className="border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:bg-white/15"
          id="message"
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
          rows={4}
          value={formData.message}
        />
      </div>

      <Button
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Sending..." : "Send"}
      </Button>
    </form>
  );
}
