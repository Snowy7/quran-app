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

  // Push notification subscriptions
  pushSubscriptions: defineTable({
    clerkId: v.string(),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_endpoint", ["endpoint"]),

  // Server-side notification schedule per user
  // Stores the user's prayer times + preferences so the cron can fire at the right times
  notificationSchedules: defineTable({
    clerkId: v.string(),
    enabled: v.boolean(),
    // Prayer times in "HH:MM" format (local time of the user)
    prayerTimes: v.optional(
      v.object({
        Fajr: v.string(),
        Sunrise: v.string(),
        Dhuhr: v.string(),
        Asr: v.string(),
        Maghrib: v.string(),
        Isha: v.string(),
      }),
    ),
    // User's timezone offset in minutes (from Date.getTimezoneOffset())
    timezoneOffset: v.number(),
    // Notification preferences
    atPrayerTime: v.boolean(),
    beforePrayerTime: v.boolean(),
    beforeMinutes: v.number(),
    reminderAfter: v.boolean(),
    reminderMinutes: v.number(),
    dailyReadingReminder: v.boolean(),
    dailyReadingReminderTime: v.string(), // "HH:MM"
    // Track which notifications have been sent today to avoid duplicates
    sentToday: v.optional(v.array(v.string())),
    lastResetDate: v.optional(v.string()), // "YYYY-MM-DD"
    updatedAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

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
