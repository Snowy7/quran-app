import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, RefreshCw, Navigation } from 'lucide-react';
import { Button } from '@template/ui';
import { useQibla } from '@/lib/hooks';
import { cn } from '@/lib/utils';

// Kaaba icon
function KaabaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      {/* Kaaba cube */}
      <rect x="8" y="10" width="16" height="16" fill="currentColor" rx="1" />
      {/* Kiswah (cloth) decoration */}
      <rect x="8" y="14" width="16" height="3" fill="currentColor" opacity="0.7" />
      {/* Gold band */}
      <rect x="8" y="13" width="16" height="2" fill="currentColor" opacity="0.9" />
      {/* Door */}
      <rect x="14" y="18" width="4" height="8" fill="currentColor" opacity="0.5" rx="0.5" />
    </svg>
  );
}

// Compass needle pointing to Qibla
function QiblaCompass({ rotation, hasCompass }: { rotation: number; hasCompass: boolean }) {
  return (
    <div className="relative w-72 h-72">
      {/* Outer ring */}
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Compass background */}
        <circle cx="100" cy="100" r="95" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />

        {/* Degree markers */}
        {Array.from({ length: 72 }).map((_, i) => {
          const angle = i * 5;
          const isMajor = angle % 30 === 0;
          const isCardinal = angle % 90 === 0;
          const r1 = isCardinal ? 80 : isMajor ? 85 : 88;
          const r2 = 92;
          const x1 = 100 + r1 * Math.sin((angle * Math.PI) / 180);
          const y1 = 100 - r1 * Math.cos((angle * Math.PI) / 180);
          const x2 = 100 + r2 * Math.sin((angle * Math.PI) / 180);
          const y2 = 100 - r2 * Math.cos((angle * Math.PI) / 180);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={isCardinal ? 2 : isMajor ? 1.5 : 0.5}
              opacity={isCardinal ? 1 : isMajor ? 0.7 : 0.4}
            />
          );
        })}

        {/* Cardinal directions */}
        <text x="100" y="25" textAnchor="middle" className="fill-foreground text-xs font-semibold">N</text>
        <text x="175" y="103" textAnchor="middle" className="fill-muted-foreground text-xs">E</text>
        <text x="100" y="183" textAnchor="middle" className="fill-muted-foreground text-xs">S</text>
        <text x="25" y="103" textAnchor="middle" className="fill-muted-foreground text-xs">W</text>
      </svg>

      {/* Rotating needle layer */}
      <div
        className="absolute inset-0 transition-transform duration-300 ease-out"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Qibla direction indicator */}
          <g>
            {/* Arrow pointing up (north), will be rotated to Qibla */}
            <path
              d="M100 25 L108 60 L100 55 L92 60 Z"
              className="fill-primary"
            />
            {/* Kaaba icon at the tip */}
            <g transform="translate(88, 8)">
              <rect x="0" y="0" width="24" height="20" rx="2" className="fill-primary" />
              <rect x="0" y="4" width="24" height="4" className="fill-primary" opacity="0.7" />
              <rect x="9" y="10" width="6" height="10" rx="1" className="fill-primary" opacity="0.5" />
            </g>
          </g>

          {/* Center dot */}
          <circle cx="100" cy="100" r="4" className="fill-primary" />
        </svg>
      </div>

      {/* Center overlay with Qibla label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <KaabaIcon className="w-8 h-8 mx-auto mb-1 text-primary" />
          <p className="text-xs font-medium text-muted-foreground">Qibla</p>
        </div>
      </div>
    </div>
  );
}

export default function QiblaPage() {
  const {
    qiblaDirection,
    compassRotation,
    hasCompass,
    needsCalibration,
    loading,
    error,
    permissionStatus,
    userLocation,
    requestCompassPermission,
    refresh,
  } = useQibla();

  return (
    <div className="page-container">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 -ml-2 rounded-lg hover:bg-secondary">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-semibold">Qibla Compass</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refresh()}
            disabled={loading}
            className="h-9 w-9"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] px-4">
        {/* Error State */}
        {error && !qiblaDirection && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-10 h-10 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Location Required</h2>
            <p className="text-muted-foreground mb-4 max-w-xs">{error}</p>
            <Button onClick={() => refresh()}>
              Enable Location
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && !qiblaDirection && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Navigation className="w-10 h-10 text-primary" />
            </div>
            <p className="text-muted-foreground">Finding Qibla direction...</p>
          </div>
        )}

        {/* Compass */}
        {qiblaDirection !== null && (
          <>
            {/* Permission prompt for iOS */}
            {permissionStatus === 'prompt' && (
              <div className="text-center mb-8">
                <p className="text-muted-foreground mb-4">
                  Enable compass for live direction tracking
                </p>
                <Button onClick={() => requestCompassPermission()}>
                  Enable Compass
                </Button>
              </div>
            )}

            {/* Calibration warning */}
            {needsCalibration && (
              <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-lg mb-4 text-sm">
                Move your device in a figure-8 pattern to calibrate the compass
              </div>
            )}

            {/* Compass display */}
            <QiblaCompass rotation={compassRotation} hasCompass={hasCompass} />

            {/* Direction info */}
            <div className="mt-6 text-center">
              <p className="text-2xl font-semibold">
                {Math.round(qiblaDirection)}°
              </p>
              <p className="text-muted-foreground">
                {hasCompass ? 'Point the arrow toward Qibla' : 'Qibla direction from North'}
              </p>
            </div>

            {/* Location info */}
            {userLocation && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>
                  {userLocation.lat.toFixed(4)}°, {userLocation.lng.toFixed(4)}°
                </span>
              </div>
            )}

            {/* Compass status */}
            {!hasCompass && permissionStatus !== 'prompt' && (
              <p className="mt-4 text-xs text-muted-foreground text-center max-w-xs">
                {permissionStatus === 'unsupported'
                  ? 'Compass not supported on this device. The direction shown is from North.'
                  : permissionStatus === 'denied'
                    ? 'Compass permission denied. The direction shown is from North.'
                    : 'Waiting for compass data...'}
              </p>
            )}
          </>
        )}
      </div>

      {/* Info footer */}
      <div className="px-4 py-6 text-center text-xs text-muted-foreground">
        <p>Direction to Masjid al-Haram, Mecca</p>
        <p>21.4225° N, 39.8262° E</p>
      </div>
    </div>
  );
}
