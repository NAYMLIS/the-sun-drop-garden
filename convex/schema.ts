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
    // ((( O )))'s curation system (added 2026-04-27)
    // Layer = top-level grouping she filters by
    layer: v.optional(
      v.union(
        v.literal("food"),
        v.literal("groceries"),
        v.literal("regeneration"),
        v.literal("wellness"),
        v.literal("stay"),
        v.literal("awareness"),
<<<<<<< Updated upstream
        v.literal("booking")
      )
=======
        v.literal("booking"),
      ),
>>>>>>> Stashed changes
    ),
    // Tags = sub-types within a layer (e.g. layer=food + tags=[vegan, restaurant])
    tags: v.optional(v.array(v.string())),
    // Public flag: only spots with publicMap=true show on the public /tour map
    // Defaults to true for backwards compat with existing seeded spots.
    publicMap: v.optional(v.boolean()),
    // Audit / source
    addedBy: v.optional(v.string()), // email of user who added
    addedAt: v.optional(v.number()),
    notes: v.optional(v.string()), // her private notes per pin
  })
    .index("by_city", ["city"])
    .index("by_layer", ["layer"])
    .index("by_publicMap", ["publicMap"]),

  // ((( O )))'s saved lists — like Google Maps "Your places"
  // Each list is a named collection of attraction ids she's bookmarked.
  savedLists: defineTable({
    ownerEmail: v.string(),
    name: v.string(), // e.g. "Vegan NYC", "Brooklyn Bath Houses"
    layer: v.optional(v.string()), // optional default layer hint
    color: v.optional(v.string()), // optional UI tint
    icon: v.optional(v.string()), // optional emoji
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerEmail"]),

  // Many-to-many join: which attractions are in which saved lists
  savedListItems: defineTable({
    listId: v.id("savedLists"),
    attractionId: v.id("attractions"),
    addedAt: v.number(),
  })
    .index("by_list", ["listId"])
    .index("by_attraction", ["attractionId"])
    .index("by_list_attraction", ["listId", "attractionId"]),

  // Curator users (her account, plus admin/Kyle if needed)
  curators: defineTable({
    email: v.string(),
    passwordHash: v.string(), // bcrypt-style or argon2; we'll use scrypt for simplicity
    displayName: v.optional(v.string()),
    createdAt: v.number(),
    lastLoginAt: v.optional(v.number()),
  }).index("by_email", ["email"]),

  // Session tokens (simple opaque random strings)
  curatorSessions: defineTable({
    token: v.string(),
    email: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"]),

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
        v.literal("spotify"),
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
