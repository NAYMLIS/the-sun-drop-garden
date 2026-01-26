import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const addEmailSubscription = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existing = await ctx.db
      .query("emailSubscriptions")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("Email already subscribed");
    }

    const id = await ctx.db.insert("emailSubscriptions", {
      name: args.name,
      email: args.email,
      subscribedAt: Date.now(),
    });

    return id;
  },
});

export const addInquiry = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    inquiryTypes: v.array(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("inquiries", {
      name: args.name,
      email: args.email,
      inquiryTypes: args.inquiryTypes,
      message: args.message,
      submittedAt: Date.now(),
    });

    return id;
  },
});
