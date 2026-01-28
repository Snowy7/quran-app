import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users synced from Clerk
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  // Simple todo items
  todos: defineTable({
    userId: v.id("users"),
    text: v.string(),
    completed: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // =====================================
  // Quran App Sync Tables
  // =====================================

  // Reading progress per surah
  readingProgress: defineTable({
    clerkId: v.string(),
    surahId: v.number(),
    lastAyahRead: v.number(),
    totalAyahsRead: v.number(),
    completedAt: v.optional(v.number()),
    lastReadAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_clerk_surah", ["clerkId", "surahId"]),

  // User bookmarks
  bookmarks: defineTable({
    clerkId: v.string(),
    surahId: v.number(),
    ayahNumber: v.number(),
    note: v.optional(v.string()),
    color: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_clerk_surah_ayah", ["clerkId", "surahId", "ayahNumber"]),

  // Memorization progress
  memorization: defineTable({
    clerkId: v.string(),
    surahId: v.number(),
    ayahNumber: v.number(),
    status: v.string(), // 'learning' | 'memorized' | 'reviewing'
    confidenceLevel: v.number(), // 1-5
    lastReviewedAt: v.optional(v.number()),
    nextReviewAt: v.optional(v.number()),
    reviewCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_clerk_surah", ["clerkId", "surahId"])
    .index("by_clerk_surah_ayah", ["clerkId", "surahId", "ayahNumber"]),

  // User settings
  userSettings: defineTable({
    clerkId: v.string(),
    theme: v.string(),
    arabicFontSize: v.number(),
    translationFontSize: v.number(),
    showTranslation: v.boolean(),
    preferredReciter: v.string(),
    preferredTranslation: v.string(),
    playbackSpeed: v.number(),
    autoPlayNext: v.boolean(),
    dailyAyahGoal: v.number(),
    updatedAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),
});
