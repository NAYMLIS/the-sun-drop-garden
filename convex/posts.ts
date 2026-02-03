import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    try {
      const posts = await ctx.db.query("posts").collect();

      if (!Array.isArray(posts)) {
        return [];
      }

      // Filter out any invalid posts and sort safely
      const validPosts = posts.filter((post) => {
        try {
          return (
            post &&
            typeof post === "object" &&
            post !== null &&
            "_id" in post &&
            "createdAt" in post &&
            typeof post.createdAt === "number"
          );
        } catch {
          return false;
        }
      });

      return validPosts.sort((a, b) => {
        try {
          const aTime = a.createdAt || 0;
          const bTime = b.createdAt || 0;
          return bTime - aTime;
        } catch {
          return 0;
        }
      });
    } catch (error) {
      // Log the error for debugging but return empty array to prevent crashes
      console.error("Error fetching posts:", error);
      // Return empty array instead of throwing
      return [];
    }
  },
});

export const add = mutation({
  args: {
    caption: v.optional(v.string()),
    mediaType: v.union(
      v.literal("image"),
      v.literal("audio"),
      v.literal("video"),
      v.literal("link"),
      v.null()
    ),
    fileId: v.optional(v.id("_storage")),
    fileUrl: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    linkType: v.optional(
      v.union(
        v.literal("youtube"),
        v.literal("soundcloud"),
        v.literal("bandcamp"),
        v.literal("vimeo"),
        v.literal("generic")
      )
    ),
    linkTitle: v.optional(v.string()),
    linkDescription: v.optional(v.string()),
    linkImage: v.optional(v.string()),
    linkFavicon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let fileUrl = args.fileUrl;
    if (args.fileId && !fileUrl) {
      fileUrl = (await ctx.storage.getUrl(args.fileId)) ?? undefined;
    }

    const id = await ctx.db.insert("posts", {
      caption: args.caption,
      mediaType: args.mediaType,
      fileId: args.fileId,
      fileUrl,
      linkUrl: args.linkUrl,
      linkType: args.linkType,
      linkTitle: args.linkTitle,
      linkDescription: args.linkDescription,
      linkImage: args.linkImage,
      linkFavicon: args.linkFavicon,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("posts"),
    caption: v.optional(v.string()),
    mediaType: v.optional(
      v.union(
        v.literal("image"),
        v.literal("audio"),
        v.literal("video"),
        v.literal("link"),
        v.null()
      )
    ),
    fileId: v.optional(v.id("_storage")),
    fileUrl: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    linkType: v.optional(
      v.union(
        v.literal("youtube"),
        v.literal("soundcloud"),
        v.literal("bandcamp"),
        v.literal("vimeo"),
        v.literal("generic")
      )
    ),
    linkTitle: v.optional(v.string()),
    linkDescription: v.optional(v.string()),
    linkImage: v.optional(v.string()),
    linkFavicon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Post not found");
    }
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (post?.fileId) {
      await ctx.storage.delete(post.fileId);
    }
    await ctx.db.delete(args.id);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getFileUrl = query({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.fileId);
  },
});
