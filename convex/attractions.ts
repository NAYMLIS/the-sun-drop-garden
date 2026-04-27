import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const LAYERS = [
  "food",
  "groceries",
  "regeneration",
  "wellness",
  "stay",
  "awareness",
  "booking",
] as const;

const layerValidator = v.union(
  v.literal("food"),
  v.literal("groceries"),
  v.literal("regeneration"),
  v.literal("wellness"),
  v.literal("stay"),
  v.literal("awareness"),
  v.literal("booking")
);

/* ---------------- PUBLIC ---------------- */

// Public list: only spots with publicMap === true (or undefined for legacy spots).
// The /tour page calls this.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("attractions").collect();
    return all.filter((a) => a.publicMap !== false);
  },
});

export const listByCity = query({
  args: { city: v.string() },
  handler: async (ctx, args) => {
    const matches = await ctx.db
      .query("attractions")
      .withIndex("by_city", (q) => q.eq("city", args.city))
      .collect();
    return matches.filter((a) => a.publicMap !== false);
  },
});

/* ---------------- CURATOR (full visibility) ---------------- */

// Curator-only: see EVERYTHING regardless of publicMap flag.
// /curate page calls this. Auth happens at the page level (session cookie).
export const listAllForCurator = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("attractions").collect();
  },
});

export const listByLayer = query({
  args: { layer: layerValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attractions")
      .withIndex("by_layer", (q) => q.eq("layer", args.layer))
      .collect();
  },
});

/* ---------------- MUTATIONS ---------------- */

export const add = mutation({
  args: {
    name: v.string(),
    address: v.optional(v.string()),
    lat: v.number(),
    lng: v.number(),
    category: v.string(),
    city: v.string(),
    description: v.optional(v.string()),
    layer: v.optional(layerValidator),
    tags: v.optional(v.array(v.string())),
    publicMap: v.optional(v.boolean()),
    addedBy: v.optional(v.string()),
    notes: v.optional(v.string()),
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
      layer: args.layer,
      tags: args.tags,
      publicMap: args.publicMap ?? false, // default false: pin must be promoted to show publicly
      addedBy: args.addedBy,
      addedAt: Date.now(),
      notes: args.notes,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("attractions"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    description: v.optional(v.string()),
    layer: v.optional(layerValidator),
    tags: v.optional(v.array(v.string())),
    publicMap: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    const cleaned = Object.fromEntries(
      Object.entries(patch).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, cleaned);
    return id;
  },
});

// Toggle public flag for one pin.
export const togglePublic = mutation({
  args: { id: v.id("attractions"), publicMap: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { publicMap: args.publicMap });
  },
});

// Bulk classify: set layer + optional tags on many pins at once (used by migration script).
export const bulkClassify = mutation({
  args: {
    classifications: v.array(
      v.object({
        id: v.id("attractions"),
        layer: layerValidator,
        tags: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    let updated = 0;
    for (const c of args.classifications) {
      const patch: Record<string, unknown> = { layer: c.layer };
      if (c.tags) {
        patch.tags = c.tags;
      }
      await ctx.db.patch(c.id, patch);
      updated++;
    }
    return { updated };
  },
});

// Bulk-set publicMap=true for all currently-seeded attractions (one-time migration).
// After this runs, the public /tour map will look identical to today.
export const setAllPublic = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("attractions").collect();
    let updated = 0;
    for (const a of all) {
      if (a.publicMap === undefined) {
        await ctx.db.patch(a._id, { publicMap: true });
        updated++;
      }
    }
    return { updated, total: all.length };
  },
});

export const remove = mutation({
  args: { id: v.id("attractions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const removeByNameAndCity = mutation({
  args: { name: v.string(), city: v.string() },
  handler: async (ctx, args) => {
    const matches = await ctx.db
      .query("attractions")
      .withIndex("by_city", (q) => q.eq("city", args.city))
      .collect();
    for (const a of matches) {
      if (a.name === args.name) {
        await ctx.db.delete(a._id);
        return a._id;
      }
    }
    return null;
  },
});

/* ---------------- META ---------------- */

export const layerStats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("attractions").collect();
    const stats: Record<string, { total: number; public: number }> = {};
    for (const layer of LAYERS) {
      stats[layer] = { total: 0, public: 0 };
    }
    stats.unclassified = { total: 0, public: 0 };
    for (const a of all) {
      const key = a.layer || "unclassified";
      if (!stats[key]) {
        stats[key] = { total: 0, public: 0 };
      }
      stats[key].total++;
      if (a.publicMap) {
        stats[key].public++;
      }
    }
    return stats;
  },
});
