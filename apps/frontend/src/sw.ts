/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  CacheFirst,
  StaleWhileRevalidate,
  NetworkFirst,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare let self: ServiceWorkerGlobalScope;

// ─── Workbox Precaching ─────────────────────────────────────────────
// vite-plugin-pwa injects the precache manifest here
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ─── Runtime Caching ────────────────────────────────────────────────

// Google Fonts stylesheets — stale-while-revalidate
registerRoute(
  ({ url }) => url.origin === "https://fonts.googleapis.com",
  new StaleWhileRevalidate({
    cacheName: "google-fonts-stylesheets",
  }),
);

// Google Fonts webfonts — cache-first (long-lived)
registerRoute(
  ({ url }) => url.origin === "https://fonts.gstatic.com",
  new CacheFirst({
    cacheName: "google-fonts-webfonts",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
    ],
  }),
);

// Aladhan Prayer Times API — network-first with short cache
registerRoute(
  ({ url }) => url.origin === "https://api.aladhan.com",
  new NetworkFirst({
    cacheName: "prayer-times-api",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24, // 1 day
      }),
    ],
  }),
);

// Quran audio CDN (everyayah.com, quranicaudio.com, etc.) — cache-first
registerRoute(
  ({ url }) =>
    url.hostname.includes("everyayah.com") ||
    url.hostname.includes("quranicaudio.com") ||
    url.hostname.includes("cdn.islamic.network"),
  new CacheFirst({
    cacheName: "quran-audio",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 500,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  }),
);

// OpenStreetMap Nominatim (reverse geocoding) — stale-while-revalidate
registerRoute(
  ({ url }) => url.hostname.includes("nominatim.openstreetmap.org"),
  new StaleWhileRevalidate({
    cacheName: "geocoding-api",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 5,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
      }),
    ],
  }),
);

// ─── Web Push Event Handler ─────────────────────────────────────────
// This is fired by the browser when the server sends a push message.
// It works even when the app is completely closed.
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload: {
    title?: string;
    body?: string;
    tag?: string;
    url?: string;
    icon?: string;
    badge?: string;
  };

  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Noor", body: event.data.text() };
  }

  const title = payload.title || "Noor";
  const options: NotificationOptions = {
    body: payload.body || "",
    icon: payload.icon || "/icons/icon-192x192.png",
    badge: payload.badge || "/icons/icon-96x96.png",
    tag: payload.tag || "noor-push",
    data: { url: payload.url || "/" },
    requireInteraction: true,
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification Click Handler ─────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }
        // Otherwise open new window
        return self.clients.openWindow(urlToOpen);
      }),
  );
});

// ─── Scheduled Notification Checker ─────────────────────────────────
// We store scheduled notifications in localStorage (via main thread message)
// and check them periodically using a self-waking mechanism.

interface ScheduledNotif {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  tag: string;
  url?: string;
  fired?: boolean;
}

const STORAGE_KEY = "noor_scheduled_notifications";
const CHECK_INTERVAL_MS = 30_000; // Check every 30 seconds

// Read scheduled notifications from cache (we use a message-based approach)
let cachedSchedule: ScheduledNotif[] = [];

// Listen for messages from the main thread
self.addEventListener("message", (event) => {
  if (event.data?.type === "SCHEDULE_NOTIFICATIONS") {
    cachedSchedule = event.data.notifications as ScheduledNotif[];
    // Start the check loop if not already running
    startCheckLoop();
  }

  if (event.data?.type === "CLEAR_NOTIFICATIONS") {
    cachedSchedule = [];
  }

  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

let checkLoopRunning = false;

function startCheckLoop() {
  if (checkLoopRunning) return;
  checkLoopRunning = true;
  checkAndFire();
}

async function checkAndFire() {
  const now = Date.now();
  let anyPending = false;

  for (const notif of cachedSchedule) {
    if (notif.fired) continue;

    if (notif.timestamp <= now) {
      // Fire this notification
      try {
        await self.registration.showNotification(notif.title, {
          body: notif.body,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-96x96.png",
          tag: notif.tag,
          data: { url: notif.url || "/" },
          requireInteraction: true,
          silent: false,
        });
      } catch (e) {
        console.error("Failed to show notification:", e);
      }
      notif.fired = true;
    } else {
      anyPending = true;
    }
  }

  // If there are still pending notifications, schedule another check
  if (anyPending) {
    setTimeout(checkAndFire, CHECK_INTERVAL_MS);
  } else {
    checkLoopRunning = false;
  }
}

// ─── Periodic Background Sync (if supported) ────────────────────────
// This allows the SW to wake up periodically even when the app is closed.
// Not all browsers support this, but Chrome on Android does.
self.addEventListener("periodicsync", (event: any) => {
  if (event.tag === "check-prayer-notifications") {
    event.waitUntil(checkAndFire());
  }
});

// ─── Regular Sync (fallback) ────────────────────────────────────────
self.addEventListener("sync", (event: any) => {
  if (event.tag === "check-prayer-notifications") {
    event.waitUntil(checkAndFire());
  }
});

// ─── Activate — claim clients immediately ────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
