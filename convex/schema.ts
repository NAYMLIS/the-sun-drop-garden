import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tourDates: defineTable({
    city: v.string(),
    venue: v.string(),
    date: v.string(),
    lat: v.number(),
    lng: v.number(),
    ticketLink: v.string(),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    time: v.optional(v.string()),
  }).index("by_date", ["date"]),

  attractions: defineTable({
    name: v.string(),
    address: v.optional(v.string()),
    lat: v.number(),
    lng: v.number(),
    category: v.string(),
    city: v.string(),
    description: v.optional(v.string()),
  }).index("by_city", ["city"]),

  emailSubscriptions: defineTable({
    name: v.string(),
    email: v.string(),
    subscribedAt: v.number(),
  }).index("by_email", ["email"]),

  inquiries: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    inquiryTypes: v.array(v.string()),
    message: v.optional(v.string()),
    submittedAt: v.number(),
  }).index("by_submitted", ["submittedAt"]),

  websiteInquiries: defineTable({
    name: v.string(),
    email: v.string(),
    message: v.optional(v.string()),
    submittedAt: v.number(),
  }).index("by_submitted", ["submittedAt"]),

  posts: defineTable({
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
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),
});
