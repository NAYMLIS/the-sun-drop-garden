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
});
