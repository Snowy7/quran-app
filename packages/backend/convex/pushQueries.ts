import { v } from "convex/values";
import {
  mutation,
  query,
  internalMutation,
  internalQuery,
} from "./_generated/server";

// ═════════════════════════════════════════════════════════════════════
// Public mutations/queries (called from frontend)
// ═════════════════════════════════════════════════════════════════════

// ─── Save Push Subscription ─────────────────────────────────────────

export const saveSubscription = mutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const clerkId = identity.subject;
    const now = Date.now();

    // Check if this exact endpoint already exists
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing) {
      // Update keys (they can rotate)
      await ctx.db.patch(existing._id, {
        clerkId,
        p256dh: args.p256dh,
        auth: args.auth,
        updatedAt: now,
      });
      return existing._id;
    }

    // Insert new subscription
    return await ctx.db.insert("pushSubscriptions", {
      clerkId,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ─── Remove Push Subscription ───────────────────────────────────────

export const removeSubscription = mutation({
  args: {
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing && existing.clerkId === identity.subject) {
      await ctx.db.delete(existing._id);
      return { success: true };
    }
    return { success: false };
  },
});

// ─── Save/Update Notification Schedule ──────────────────────────────

export const saveNotificationSchedule = mutation({
  args: {
    enabled: v.boolean(),
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
    timezoneOffset: v.number(),
    atPrayerTime: v.boolean(),
    beforePrayerTime: v.boolean(),
    beforeMinutes: v.number(),
    reminderAfter: v.boolean(),
    reminderMinutes: v.number(),
    dailyReadingReminder: v.boolean(),
    dailyReadingReminderTime: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const clerkId = identity.subject;
    const now = Date.now();

    const existing = await ctx.db
      .query("notificationSchedules")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("notificationSchedules", {
      clerkId,
      ...args,
      sentToday: [],
      lastResetDate: new Date().toISOString().split("T")[0],
      updatedAt: now,
    });
  },
});

// ─── Get Notification Schedule for Current User ─────────────────────

export const getNotificationSchedule = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("notificationSchedules")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
  },
});

// ─── Check if user has any push subscriptions ───────────────────────

export const hasSubscription = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const sub = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    return !!sub;
  },
});

// ═════════════════════════════════════════════════════════════════════
// Internal queries/mutations (called from actions only)
// ═════════════════════════════════════════════════════════════════════

// ─── Get subscriptions by clerkId (internal) ────────────────────────

export const getSubscriptionsByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .collect();
  },
});

// ─── Remove expired subscriptions (internal) ────────────────────────

export const removeExpiredSubscriptions = internalMutation({
  args: { endpoints: v.array(v.string()) },
  handler: async (ctx, args) => {
    for (const endpoint of args.endpoints) {
      const sub = await ctx.db
        .query("pushSubscriptions")
        .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
        .first();

      if (sub) {
        await ctx.db.delete(sub._id);
      }
    }
  },
});

// ─── Get all enabled schedules (internal, for cron) ─────────────────

export const getEnabledSchedules = internalQuery({
  handler: async (ctx) => {
    // Get all notification schedules where enabled = true
    // Convex doesn't support filtering on boolean in index easily,
    // so we collect all and filter in JS
    const all = await ctx.db.query("notificationSchedules").collect();
    return all.filter((s) => s.enabled);
  },
});

// ─── Reset sentToday for a schedule (internal) ──────────────────────

export const resetSentToday = internalMutation({
  args: {
    scheduleId: v.id("notificationSchedules"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.scheduleId, {
      sentToday: [],
      lastResetDate: args.date,
    });
  },
});

// ─── Mark notifications as sent (internal) ──────────────────────────

export const markNotificationsSent = internalMutation({
  args: {
    scheduleId: v.id("notificationSchedules"),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule) return;

    const currentSent = schedule.sentToday || [];
    const updated = [...new Set([...currentSent, ...args.tags])];

    await ctx.db.patch(args.scheduleId, {
      sentToday: updated,
    });
  },
});
