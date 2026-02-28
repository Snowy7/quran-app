import NativeAsyncStorage from "@react-native-async-storage/async-storage";

const memoryStorage = new Map<string, string>();

function isAsyncStorageUnavailable(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return (
    message.includes("Native module is null") ||
    message.includes("AsyncStorageError")
  );
}

async function withFallback<T>(
  nativeAction: () => Promise<T>,
  fallbackAction: () => T | Promise<T>,
): Promise<T> {
  try {
    return await nativeAction();
  } catch (error) {
    if (!isAsyncStorageUnavailable(error)) throw error;
    return await fallbackAction();
  }
}

const AsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    return withFallback(
      () => NativeAsyncStorage.getItem(key),
      () => memoryStorage.get(key) ?? null,
    );
  },
  async setItem(key: string, value: string): Promise<void> {
    return withFallback(
      () => NativeAsyncStorage.setItem(key, value),
      () => {
        memoryStorage.set(key, value);
      },
    );
  },
  async removeItem(key: string): Promise<void> {
    return withFallback(
      () => NativeAsyncStorage.removeItem(key),
      () => {
        memoryStorage.delete(key);
      },
    );
  },
};

export default AsyncStorage;
