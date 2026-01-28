import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// =====================================
// Reading Progress Sync
// =====================================

export const getReadingProgress = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("readingProgress")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .collect();
  },
});

export const syncReadingProgress = mutation({
  args: {
    clerkId: v.string(),
    progress: v.array(
      v.object({
        surahId: v.number(),
        lastAyahRead: v.number(),
        totalAyahsRead: v.number(),
        completedAt: v.optional(v.number()),
        lastReadAt: v.number(),
        updatedAt: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];

    for (const item of args.progress) {
      // Check if record exists
      const existing = await ctx.db
        .query("readingProgress")
        .withIndex("by_clerk_surah", (q) =>
          q.eq("clerkId", args.clerkId).eq("surahId", item.surahId)
        )
        .first();

      if (existing) {
        // Only update if incoming data is newer
        if (item.updatedAt > existing.updatedAt) {
          await ctx.db.patch(existing._id, {
            lastAyahRead: item.lastAyahRead,
            totalAyahsRead: item.totalAyahsRead,
            completedAt: item.completedAt,
            lastReadAt: item.lastReadAt,
            updatedAt: item.updatedAt,
          });
          results.push({ surahId: item.surahId, action: "updated" });
        } else {
          results.push({ surahId: item.surahId, action: "skipped" });
        }
      } else {
        // Insert new record
        await ctx.db.insert("readingProgress", {
          clerkId: args.clerkId,
          ...item,
        });
        results.push({ surahId: item.surahId, action: "inserted" });
      }
    }

    return results;
  },
});

// =====================================
// Bookmarks Sync
// =====================================

export const getBookmarks = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bookmarks")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .collect();
  },
});

export const syncBookmarks = mutation({
  args: {
    clerkId: v.string(),
    bookmarks: v.array(
      v.object({
        surahId: v.number(),
        ayahNumber: v.number(),
        note: v.optional(v.string()),
        color: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];

    for (const item of args.bookmarks) {
      const existing = await ctx.db
        .query("bookmarks")
        .withIndex("by_clerk_surah_ayah", (q) =>
          q
            .eq("clerkId", args.clerkId)
            .eq("surahId", item.surahId)
            .eq("ayahNumber", item.ayahNumber)
        )
        .first();

      if (existing) {
        if (item.updatedAt > existing.updatedAt) {
          await ctx.db.patch(existing._id, {
            note: item.note,
            color: item.color,
            updatedAt: item.updatedAt,
          });
          results.push({
            surahId: item.surahId,
            ayahNumber: item.ayahNumber,
            action: "updated",
          });
        } else {
          results.push({
            surahId: item.surahId,
            ayahNumber: item.ayahNumber,
            action: "skipped",
          });
        }
      } else {
        await ctx.db.insert("bookmarks", {
          clerkId: args.clerkId,
          ...item,
        });
        results.push({
          surahId: item.surahId,
          ayahNumber: item.ayahNumber,
          action: "inserted",
        });
      }
    }

    return results;
  },
});

export const deleteBookmark = mutation({
  args: {
    clerkId: v.string(),
    surahId: v.number(),
    ayahNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_clerk_surah_ayah", (q) =>
        q
          .eq("clerkId", args.clerkId)
          .eq("surahId", args.surahId)
          .eq("ayahNumber", args.ayahNumber)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { success: true };
    }
    return { success: false };
  },
});

// =====================================
// Memorization Sync
// =====================================

export const getMemorization = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("memorization")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .collect();
  },
});

export const syncMemorization = mutation({
  args: {
    clerkId: v.string(),
    items: v.array(
      v.object({
        surahId: v.number(),
        ayahNumber: v.number(),
        status: v.string(),
        confidenceLevel: v.number(),
        lastReviewedAt: v.optional(v.number()),
        nextReviewAt: v.optional(v.number()),
        reviewCount: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];

    for (const item of args.items) {
      const existing = await ctx.db
        .query("memorization")
        .withIndex("by_clerk_surah_ayah", (q) =>
          q
            .eq("clerkId", args.clerkId)
            .eq("surahId", item.surahId)
            .eq("ayahNumber", item.ayahNumber)
        )
        .first();

      if (existing) {
        if (item.updatedAt > existing.updatedAt) {
          await ctx.db.patch(existing._id, {
            status: item.status,
            confidenceLevel: item.confidenceLevel,
            lastReviewedAt: item.lastReviewedAt,
            nextReviewAt: item.nextReviewAt,
            reviewCount: item.reviewCount,
            updatedAt: item.updatedAt,
          });
          results.push({
            surahId: item.surahId,
            ayahNumber: item.ayahNumber,
            action: "updated",
          });
        } else {
          results.push({
            surahId: item.surahId,
            ayahNumber: item.ayahNumber,
            action: "skipped",
          });
        }
      } else {
        await ctx.db.insert("memorization", {
          clerkId: args.clerkId,
          ...item,
        });
        results.push({
          surahId: item.surahId,
          ayahNumber: item.ayahNumber,
          action: "inserted",
        });
      }
    }

    return results;
  },
});

// =====================================
// Settings Sync
// =====================================

export const getSettings = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userSettings")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const syncSettings = mutation({
  args: {
    clerkId: v.string(),
    settings: v.object({
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
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      if (args.settings.updatedAt > existing.updatedAt) {
        await ctx.db.patch(existing._id, args.settings);
        return { action: "updated" };
      }
      return { action: "skipped" };
    } else {
      await ctx.db.insert("userSettings", {
        clerkId: args.clerkId,
        ...args.settings,
      });
      return { action: "inserted" };
    }
  },
});

// =====================================
// Full Sync - Get all data for a user
// =====================================

export const getAllUserData = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const [readingProgress, bookmarks, memorization, settings] =
      await Promise.all([
        ctx.db
          .query("readingProgress")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
          .collect(),
        ctx.db
          .query("bookmarks")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
          .collect(),
        ctx.db
          .query("memorization")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
          .collect(),
        ctx.db
          .query("userSettings")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
          .first(),
      ]);

    return {
      readingProgress,
      bookmarks,
      memorization,
      settings,
      fetchedAt: Date.now(),
    };
  },
});
