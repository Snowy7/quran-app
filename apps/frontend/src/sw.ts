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

// Precaching - vite-plugin-pwa injects manifest here
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// quran.com API — stale-while-revalidate
registerRoute(
  ({ url }) => url.origin === "https://api.quran.com",
  new StaleWhileRevalidate({
    cacheName: "quran-api",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
      }),
    ],
  }),
);

// Quran audio CDNs — cache-first for offline playback
registerRoute(
  ({ url }) =>
    url.hostname.includes("audio.qurancdn.com") ||
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

// Google Fonts — cache-first
registerRoute(
  ({ url }) =>
    url.origin === "https://fonts.googleapis.com" ||
    url.origin === "https://fonts.gstatic.com",
  new CacheFirst({
    cacheName: "google-fonts",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
    ],
  }),
);

// Prayer Times API — network-first
registerRoute(
  ({ url }) => url.origin === "https://api.aladhan.com",
  new NetworkFirst({
    cacheName: "prayer-times",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24,
      }),
    ],
  }),
);

// Skip waiting message
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Activate — claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
