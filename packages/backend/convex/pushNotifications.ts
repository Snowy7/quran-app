"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import webpush from "web-push";

// ─── Types ──────────────────────────────────────────────────────────

interface PushPayload {
  title: string;
  body: string;
  tag: string;
  url?: string;
  icon?: string;
  badge?: string;
}

// ─── Web Push Setup ─────────────────────────────────────────────────

function getVapidKeys() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID keys not set. Run: npx convex env set VAPID_PUBLIC_KEY <key> && npx convex env set VAPID_PRIVATE_KEY <key>",
    );
  }

  return { publicKey, privateKey };
}

// ─── Send Push to a Single Subscription ─────────────────────────────

export const sendPushToSubscription = internalAction({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    payload: v.object({
      title: v.string(),
      body: v.string(),
      tag: v.string(),
      url: v.optional(v.string()),
      icon: v.optional(v.string()),
      badge: v.optional(v.string()),
    }),
  },
  handler: async (_ctx, args) => {
    const { publicKey, privateKey } = getVapidKeys();

    webpush.setVapidDetails(
      "mailto:noor-app@example.com",
      publicKey,
      privateKey,
    );

    const subscription = {
      endpoint: args.endpoint,
      keys: {
        p256dh: args.p256dh,
        auth: args.auth,
      },
    };

    const payload: PushPayload = {
      title: args.payload.title,
      body: args.payload.body,
      tag: args.payload.tag,
      url: args.payload.url || "/",
      icon: args.payload.icon || "/icons/icon-192x192.png",
      badge: args.payload.badge || "/icons/icon-96x96.png",
    };

    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      return { success: true };
    } catch (error: any) {
      // 410 Gone or 404 means the subscription is expired/invalid
      if (error.statusCode === 410 || error.statusCode === 404) {
        return { success: false, expired: true, statusCode: error.statusCode };
      }
      console.error("Push send failed:", error.statusCode, error.body);
      return { success: false, expired: false, statusCode: error.statusCode };
    }
  },
});

// ─── Send Push to All Subscriptions for a User ──────────────────────

export const sendPushToUser = internalAction({
  args: {
    clerkId: v.string(),
    payload: v.object({
      title: v.string(),
      body: v.string(),
      tag: v.string(),
      url: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // We need to query the database from within an action — use internal query
    const subscriptions = await ctx.runQuery(
      internal.pushQueries.getSubscriptionsByClerkId,
      { clerkId: args.clerkId },
    );

    if (!subscriptions || subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;
    const expiredEndpoints: string[] = [];

    for (const sub of subscriptions) {
      try {
        const result = await ctx.runAction(
          internal.pushNotifications.sendPushToSubscription,
          {
            endpoint: sub.endpoint,
            p256dh: sub.p256dh,
            auth: sub.auth,
            payload: args.payload,
          },
        );

        if (result.success) {
          sent++;
        } else {
          failed++;
          if (result.expired) {
            expiredEndpoints.push(sub.endpoint);
          }
        }
      } catch {
        failed++;
      }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await ctx.runMutation(internal.pushQueries.removeExpiredSubscriptions, {
        endpoints: expiredEndpoints,
      });
    }

    return { sent, failed };
  },
});

// ─── Process Scheduled Notifications (called by cron) ───────────────

export const processScheduledNotifications = internalAction({
  handler: async (ctx) => {
    // Get all enabled notification schedules
    const schedules = await ctx.runQuery(
      internal.pushQueries.getEnabledSchedules,
    );

    if (!schedules || schedules.length === 0) return;

    const nowUtc = Date.now();

    for (const schedule of schedules) {
      // Calculate the user's local time
      // timezoneOffset is in minutes, negative means ahead of UTC (e.g., UTC+3 = -180)
      const userLocalMs = nowUtc - schedule.timezoneOffset * 60_000;
      const userLocalDate = new Date(userLocalMs);
      const userHH = userLocalDate.getUTCHours().toString().padStart(2, "0");
      const userMM = userLocalDate.getUTCMinutes().toString().padStart(2, "0");
      const userTimeStr = `${userHH}:${userMM}`;
      const userDateStr = userLocalDate.toISOString().split("T")[0];

      // Reset sentToday if it's a new day
      let sentToday = schedule.sentToday || [];
      if (schedule.lastResetDate !== userDateStr) {
        sentToday = [];
        await ctx.runMutation(internal.pushQueries.resetSentToday, {
          scheduleId: schedule._id,
          date: userDateStr,
        });
      }

      if (!schedule.prayerTimes) continue;

      const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
      const prayerDisplayNames: Record<string, string> = {
        Fajr: "Fajr",
        Dhuhr: "Dhuhr",
        Asr: "Asr",
        Maghrib: "Maghrib",
        Isha: "Isha",
      };

      const notificationsToSend: Array<{
        tag: string;
        title: string;
        body: string;
        url: string;
      }> = [];

      for (const prayer of prayers) {
        const prayerTimeStr =
          schedule.prayerTimes[prayer as keyof typeof schedule.prayerTimes];
        if (!prayerTimeStr) continue;

        const [pH, pM] = prayerTimeStr.split(":").map(Number);
        const prayerMinutes = pH * 60 + pM;
        const currentMinutes =
          userLocalDate.getUTCHours() * 60 + userLocalDate.getUTCMinutes();

        // Before prayer time notification
        if (schedule.beforePrayerTime && schedule.beforeMinutes > 0) {
          const beforeMinutes = prayerMinutes - schedule.beforeMinutes;
          const tag = `before-${prayer}`;
          if (
            currentMinutes >= beforeMinutes &&
            currentMinutes < beforeMinutes + 2 &&
            !sentToday.includes(tag)
          ) {
            notificationsToSend.push({
              tag,
              title: `${prayerDisplayNames[prayer]} in ${schedule.beforeMinutes} min`,
              body: `${prayerDisplayNames[prayer]} prayer is coming up soon`,
              url: "/prayer-times",
            });
          }
        }

        // At prayer time notification
        if (schedule.atPrayerTime) {
          const tag = `at-${prayer}`;
          if (
            currentMinutes >= prayerMinutes &&
            currentMinutes < prayerMinutes + 2 &&
            !sentToday.includes(tag)
          ) {
            notificationsToSend.push({
              tag,
              title: `${prayerDisplayNames[prayer]} Prayer Time`,
              body: `It's time for ${prayerDisplayNames[prayer]} prayer`,
              url: "/prayer-times",
            });
          }
        }

        // Reminder after prayer time
        if (schedule.reminderAfter && schedule.reminderMinutes > 0) {
          const afterMinutes = prayerMinutes + schedule.reminderMinutes;
          const tag = `after-${prayer}`;
          if (
            currentMinutes >= afterMinutes &&
            currentMinutes < afterMinutes + 2 &&
            !sentToday.includes(tag)
          ) {
            notificationsToSend.push({
              tag,
              title: `${prayerDisplayNames[prayer]} Prayer Reminder`,
              body: `${schedule.reminderMinutes} minutes since ${prayerDisplayNames[prayer]}. Have you prayed?`,
              url: "/prayer-times",
            });
          }
        }
      }

      // Daily reading reminder
      if (schedule.dailyReadingReminder && schedule.dailyReadingReminderTime) {
        const [rH, rM] = schedule.dailyReadingReminderTime
          .split(":")
          .map(Number);
        const readingMinutes = rH * 60 + rM;
        const currentMinutes =
          userLocalDate.getUTCHours() * 60 + userLocalDate.getUTCMinutes();
        const tag = "daily-reading";

        if (
          currentMinutes >= readingMinutes &&
          currentMinutes < readingMinutes + 2 &&
          !sentToday.includes(tag)
        ) {
          notificationsToSend.push({
            tag,
            title: "Daily Quran Reminder",
            body: "Take a moment to read Quran today",
            url: "/quran",
          });
        }
      }

      // Send all notifications for this user
      const sentTags: string[] = [];
      for (const notif of notificationsToSend) {
        try {
          await ctx.runAction(internal.pushNotifications.sendPushToUser, {
            clerkId: schedule.clerkId,
            payload: {
              title: notif.title,
              body: notif.body,
              tag: notif.tag,
              url: notif.url,
            },
          });
          sentTags.push(notif.tag);
        } catch (e) {
          console.error(
            `Failed to send ${notif.tag} to ${schedule.clerkId}:`,
            e,
          );
        }
      }

      // Record which notifications were sent
      if (sentTags.length > 0) {
        await ctx.runMutation(internal.pushQueries.markNotificationsSent, {
          scheduleId: schedule._id,
          tags: sentTags,
        });
      }
    }
  },
});

// ─── Test Push (callable from frontend) ─────────────────────────────

export const sendTestPush = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.runAction(internal.pushNotifications.sendPushToUser, {
      clerkId: identity.subject,
      payload: {
        title: "Noor — Test Notification",
        body: "Push notifications are working correctly!",
        tag: "test-notification",
        url: "/settings",
      },
    });

    return { success: true };
  },
});
