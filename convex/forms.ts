import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listEmailSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const subscriptions = await ctx.db.query("emailSubscriptions").collect();
    return subscriptions.sort((a, b) => b.subscribedAt - a.subscribedAt);
  },
});

export const listInquiries = query({
  args: {},
  handler: async (ctx) => {
    const inquiries = await ctx.db.query("inquiries").collect();
    return inquiries.sort((a, b) => b.submittedAt - a.submittedAt);
  },
});

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

export const submitWebsiteInquiry = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("websiteInquiries", {
      name: args.name,
      email: args.email,
      message: args.message,
      submittedAt: Date.now(),
    });

    return id;
  },
});

export const listWebsiteInquiries = query({
  args: {},
  handler: async (ctx) => {
    const inquiries = await ctx.db.query("websiteInquiries").collect();
    return inquiries.sort((a, b) => b.submittedAt - a.submittedAt);
  },
});

export const removeEmailSubscription = mutation({
  args: {
    id: v.id("emailSubscriptions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const removeInquiry = mutation({
  args: {
    id: v.id("inquiries"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const removeWebsiteInquiry = mutation({
  args: {
    id: v.id("websiteInquiries"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
