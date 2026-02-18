import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "@/lib/db";

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface HijriDate {
  day: string;
  month: string;
  monthNumber: number;
  monthAr: string;
  year: string;
  designation: string;
  fullDate: string;
}

interface PrayerTimesState {
  times: PrayerTimes | null;
  nextPrayer: keyof PrayerTimes | null;
  countdown: string;
  loading: boolean;
  error: string | null;
  location: { city: string; country: string } | null;
  hijriDate: HijriDate | null;
  gregorianDate: string | null;
}

const PRAYER_ORDER: (keyof PrayerTimes)[] = [
  "Fajr",
  "Sunrise",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
];
const CACHE_KEY = "prayer_times_cache";

interface CachedPrayerData {
  times: PrayerTimes;
  date: string;
  location: { city: string; country: string; lat: number; lng: number };
  hijriDate: HijriDate | null;
  gregorianDate: string | null;
  fetchedAt: number;
}

function parseTime(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const now = new Date();
  now.setHours(hours, minutes, 0, 0);
  return now;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00:00";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function getNextPrayer(
  times: PrayerTimes,
): { prayer: keyof PrayerTimes; timeUntil: number } | null {
  const now = new Date();

  for (const prayer of PRAYER_ORDER) {
    const prayerTime = parseTime(times[prayer]);
    if (prayerTime > now) {
      return { prayer, timeUntil: prayerTime.getTime() - now.getTime() };
    }
  }

  // All prayers passed, next is Fajr tomorrow
  const tomorrowFajr = parseTime(times.Fajr);
  tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
  return { prayer: "Fajr", timeUntil: tomorrowFajr.getTime() - now.getTime() };
}

function getTodayDateString(): string {
  // Returns DD-MM-YYYY format as required by Aladhan API
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}-${month}-${year}`;
}

function getTodayCacheKey(): string {
  // Returns YYYY-MM-DD for cache key
  return new Date().toISOString().split("T")[0];
}

export function usePrayerTimes() {
  const [state, setState] = useState<PrayerTimesState>({
    times: null,
    nextPrayer: null,
    countdown: "",
    loading: true,
    error: null,
    location: null,
    hijriDate: null,
    gregorianDate: null,
  });

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const fetchPrayerTimes = useCallback(async (lat: number, lng: number) => {
    try {
      const today = getTodayDateString();
      const cacheKey = getTodayCacheKey();
      const method = 2; // ISNA method

      const response = await fetch(
        `https://api.aladhan.com/v1/timings/${today}?latitude=${lat}&longitude=${lng}&method=${method}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch prayer times");
      }

      const data = await response.json();
      const timings = data.data.timings;

      const times: PrayerTimes = {
        Fajr: timings.Fajr,
        Sunrise: timings.Sunrise,
        Dhuhr: timings.Dhuhr,
        Asr: timings.Asr,
        Maghrib: timings.Maghrib,
        Isha: timings.Isha,
      };

      // Extract Hijri date from API response
      const hijriData = data.data.date?.hijri;
      const gregorianData = data.data.date?.gregorian;

      const hijriDate: HijriDate | null = hijriData
        ? {
            day: hijriData.day,
            month: hijriData.month?.en || "",
            monthNumber: hijriData.month?.number || 0,
            monthAr: hijriData.month?.ar || "",
            year: hijriData.year,
            designation: hijriData.designation?.abbreviated || "AH",
            fullDate: `${hijriData.day} ${hijriData.month?.en || ""} ${hijriData.year}`,
          }
        : null;

      const gregorianDate = gregorianData
        ? `${gregorianData.day} ${gregorianData.month?.en || ""} ${gregorianData.year}`
        : null;

      // Get location name via reverse geocoding using OpenStreetMap Nominatim
      let location = { city: "Unknown", country: "" };
      try {
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
          {
            headers: {
              "Accept-Language": "en",
            },
          },
        );
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          const address = geoData.address || {};
          // Try to get city name from various fields
          const city =
            address.city ||
            address.town ||
            address.village ||
            address.municipality ||
            address.county ||
            address.state ||
            "Unknown";
          const country = address.country || "";
          location = { city, country };
        }
      } catch {
        // Ignore geocoding errors
      }

      // Cache the data
      const cacheData: CachedPrayerData = {
        times,
        date: cacheKey,
        location: { ...location, lat, lng },
        hijriDate,
        gregorianDate,
        fetchedAt: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

      return { times, location, hijriDate, gregorianDate };
    } catch (error) {
      throw error;
    }
  }, []);

  const loadFromCache = useCallback((): CachedPrayerData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data = JSON.parse(cached) as CachedPrayerData;
      const today = getTodayCacheKey();

      // Only use cache if it's from today
      if (data.date === today) {
        return data;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const updateCountdown = useCallback(() => {
    setState((prev) => {
      if (!prev.times) return prev;

      const nextInfo = getNextPrayer(prev.times);
      if (!nextInfo) return prev;

      return {
        ...prev,
        nextPrayer: nextInfo.prayer,
        countdown: formatCountdown(nextInfo.timeUntil),
      };
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // Check cache first
      const cached = loadFromCache();
      if (cached) {
        const nextInfo = getNextPrayer(cached.times);
        setState({
          times: cached.times,
          nextPrayer: nextInfo?.prayer || null,
          countdown: nextInfo ? formatCountdown(nextInfo.timeUntil) : "",
          loading: false,
          error: null,
          location: {
            city: cached.location.city,
            country: cached.location.country,
          },
          hijriDate: cached.hijriDate || null,
          gregorianDate: cached.gregorianDate || null,
        });
      }

      // Try to get current location
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            if (!mounted) return;

            try {
              const { latitude, longitude } = position.coords;
              const { times, location, hijriDate, gregorianDate } =
                await fetchPrayerTimes(latitude, longitude);

              if (!mounted) return;

              const nextInfo = getNextPrayer(times);
              setState({
                times,
                nextPrayer: nextInfo?.prayer || null,
                countdown: nextInfo ? formatCountdown(nextInfo.timeUntil) : "",
                loading: false,
                error: null,
                location,
                hijriDate,
                gregorianDate,
              });
            } catch (error) {
              if (!mounted) return;
              if (!cached) {
                setState((prev) => ({
                  ...prev,
                  loading: false,
                  error: "Failed to fetch prayer times",
                }));
              }
            }
          },
          (error) => {
            if (!mounted) return;
            if (!cached) {
              setState((prev) => ({
                ...prev,
                loading: false,
                error:
                  error.code === 1
                    ? "Location permission denied"
                    : "Could not get location",
              }));
            }
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
        );
      } else {
        if (!cached) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: "Geolocation not supported",
          }));
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [fetchPrayerTimes, loadFromCache]);

  // Update countdown every second
  useEffect(() => {
    if (!state.times) return;

    countdownIntervalRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [state.times, updateCountdown]);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const { times, location, hijriDate, gregorianDate } =
              await fetchPrayerTimes(latitude, longitude);

            const nextInfo = getNextPrayer(times);
            setState({
              times,
              nextPrayer: nextInfo?.prayer || null,
              countdown: nextInfo ? formatCountdown(nextInfo.timeUntil) : "",
              loading: false,
              error: null,
              location,
              hijriDate,
              gregorianDate,
            });
          } catch {
            setState((prev) => ({
              ...prev,
              loading: false,
              error: "Failed to fetch prayer times",
            }));
          }
        },
        (error) => {
          setState((prev) => ({
            ...prev,
            loading: false,
            error:
              error.code === 1
                ? "Location permission denied"
                : "Could not get location",
          }));
        },
      );
    }
  }, [fetchPrayerTimes]);

  return {
    ...state,
    refresh,
  };
}
