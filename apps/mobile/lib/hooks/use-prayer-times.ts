import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Coordinates,
  PrayerTimes,
  CalculationMethod,
  type CalculationParameters,
} from "adhan";
import * as Location from "expo-location";
import AsyncStorage from "../storage/async-storage";
import { schedulePrayerNotifications } from "../notifications/prayer-notifications";

// ---- Public Types ----

export interface PrayerTimeEntry {
  name: PrayerName;
  time: Date;
}

export type PrayerName =
  | "Fajr"
  | "Sunrise"
  | "Dhuhr"
  | "Asr"
  | "Maghrib"
  | "Isha";

export interface HijriDate {
  day: string;
  month: string;
  year: string;
  fullDate: string;
}

export interface LocationInfo {
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export interface PrayerTimesResult {
  prayers: PrayerTimeEntry[];
  nextPrayer: PrayerName | null;
  nextPrayerTime: Date | null;
  countdown: string;
  loading: boolean;
  error: string | null;
  location: LocationInfo | null;
  hijriDate: HijriDate | null;
  gregorianDate: string;
  refresh: () => void;
}

// ---- Constants ----

const LOCATION_CACHE_KEY = "noor_cached_location";

// ---- Calculation Method Auto-Detection ----

function autoDetectMethod(lat: number, lng: number): CalculationParameters {
  // North America
  if (lng < -30 && lat > 15) return CalculationMethod.NorthAmerica();
  // Turkey
  if (lat > 36 && lat < 42 && lng > 26 && lng < 45)
    return CalculationMethod.Turkey();
  // Saudi Arabia / Gulf
  if (lat > 12 && lat < 35 && lng > 35 && lng < 60)
    return CalculationMethod.UmmAlQura();
  // Egypt
  if (lat > 22 && lat < 32 && lng > 24 && lng < 37)
    return CalculationMethod.Egyptian();
  // Pakistan / India / Bangladesh
  if (lat > 5 && lat < 40 && lng > 60 && lng < 95)
    return CalculationMethod.Karachi();
  // Southeast Asia
  if (lat > -15 && lat < 15 && lng > 95 && lng < 145)
    return CalculationMethod.Singapore();
  // Default: Muslim World League (Europe, Africa, etc.)
  return CalculationMethod.MuslimWorldLeague();
}

// ---- Local Prayer Time Calculation ----

function calculatePrayers(
  lat: number,
  lng: number,
  date: Date,
): PrayerTimeEntry[] {
  const coordinates = new Coordinates(lat, lng);
  const params = autoDetectMethod(lat, lng);
  const pt = new PrayerTimes(coordinates, date, params);

  return [
    { name: "Fajr", time: pt.fajr },
    { name: "Sunrise", time: pt.sunrise },
    { name: "Dhuhr", time: pt.dhuhr },
    { name: "Asr", time: pt.asr },
    { name: "Maghrib", time: pt.maghrib },
    { name: "Isha", time: pt.isha },
  ];
}

function findNextPrayer(
  prayers: PrayerTimeEntry[],
): { name: PrayerName; time: Date } | null {
  const now = new Date();

  for (const p of prayers) {
    if (p.time > now) {
      return { name: p.name, time: p.time };
    }
  }

  // All passed - next is Fajr tomorrow
  const fajrToday = prayers[0];
  if (fajrToday) {
    const fajrTomorrow = new Date(fajrToday.time);
    fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);
    return { name: "Fajr", time: fajrTomorrow };
  }

  return null;
}

// ---- Hijri Date (built-in Intl) ----

function getHijriDate(): HijriDate {
  const now = new Date();

  try {
    const dayFmt = new Intl.DateTimeFormat("en-u-ca-islamic", {
      day: "numeric",
    });
    const monthFmt = new Intl.DateTimeFormat("en-u-ca-islamic", {
      month: "long",
    });
    const yearFmt = new Intl.DateTimeFormat("en-u-ca-islamic", {
      year: "numeric",
    });
    const fullFmt = new Intl.DateTimeFormat("en-u-ca-islamic", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const day = dayFmt.format(now);
    const month = monthFmt.format(now);
    const year = yearFmt.format(now).replace(/\s*AH$/, "");
    const fullDate = fullFmt.format(now);

    return { day, month, year, fullDate };
  } catch {
    return { day: "", month: "", year: "", fullDate: "" };
  }
}

function getGregorianDate(): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

// ---- Countdown Formatting ----

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00:00";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// ---- Location Caching ----

interface CachedLocation {
  lat: number;
  lng: number;
  city: string;
  country: string;
  cachedAt: number;
}

async function getCachedLocation(): Promise<CachedLocation | null> {
  try {
    const raw = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CachedLocation;
    // Cache valid for 7 days
    if (Date.now() - data.cachedAt > 7 * 24 * 60 * 60 * 1000) return null;
    return data;
  } catch {
    return null;
  }
}

async function setCachedLocation(loc: CachedLocation): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(loc));
  } catch {
    // Ignore storage errors
  }
}

// ---- Reverse Geocoding ----

async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ city: string; country: string }> {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });
    if (results.length > 0) {
      const result = results[0];
      return {
        city: result.city ?? result.region ?? "Unknown",
        country: result.country ?? "",
      };
    }
    return { city: "Unknown", country: "" };
  } catch {
    return { city: "Unknown", country: "" };
  }
}

// ---- Hook ----

export function usePrayerTimes(): PrayerTimesResult {
  const [prayers, setPrayers] = useState<PrayerTimeEntry[]>([]);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState("");
  const [nextPrayerInfo, setNextPrayerInfo] = useState<{
    name: PrayerName;
    time: Date;
  } | null>(null);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const hijriDate = useMemo(() => getHijriDate(), []);
  const gregorianDate = useMemo(() => getGregorianDate(), []);

  const computePrayers = useCallback((lat: number, lng: number) => {
    const today = new Date();
    const computed = calculatePrayers(lat, lng, today);
    const next = findNextPrayer(computed);

    setPrayers(computed);
    setNextPrayerInfo(next);
    if (next) {
      setCountdown(formatCountdown(next.time.getTime() - Date.now()));
    }
    setLoading(false);
    setError(null);
  }, []);

  const resolveLocation = useCallback(async (lat: number, lng: number) => {
    // Check if cached location matches (within ~1km)
    const cached = await getCachedLocation();
    if (
      cached &&
      Math.abs(cached.lat - lat) < 0.01 &&
      Math.abs(cached.lng - lng) < 0.01
    ) {
      setLocation({ lat, lng, city: cached.city, country: cached.country });
      return;
    }

    const { city, country } = await reverseGeocode(lat, lng);
    const loc: LocationInfo = { lat, lng, city, country };
    setLocation(loc);
    await setCachedLocation({ lat, lng, city, country, cachedAt: Date.now() });
  }, []);

  const init = useCallback(async () => {
    // 1. Try cached location for instant prayer times
    const cached = await getCachedLocation();
    if (cached) {
      computePrayers(cached.lat, cached.lng);
      setLocation({
        lat: cached.lat,
        lng: cached.lng,
        city: cached.city,
        country: cached.country,
      });
    }

    // 2. Request fresh geolocation
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (!cached) {
          setLoading(false);
          setError(
            "Location permission denied. Please enable location access.",
          );
        }
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!mountedRef.current) return;
      const { latitude, longitude } = position.coords;
      computePrayers(latitude, longitude);
      resolveLocation(latitude, longitude);
      // Schedule prayer notifications in background
      schedulePrayerNotifications(latitude, longitude).catch(() => {});
    } catch {
      if (!mountedRef.current) return;
      if (!cached) {
        setLoading(false);
        setError("Could not determine your location.");
      }
    }
  }, [computePrayers, resolveLocation]);

  // Initialize on mount
  useEffect(() => {
    mountedRef.current = true;
    init();
    return () => {
      mountedRef.current = false;
    };
  }, [init]);

  // Countdown timer
  useEffect(() => {
    if (!nextPrayerInfo) return;

    const tick = () => {
      const remaining = nextPrayerInfo.time.getTime() - Date.now();
      if (remaining <= 0) {
        // Prayer time reached - recalculate
        if (location) {
          computePrayers(location.lat, location.lng);
        }
        return;
      }
      setCountdown(formatCountdown(remaining));
    };

    tick();
    countdownRef.current = setInterval(tick, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [nextPrayerInfo, location, computePrayers]);

  return {
    prayers,
    nextPrayer: nextPrayerInfo?.name ?? null,
    nextPrayerTime: nextPrayerInfo?.time ?? null,
    countdown,
    loading,
    error,
    location,
    hijriDate,
    gregorianDate,
    refresh: init,
  };
}
