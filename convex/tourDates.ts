import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const dates = await ctx.db.query("tourDates").collect();
    return dates.sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const add = mutation({
  args: {
    city: v.string(),
    venue: v.string(),
    date: v.string(),
    lat: v.number(),
    lng: v.number(),
    ticketLink: v.string(),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    time: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("tourDates", {
      city: args.city,
      venue: args.venue,
      date: args.date,
      lat: args.lat,
      lng: args.lng,
      ticketLink: args.ticketLink,
      description: args.description,
      address: args.address,
      time: args.time,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("tourDates"),
    city: v.optional(v.string()),
    venue: v.optional(v.string()),
    date: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    ticketLink: v.optional(v.string()),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    time: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Tour date not found");
    }
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("tourDates") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
