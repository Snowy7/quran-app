import { useState, useRef, useEffect } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@template/ui';
import { useQibla } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { AppHeader } from '@/components/layout/app-header';


// Compass component
function QiblaCompass({
  qiblaRotation,
  hasCompass,
  deviceHeading,
}: {
  qiblaRotation: number;
  hasCompass: boolean;
  deviceHeading: number | null;
}) {
  // Track previous rotation to handle 360-degree wrap-around smoothly
  const prevRotationRef = useRef(qiblaRotation);
  const [smoothRotation, setSmoothRotation] = useState(qiblaRotation);

  useEffect(() => {
    const prev = prevRotationRef.current;
    let diff = qiblaRotation - prev;

    // Handle 360-degree wrap-around
    if (diff > 180) {
      diff -= 360;
    } else if (diff < -180) {
      diff += 360;
    }

    const newRotation = prev + diff;
    setSmoothRotation(newRotation);
    prevRotationRef.current = newRotation;
  }, [qiblaRotation]);

  const compassSize = 280;
  const centerX = compassSize / 2;
  const centerY = compassSize / 2;
  const radius = compassSize / 2 - 20;

  // Cardinal directions positions
  const cardinals = [
    { label: 'N', angle: 0 },
    { label: 'E', angle: 90 },
    { label: 'S', angle: 180 },
    { label: 'W', angle: 270 },
  ];

  // Small dot positions (between cardinals)
  const dots = [45, 135, 225, 315];

  return (
    <div className="relative" style={{ width: compassSize, height: compassSize }}>
      {/* Fixed indicator triangle at top */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-2 z-20">
        <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
          <path d="M10 0L20 16H0L10 0Z" className="fill-primary" />
        </svg>
      </div>

      {/* Compass ring */}
      <svg
        width={compassSize}
        height={compassSize}
        viewBox={`0 0 ${compassSize} ${compassSize}`}
        className="absolute inset-0"
      >
        {/* Outer ring */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
          opacity="0.6"
        />

        {/* Inner subtle ring */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius - 8}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="0.5"
          opacity="0.3"
        />
      </svg>

      {/* Cardinal directions (fixed, don't rotate) */}
      {cardinals.map(({ label, angle }) => {
        const rad = (angle - 90) * (Math.PI / 180);
        const x = centerX + (radius + 16) * Math.cos(rad);
        const y = centerY + (radius + 16) * Math.sin(rad);
        return (
          <span
            key={label}
            className="absolute text-sm font-medium text-muted-foreground"
            style={{
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {label}
          </span>
        );
      })}

      {/* Small dots between cardinals */}
      {dots.map((angle) => {
        const rad = (angle - 90) * (Math.PI / 180);
        const x = centerX + radius * Math.cos(rad);
        const y = centerY + radius * Math.sin(rad);
        return (
          <span
            key={angle}
            className="absolute w-1.5 h-1.5 rounded-full bg-muted-foreground/30"
            style={{
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}

      {/* Rotating needle and Kaaba layer */}
      <div
        className="absolute inset-0"
        style={{
          transform: `rotate(${smoothRotation}deg)`,
          transition: 'transform 0.15s ease-out',
        }}
      >
        {/* Kaaba icon at the top (Qibla direction) */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: 2 }}
        >
          <img
            src="/images/kaaba.png"
            alt="Kaaba"
            className="w-8 h-8 drop-shadow-md"
          />
        </div>

        {/* Needle */}
        <svg
          width={compassSize}
          height={compassSize}
          viewBox={`0 0 ${compassSize} ${compassSize}`}
          className="absolute inset-0"
        >
          {/* Qibla arrow - proportional diamond shape */}
          <path
            d={`M${centerX} ${centerY - 50} L${centerX + 14} ${centerY - 20} L${centerX} ${centerY - 10} L${centerX - 14} ${centerY - 20} Z`}
            className="fill-primary"
          />
          {/* Arrow highlight for depth */}
          <path
            d={`M${centerX} ${centerY - 50} L${centerX + 14} ${centerY - 20} L${centerX} ${centerY - 10} Z`}
            fill="hsl(var(--primary))"
            opacity="0.8"
          />

          {/* Stem from center to arrow */}
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX}
            y2={centerY - 10}
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Opposite side - subtle tail */}
          <path
            d={`M${centerX} ${centerY} L${centerX + 6} ${centerY + 25} L${centerX} ${centerY + 35} L${centerX - 6} ${centerY + 25} Z`}
            fill="hsl(var(--muted-foreground))"
            opacity="0.3"
          />
        </svg>
      </div>

      {/* Center dot (fixed, doesn't rotate) */}
      <div
        className="absolute w-4 h-4 rounded-full bg-primary shadow-md"
        style={{
          left: centerX,
          top: centerY,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
}

export default function QiblaPage() {
  const {
    qiblaDirection,
    compassHeading,
    compassRotation,
    hasCompass,
    needsCalibration,
    loading,
    error,
    permissionStatus,
    requestCompassPermission,
    refresh,
  } = useQibla();

  // Calculate rotation instruction
  const getRotationInstruction = () => {
    if (!hasCompass || qiblaDirection === null || compassHeading === null) return null;

    let diff = qiblaDirection - compassHeading;
    // Normalize to -180 to 180
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    const absDiff = Math.abs(diff);

    if (absDiff < 10) {
      return { text: "You're facing Qibla!", isAligned: true };
    }

    const direction = diff > 0 ? 'right' : 'left';
    return {
      text: `Rotate the phone ${Math.round(absDiff)}° to the ${direction}`,
      isAligned: false,
    };
  };

  const instruction = getRotationInstruction();

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Gradient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.08) 0%, transparent 60%)',
        }}
      />

      <AppHeader title="Qibla Finder" showSearch={false} />

      <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] px-4">
        {/* Error State */}
        {error && !qiblaDirection && (
          <div className="text-center animate-fade-in">
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
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-10 h-10 text-primary animate-spin" />
            </div>
            <p className="text-muted-foreground">Finding Qibla direction...</p>
          </div>
        )}

        {/* Compass */}
        {qiblaDirection !== null && (
          <div className="flex flex-col items-center animate-fade-in">
            {/* Permission prompt for iOS */}
            {permissionStatus === 'prompt' && (
              <div className="text-center mb-6">
                <Button onClick={() => requestCompassPermission()} variant="outline">
                  Enable Compass
                </Button>
              </div>
            )}

            {/* Calibration warning */}
            {needsCalibration && (
              <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-full mb-6 text-sm">
                Move your device in a figure-8 to calibrate
              </div>
            )}

            {/* Compass display */}
            <QiblaCompass
              qiblaRotation={compassRotation}
              hasCompass={hasCompass}
              deviceHeading={compassHeading}
            />

            {/* Direction info */}
            <div className="mt-8 text-center">
              <p className="text-5xl font-light tracking-tight">
                {Math.round(qiblaDirection)}°
              </p>
              <p className="text-muted-foreground mt-1">
                {hasCompass ? "Device's angle to Qibla" : 'Qibla direction from North'}
              </p>
            </div>

            {/* Rotation instruction */}
            {instruction && hasCompass && (
              <div className="mt-6 w-full max-w-xs">
                <div
                  className={cn(
                    'px-5 py-3 rounded-full text-center text-sm font-medium transition-all duration-300',
                    instruction.isAligned
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-primary/10 text-primary'
                  )}
                >
                  {instruction.text}
                </div>
              </div>
            )}

            {/* Compass status when no compass */}
            {!hasCompass && permissionStatus !== 'prompt' && (
              <div className="mt-6 p-4 rounded-2xl bg-secondary/50 text-center max-w-xs">
                <p className="text-sm text-muted-foreground">
                  {permissionStatus === 'unsupported' || permissionStatus === 'unavailable'
                    ? 'Live compass not available on this device'
                    : permissionStatus === 'denied'
                      ? 'Compass permission denied'
                      : 'Checking compass...'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Face {Math.round(qiblaDirection)}° from North to face Qibla
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="fixed bottom-24 left-0 right-0 text-center text-xs text-muted-foreground">
        <p>Direction to Masjid al-Haram, Mecca</p>
      </div>
    </div>
  );
}
