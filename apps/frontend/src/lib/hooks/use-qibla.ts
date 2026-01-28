import { useState, useEffect, useCallback, useRef } from 'react';

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

// Timeout for compass detection (ms)
const COMPASS_TIMEOUT = 3000;

interface QiblaState {
  qiblaDirection: number | null; // Degrees from North
  compassHeading: number | null; // Current compass heading
  needsCalibration: boolean;
  loading: boolean;
  error: string | null;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unsupported' | 'unavailable';
  userLocation: { lat: number; lng: number } | null;
  compassChecked: boolean; // Whether we've finished checking for compass
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

function calculateQiblaDirection(userLat: number, userLng: number): number {
  const lat1 = toRadians(userLat);
  const lat2 = toRadians(KAABA_LAT);
  const lng1 = toRadians(userLng);
  const lng2 = toRadians(KAABA_LNG);

  const dLng = lng2 - lng1;

  const x = Math.sin(dLng) * Math.cos(lat2);
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  let bearing = toDegrees(Math.atan2(x, y));

  // Normalize to 0-360
  bearing = (bearing + 360) % 360;

  return bearing;
}

export function useQibla() {
  const [state, setState] = useState<QiblaState>({
    qiblaDirection: null,
    compassHeading: null,
    needsCalibration: false,
    loading: true,
    error: null,
    permissionStatus: 'prompt',
    userLocation: null,
    compassChecked: false,
  });

  const watchIdRef = useRef<number | null>(null);
  const isUnmountedRef = useRef(false);
  const compassTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const compassReceivedRef = useRef(false);

  // Handle device orientation
  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    if (isUnmountedRef.current) return;

    // Get compass heading
    // webkitCompassHeading is available on iOS
    // alpha with absolute:true works on Android
    let heading: number | null = null;

    if ('webkitCompassHeading' in event && typeof (event as any).webkitCompassHeading === 'number') {
      heading = (event as any).webkitCompassHeading;
    } else if (event.alpha !== null) {
      // For Android, alpha is the compass heading when absolute is true
      // But it's relative to the device's initial position otherwise
      // We need to compensate based on device orientation
      heading = event.absolute ? (360 - event.alpha) : null;

      // On some devices, even without absolute, we can use alpha as a rough compass
      if (heading === null && event.alpha !== null) {
        heading = (360 - event.alpha) % 360;
      }
    }

    if (heading !== null) {
      compassReceivedRef.current = true;
      // Clear timeout since we got compass data
      if (compassTimeoutRef.current) {
        clearTimeout(compassTimeoutRef.current);
        compassTimeoutRef.current = null;
      }
      setState(prev => ({
        ...prev,
        compassHeading: heading,
        compassChecked: true,
        needsCalibration: (event as any).webkitCompassAccuracy !== undefined
          ? (event as any).webkitCompassAccuracy < 0 || (event as any).webkitCompassAccuracy > 50
          : false,
      }));
    }
  }, []);

  // Request device orientation permission (required for iOS 13+)
  const requestCompassPermission = useCallback(async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
          setState(prev => ({ ...prev, permissionStatus: 'granted' }));
          return true;
        } else {
          setState(prev => ({
            ...prev,
            permissionStatus: 'denied',
            error: 'Compass permission denied',
          }));
          return false;
        }
      } catch {
        setState(prev => ({
          ...prev,
          permissionStatus: 'denied',
          error: 'Failed to request compass permission',
        }));
        return false;
      }
    } else {
      // No permission needed, just add listener
      window.addEventListener('deviceorientation', handleOrientation, true);
      setState(prev => ({ ...prev, permissionStatus: 'granted' }));
      return true;
    }
  }, [handleOrientation]);

  // Get user location and calculate Qibla direction
  const initializeQibla = useCallback(async () => {
    if (isUnmountedRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    // Check if geolocation is supported
    if (!('geolocation' in navigator)) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Geolocation not supported',
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

      // Check if device orientation is supported
      if ('DeviceOrientationEvent' in window) {
        // Check if permission is needed (iOS 13+)
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
          setState(prev => ({ ...prev, permissionStatus: 'prompt' }));
        } else {
          // No permission needed, start listening
          window.addEventListener('deviceorientation', handleOrientation, true);
          setState(prev => ({ ...prev, permissionStatus: 'granted' }));

          // Set a timeout to check if compass data arrives
          compassTimeoutRef.current = setTimeout(() => {
            if (!compassReceivedRef.current && !isUnmountedRef.current) {
              // No compass data received, mark as unavailable
              setState(prev => ({
                ...prev,
                compassChecked: true,
                permissionStatus: 'unavailable',
              }));
            }
          }, COMPASS_TIMEOUT);
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
        errorMessage = 'Location permission denied';
      } else if (geoError.code === 2) {
        errorMessage = 'Location unavailable';
      } else if (geoError.code === 3) {
        errorMessage = 'Location request timed out';
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [handleOrientation]);

  // Cleanup
  useEffect(() => {
    isUnmountedRef.current = false;
    compassReceivedRef.current = false;

    return () => {
      isUnmountedRef.current = true;
      window.removeEventListener('deviceorientation', handleOrientation, true);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (compassTimeoutRef.current !== null) {
        clearTimeout(compassTimeoutRef.current);
      }
    };
  }, [handleOrientation]);

  // Initialize on mount
  useEffect(() => {
    initializeQibla();
  }, [initializeQibla]);

  // Get the angle to rotate the compass needle
  const getCompassRotation = useCallback(() => {
    if (state.qiblaDirection === null) return 0;
    if (state.compassHeading === null) {
      // No compass, just show the qibla direction from north
      return state.qiblaDirection;
    }
    // Rotate based on compass heading to point toward Qibla
    return state.qiblaDirection - state.compassHeading;
  }, [state.qiblaDirection, state.compassHeading]);

  return {
    ...state,
    requestCompassPermission,
    refresh: initializeQibla,
    compassRotation: getCompassRotation(),
    hasCompass: state.permissionStatus === 'granted' && state.compassHeading !== null,
  };
}
