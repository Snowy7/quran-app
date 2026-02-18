import { useState, useEffect, useCallback } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@template/backend";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

/**
 * Convert a URL-safe base64 string to a Uint8Array (for applicationServerKey).
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

interface UsePushSubscriptionResult {
  /** Whether the browser supports push notifications */
  isSupported: boolean;
  /** Whether the user has granted notification permission */
  isPermitted: boolean;
  /** Whether the user currently has an active push subscription on the server */
  isSubscribed: boolean;
  /** Whether an operation is in progress */
  isLoading: boolean;
  /** Subscribe to push notifications (requests permission if needed) */
  subscribe: () => Promise<boolean>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<void>;
  /** Send a test push notification via the server */
  sendTestPush: () => Promise<void>;
}

export function usePushSubscription(): UsePushSubscriptionResult {
  const { isAuthenticated } = useConvexAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isPermitted, setIsPermitted] = useState(false);

  const saveSubscription = useMutation(api.pushQueries.saveSubscription);
  const removeSubscription = useMutation(api.pushQueries.removeSubscription);
  const hasServerSub = useQuery(
    api.pushQueries.hasSubscription,
    isAuthenticated ? {} : "skip",
  );
  const sendTestAction = useAction(api.pushNotifications.sendTestPush);

  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  // Check permission on mount
  useEffect(() => {
    if (isSupported) {
      setIsPermitted(Notification.permission === "granted");
    }
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !isAuthenticated || !VAPID_PUBLIC_KEY) return false;

    setIsLoading(true);
    try {
      // Request permission if not granted
      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        setIsPermitted(permission === "granted");
        if (permission !== "granted") return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();

      // If no subscription, create one
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      // Extract keys
      const rawKeys = subscription.toJSON();
      const endpoint = subscription.endpoint;
      const p256dh = rawKeys.keys?.p256dh;
      const auth = rawKeys.keys?.auth;

      if (!endpoint || !p256dh || !auth) {
        console.error("Push subscription missing keys");
        return false;
      }

      // Send to server
      await saveSubscription({ endpoint, p256dh, auth });
      return true;
    } catch (error) {
      console.error("Failed to subscribe to push:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, isAuthenticated, saveSubscription]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!isSupported) return;

    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Remove from server
        await removeSubscription({ endpoint: subscription.endpoint });
        // Unsubscribe locally
        await subscription.unsubscribe();
      }
    } catch (error) {
      console.error("Failed to unsubscribe from push:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, removeSubscription]);

  const sendTestPush = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) return;
    try {
      await sendTestAction();
    } catch (error) {
      console.error("Failed to send test push:", error);
    }
  }, [isAuthenticated, sendTestAction]);

  return {
    isSupported,
    isPermitted,
    isSubscribed: !!hasServerSub,
    isLoading,
    subscribe,
    unsubscribe,
    sendTestPush,
  };
}
