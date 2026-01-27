import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const attractions = await ctx.db.query("attractions").collect();
    return attractions;
  },
});

export const listByCity = query({
  args: { city: v.string() },
  handler: async (ctx, args) => {
    const attractions = await ctx.db
      .query("attractions")
      .withIndex("by_city", (q) => q.eq("city", args.city))
      .collect();
    return attractions;
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    address: v.optional(v.string()),
    lat: v.number(),
    lng: v.number(),
    category: v.string(),
    city: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("attractions", {
      name: args.name,
      address: args.address,
      lat: args.lat,
      lng: args.lng,
      category: args.category,
      city: args.city,
      description: args.description,
    });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("attractions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
