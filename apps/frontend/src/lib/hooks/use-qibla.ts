import { useState, useEffect, useCallback, useRef } from 'react';

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

// Timeout for compass detection (ms)
const COMPASS_TIMEOUT = 3000;

// Smoothing factor for compass (0-1, higher = smoother but slower)
const SMOOTHING_FACTOR = 0.3;

interface QiblaState {
  qiblaDirection: number | null; // Degrees from North to Qibla
  compassHeading: number | null; // Current device heading (degrees from North)
  smoothedHeading: number | null; // Smoothed compass heading
  needsCalibration: boolean;
  loading: boolean;
  error: string | null;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unsupported' | 'unavailable';
  userLocation: { lat: number; lng: number } | null;
  compassChecked: boolean;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

// Calculate bearing from user location to Kaaba
function calculateQiblaDirection(userLat: number, userLng: number): number {
  const lat1 = toRadians(userLat);
  const lat2 = toRadians(KAABA_LAT);
  const dLng = toRadians(KAABA_LNG - userLng);

  const x = Math.sin(dLng) * Math.cos(lat2);
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  let bearing = toDegrees(Math.atan2(x, y));

  // Normalize to 0-360
  return (bearing + 360) % 360;
}

// Normalize angle to 0-360
function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

// Calculate the shortest angular distance for smoothing
function angleDifference(a: number, b: number): number {
  const diff = normalizeAngle(b - a);
  return diff > 180 ? diff - 360 : diff;
}

// Smooth angle transitions (handles wrap-around at 0/360)
function smoothAngle(current: number | null, target: number, factor: number): number {
  if (current === null) return target;

  const diff = angleDifference(current, target);
  return normalizeAngle(current + diff * factor);
}

export function useQibla() {
  const [state, setState] = useState<QiblaState>({
    qiblaDirection: null,
    compassHeading: null,
    smoothedHeading: null,
    needsCalibration: false,
    loading: true,
    error: null,
    permissionStatus: 'prompt',
    userLocation: null,
    compassChecked: false,
  });

  const isUnmountedRef = useRef(false);
  const compassTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const compassReceivedRef = useRef(false);
  const lastHeadingRef = useRef<number | null>(null);
  const orientationListenerRef = useRef<((event: DeviceOrientationEvent) => void) | null>(null);

  // Handle device orientation event
  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    if (isUnmountedRef.current) return;

    let heading: number | null = null;

    // iOS: webkitCompassHeading gives true north heading directly
    if ('webkitCompassHeading' in event && typeof (event as any).webkitCompassHeading === 'number') {
      heading = (event as any).webkitCompassHeading;
    }
    // Android/Other: Use alpha value
    // When absolute is true, alpha is relative to true north
    // When absolute is false, alpha is relative to device's initial position
    else if (event.alpha !== null) {
      // alpha: 0-360, represents rotation around z-axis
      // On most devices, we need to convert alpha to compass heading
      // Compass heading = (360 - alpha) when device is flat
      heading = normalizeAngle(360 - event.alpha);
    }

    if (heading !== null && !isNaN(heading)) {
      compassReceivedRef.current = true;

      // Clear timeout since we got compass data
      if (compassTimeoutRef.current) {
        clearTimeout(compassTimeoutRef.current);
        compassTimeoutRef.current = null;
      }

      // Apply smoothing to reduce jitter
      const smoothed = smoothAngle(lastHeadingRef.current, heading, SMOOTHING_FACTOR);
      lastHeadingRef.current = smoothed;

      setState(prev => ({
        ...prev,
        compassHeading: heading,
        smoothedHeading: smoothed,
        compassChecked: true,
        permissionStatus: 'granted',
        needsCalibration: (event as any).webkitCompassAccuracy !== undefined
          ? (event as any).webkitCompassAccuracy < 0 || (event as any).webkitCompassAccuracy > 50
          : false,
      }));
    }
  }, []);

  // Helper to add orientation listener and set timeout
  const addOrientationListener = useCallback((eventName: string) => {
    const handler = handleOrientation;
    orientationListenerRef.current = handler;
    window.addEventListener(eventName as any, handler, true);
    setState(prev => ({ ...prev, permissionStatus: 'granted' }));

    // Set timeout for compass detection
    compassTimeoutRef.current = setTimeout(() => {
      if (!compassReceivedRef.current && !isUnmountedRef.current) {
        setState(prev => ({
          ...prev,
          compassChecked: true,
          permissionStatus: 'unavailable',
        }));
      }
    }, COMPASS_TIMEOUT);
  }, [handleOrientation]);

  // Request device orientation permission (required for iOS 13+)
  const requestCompassPermission = useCallback(async () => {
    // Check for absolute orientation support (more reliable on Android)
    const hasAbsoluteOrientation = 'ondeviceorientationabsolute' in window;

    // Try to use the absolute orientation event first (more reliable on Android)
    if (hasAbsoluteOrientation) {
      addOrientationListener('deviceorientationabsolute');
      return true;
    }

    // iOS 13+ requires permission
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          addOrientationListener('deviceorientation');
          return true;
        } else {
          setState(prev => ({
            ...prev,
            permissionStatus: 'denied',
            compassChecked: true,
          }));
          return false;
        }
      } catch {
        setState(prev => ({
          ...prev,
          permissionStatus: 'denied',
          compassChecked: true,
        }));
        return false;
      }
    }

    // No permission needed, just add listener (standard deviceorientation)
    addOrientationListener('deviceorientation');
    return true;
  }, [addOrientationListener]);

  // Get user location and calculate Qibla direction
  const initializeQibla = useCallback(async () => {
    if (isUnmountedRef.current) return;

    // Reset state
    compassReceivedRef.current = false;
    lastHeadingRef.current = null;

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      compassHeading: null,
      smoothedHeading: null,
      compassChecked: false,
    }));

    // Check if geolocation is supported
    if (!('geolocation' in navigator)) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Geolocation not supported',
        compassChecked: true,
      }));
      return;
    }

    try {
      // Get user location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        });
      });

      if (isUnmountedRef.current) return;

      const { latitude, longitude } = position.coords;
      const qiblaDirection = calculateQiblaDirection(latitude, longitude);

      setState(prev => ({
        ...prev,
        qiblaDirection,
        userLocation: { lat: latitude, lng: longitude },
        loading: false,
      }));

      // Check if device orientation is supported and request permission
      if ('DeviceOrientationEvent' in window) {
        // Check if permission is needed (iOS 13+)
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
          // Will need user interaction to request permission
          setState(prev => ({ ...prev, permissionStatus: 'prompt', compassChecked: true }));
        } else {
          // No permission needed, start listening immediately
          await requestCompassPermission();
        }
      } else {
        setState(prev => ({
          ...prev,
          permissionStatus: 'unsupported',
          compassChecked: true,
        }));
      }
    } catch (error) {
      if (isUnmountedRef.current) return;

      const geoError = error as GeolocationPositionError;
      let errorMessage = 'Could not get location';

      if (geoError.code === 1) {
        errorMessage = 'Location permission denied. Please enable location access.';
      } else if (geoError.code === 2) {
        errorMessage = 'Location unavailable. Please check your GPS.';
      } else if (geoError.code === 3) {
        errorMessage = 'Location request timed out. Please try again.';
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        compassChecked: true,
      }));
    }
  }, [requestCompassPermission]);

  // Cleanup
  useEffect(() => {
    isUnmountedRef.current = false;
    compassReceivedRef.current = false;

    return () => {
      isUnmountedRef.current = true;

      // Remove orientation listeners
      if (orientationListenerRef.current) {
        window.removeEventListener('deviceorientation', orientationListenerRef.current, true);
        window.removeEventListener('deviceorientationabsolute' as any, orientationListenerRef.current, true);
      }

      if (compassTimeoutRef.current !== null) {
        clearTimeout(compassTimeoutRef.current);
      }
    };
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeQibla();
  }, [initializeQibla]);

  // Calculate the rotation for the compass needle
  // This is the angle to rotate the needle so it points to Qibla
  const getCompassRotation = useCallback(() => {
    if (state.qiblaDirection === null) return 0;

    // If we have compass data, rotate based on device heading
    if (state.smoothedHeading !== null) {
      // The needle should point to Qibla
      // qiblaDirection is the bearing from North to Qibla
      // smoothedHeading is the current device heading (which way the device is pointing)
      // We need to rotate the needle by (qiblaDirection - heading) to point to Qibla
      return normalizeAngle(state.qiblaDirection - state.smoothedHeading);
    }

    // No compass, just show the static qibla direction from north
    return state.qiblaDirection;
  }, [state.qiblaDirection, state.smoothedHeading]);

  return {
    qiblaDirection: state.qiblaDirection,
    compassHeading: state.smoothedHeading, // Return smoothed heading
    rawCompassHeading: state.compassHeading, // Raw heading for debugging
    needsCalibration: state.needsCalibration,
    loading: state.loading,
    error: state.error,
    permissionStatus: state.permissionStatus,
    userLocation: state.userLocation,
    requestCompassPermission,
    refresh: initializeQibla,
    compassRotation: getCompassRotation(),
    hasCompass: state.permissionStatus === 'granted' && state.smoothedHeading !== null,
  };
}
