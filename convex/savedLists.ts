import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ---------------- LISTS ---------------- */

export const listForOwner = query({
  args: { ownerEmail: v.string() },
  handler: async (ctx, args) => {
    const lists = await ctx.db
      .query("savedLists")
      .withIndex("by_owner", (q) => q.eq("ownerEmail", args.ownerEmail))
      .collect();

    // Also fetch counts per list
    const enriched = await Promise.all(
      lists.map(async (list) => {
        const items = await ctx.db
          .query("savedListItems")
          .withIndex("by_list", (q) => q.eq("listId", list._id))
          .collect();
        return { ...list, count: items.length };
      })
    );
    return enriched.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const createList = mutation({
  args: {
    ownerEmail: v.string(),
    name: v.string(),
    layer: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("savedLists", {
      ownerEmail: args.ownerEmail,
      name: args.name,
      layer: args.layer,
      color: args.color,
      icon: args.icon,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const renameList = mutation({
  args: { id: v.id("savedLists"), name: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { name: args.name, updatedAt: Date.now() });
  },
});

export const deleteList = mutation({
  args: { id: v.id("savedLists") },
  handler: async (ctx, args) => {
    // delete all items first
    const items = await ctx.db
      .query("savedListItems")
      .withIndex("by_list", (q) => q.eq("listId", args.id))
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    await ctx.db.delete(args.id);
  },
});

/* ---------------- LIST ITEMS ---------------- */

export const itemsForList = query({
  args: { listId: v.id("savedLists") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("savedListItems")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();
    const attractions = await Promise.all(
      items.map(async (i) => {
        const a = await ctx.db.get(i.attractionId);
        return a ? { ...a, savedAt: i.addedAt, listItemId: i._id } : null;
      })
    );
    return attractions.filter((a) => a !== null);
  },
});

export const addToList = mutation({
  args: {
    listId: v.id("savedLists"),
    attractionId: v.id("attractions"),
  },
  handler: async (ctx, args) => {
    // Check for duplicate
    const existing = await ctx.db
      .query("savedListItems")
      .withIndex("by_list_attraction", (q) =>
        q.eq("listId", args.listId).eq("attractionId", args.attractionId)
      )
      .first();
    if (existing) {
      return existing._id;
    }

    const id = await ctx.db.insert("savedListItems", {
      listId: args.listId,
      attractionId: args.attractionId,
      addedAt: Date.now(),
    });
    await ctx.db.patch(args.listId, { updatedAt: Date.now() });
    return id;
  },
});

export const removeFromList = mutation({
  args: {
    listId: v.id("savedLists"),
    attractionId: v.id("attractions"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("savedListItems")
      .withIndex("by_list_attraction", (q) =>
        q.eq("listId", args.listId).eq("attractionId", args.attractionId)
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.listId, { updatedAt: Date.now() });
    }
  },
});

// Which lists contain a given attraction?
export const listsContainingAttraction = query({
  args: {
    ownerEmail: v.string(),
    attractionId: v.id("attractions"),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("savedListItems")
      .withIndex("by_attraction", (q) =>
        q.eq("attractionId", args.attractionId)
      )
      .collect();
    const matching = await Promise.all(
      items.map(async (i) => {
        const list = await ctx.db.get(i.listId);
        return list && list.ownerEmail === args.ownerEmail ? list : null;
      })
    );
    return matching.filter((l) => l !== null);
  },
});
