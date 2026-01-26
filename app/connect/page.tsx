"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { z } from "zod";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";

const INQUIRY_TYPES = [
  "Artists & Collaboration",
  "Community & Fans",
  "Venues, Shows, & Events",
  "Brands & Partnerships",
  "Something Else",
] as const;

// Zod schemas for validation
const nameSchema = z.string().min(1, "Name is required");
const emailSchema = z.string().email("Invalid email address");
const optionalEmailSchema = z
  .string()
  .email("Invalid email address")
  .optional()
  .or(z.literal(""));
const inquiryTypesSchema = z
  .array(z.string())
  .min(1, "Please select at least one inquiry type");

export default function ConnectPage() {
  const addEmailSubscription = useMutation(api.forms.addEmailSubscription);
  const addInquiry = useMutation(api.forms.addInquiry);

  // Email subscription form
  const emailForm = useForm({
    defaultValues: {
      name: "",
      email: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await addEmailSubscription(value);
        console.log("Successfully subscribed to email list!");
        emailForm.reset();
      } catch (error) {
        console.error(
          error instanceof Error
            ? error.message
            : "Failed to subscribe. Please try again."
        );
      }
    },
  });

  // Inquiry form
  const inquiryForm = useForm({
    defaultValues: {
      name: "",
      email: "",
      inquiryTypes: [] as string[],
      message: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await addInquiry({
          name: value.name || undefined,
          email: value.email || undefined,
          inquiryTypes: value.inquiryTypes,
          message: value.message || undefined,
        });
        console.log("Inquiry submitted successfully!");
        inquiryForm.reset();
      } catch (error) {
        console.error(
          error instanceof Error
            ? error.message
            : "Failed to submit inquiry. Please try again."
        );
      }
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="relative min-h-screen px-4 pt-24 pb-24 text-card-foreground">
        <div className="mx-auto max-w-4xl space-y-12">
          {/* Email List Section */}
          <div className="rounded-lg border bg-card p-8">
            <h3 className="mb-6 font-serif text-2xl">Email List</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                emailForm.handleSubmit();
              }}
            >
              <FieldGroup>
                <emailForm.Field
                  name="name"
                  validators={{
                    onChange: ({ value }) => {
                      const result = nameSchema.safeParse(value);
                      if (!result.success) {
                        return result.error.issues[0].message;
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <Field data-invalid={field.state.meta.errors.length > 0}>
                      <FieldLabel>
                        Name <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Your name"
                        required
                        type="text"
                        value={field.state.value}
                      />
                      <FieldError
                        errors={field.state.meta.errors.map((error) => ({
                          message: error,
                        }))}
                      />
                    </Field>
                  )}
                </emailForm.Field>

                <emailForm.Field
                  name="email"
                  validators={{
                    onChange: ({ value }) => {
                      const result = emailSchema.safeParse(value);
                      if (!result.success) {
                        return result.error.issues[0].message;
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <Field data-invalid={field.state.meta.errors.length > 0}>
                      <FieldLabel>
                        Email <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="your.email@example.com"
                        required
                        type="email"
                        value={field.state.value}
                      />
                      <FieldError
                        errors={field.state.meta.errors.map((error) => ({
                          message: error,
                        }))}
                      />
                    </Field>
                  )}
                </emailForm.Field>

                <Button className="w-full" type="submit">
                  Submit
                </Button>
              </FieldGroup>
            </form>
          </div>

          {/* Inquiries Section */}
          <div className="rounded-lg border bg-card p-8">
            <h3 className="mb-6 font-serif text-2xl">Inquiries</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                inquiryForm.handleSubmit();
              }}
            >
              <FieldGroup>
                <inquiryForm.Field name="name">
                  {(field) => (
                    <Field>
                      <FieldLabel>Name</FieldLabel>
                      <Input
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Your name"
                        type="text"
                        value={field.state.value}
                      />
                      <FieldError
                        errors={field.state.meta.errors.map((error) => ({
                          message: error,
                        }))}
                      />
                    </Field>
                  )}
                </inquiryForm.Field>

                <inquiryForm.Field
                  name="email"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value) {
                        return undefined;
                      }
                      const result = optionalEmailSchema.safeParse(value);
                      if (!result.success) {
                        return result.error.issues[0].message;
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <Field data-invalid={field.state.meta.errors.length > 0}>
                      <FieldLabel>Email</FieldLabel>
                      <Input
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="your.email@example.com"
                        type="email"
                        value={field.state.value}
                      />
                      <FieldError
                        errors={field.state.meta.errors.map((error) => ({
                          message: error,
                        }))}
                      />
                    </Field>
                  )}
                </inquiryForm.Field>

                <inquiryForm.Field
                  name="inquiryTypes"
                  validators={{
                    onChange: ({ value }) => {
                      const result = inquiryTypesSchema.safeParse(value);
                      if (!result.success) {
                        return result.error.issues[0].message;
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <Field data-invalid={field.state.meta.errors.length > 0}>
                      <FieldLabel>
                        Inquiry Type <span className="text-destructive">*</span>
                      </FieldLabel>
                      <FieldDescription>
                        Select all that apply to your inquiry
                      </FieldDescription>
                      <div className="space-y-2">
                        {INQUIRY_TYPES.map((type) => (
                          <label
                            className="group flex cursor-pointer items-center gap-3"
                            key={type}
                          >
                            <input
                              checked={field.state.value.includes(type)}
                              className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                              onChange={(e) => {
                                const currentTypes = field.state.value;
                                const newTypes = e.target.checked
                                  ? [...currentTypes, type]
                                  : currentTypes.filter((t) => t !== type);
                                field.handleChange(newTypes);
                              }}
                              type="checkbox"
                            />
                            <span className="text-sm group-hover:text-primary">
                              {type}
                            </span>
                          </label>
                        ))}
                      </div>
                      <FieldError
                        errors={field.state.meta.errors.map((error) => ({
                          message: error,
                        }))}
                      />
                    </Field>
                  )}
                </inquiryForm.Field>

                <inquiryForm.Field name="message">
                  {(field) => (
                    <Field>
                      <FieldLabel>Message</FieldLabel>
                      <Textarea
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Tell us more about your inquiry..."
                        rows={5}
                        value={field.state.value}
                      />
                      <FieldError
                        errors={field.state.meta.errors.map((error) => ({
                          message: error,
                        }))}
                      />
                    </Field>
                  )}
                </inquiryForm.Field>

                <Button className="w-full" type="submit">
                  Submit
                </Button>
              </FieldGroup>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
