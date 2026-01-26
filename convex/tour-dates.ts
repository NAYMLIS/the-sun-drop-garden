import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const dates = await ctx.db.query("tourDates").order("asc").collect();
    return dates;
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
    });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("tourDates") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
