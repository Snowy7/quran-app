import { Link } from 'react-router-dom';
import { Play, BookOpen } from 'lucide-react';
import { Button } from '@template/ui';
import { getSurahById } from '@/data/surahs';

interface HeroCardProps {
  lastSurahId: number;
  lastAyahNumber: number;
}

// Mosque silhouette SVG component
function MosqueSilhouette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMax slice"
    >
      {/* Sky gradient overlay */}
      <defs>
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="url(#skyGradient)" />

      {/* Stars */}
      <circle cx="50" cy="30" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="120" cy="50" r="1" fill="currentColor" opacity="0.3" />
      <circle cx="200" cy="25" r="1.5" fill="currentColor" opacity="0.5" />
      <circle cx="280" cy="45" r="1" fill="currentColor" opacity="0.3" />
      <circle cx="350" cy="35" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="80" cy="70" r="1" fill="currentColor" opacity="0.2" />
      <circle cx="320" cy="60" r="1" fill="currentColor" opacity="0.3" />

      {/* Crescent moon */}
      <path
        d="M340 40c-8 0-14.5-6.5-14.5-14.5S332 11 340 11c1.5 0 2.9.2 4.3.6-3.2 1.8-5.3 5.2-5.3 9.1s2.1 7.3 5.3 9.1c-1.4.4-2.8.6-4.3.6z"
        fill="currentColor"
        opacity="0.6"
      />

      {/* Main mosque - center dome */}
      <path
        d="M200 120 Q200 70 160 100 L160 200 L240 200 L240 100 Q200 70 200 120"
        fill="currentColor"
        opacity="0.2"
      />
      {/* Main dome */}
      <ellipse cx="200" cy="100" rx="40" ry="30" fill="currentColor" opacity="0.25" />

      {/* Center minaret (tallest) */}
      <rect x="195" y="50" width="10" height="70" fill="currentColor" opacity="0.3" />
      <circle cx="200" cy="50" r="8" fill="currentColor" opacity="0.25" />
      <path d="M200 30 L195 50 L205 50 Z" fill="currentColor" opacity="0.3" />

      {/* Left minaret */}
      <rect x="130" y="80" width="8" height="50" fill="currentColor" opacity="0.2" />
      <circle cx="134" cy="80" r="6" fill="currentColor" opacity="0.2" />
      <path d="M134 65 L130 80 L138 80 Z" fill="currentColor" opacity="0.2" />

      {/* Right minaret */}
      <rect x="262" y="80" width="8" height="50" fill="currentColor" opacity="0.2" />
      <circle cx="266" cy="80" r="6" fill="currentColor" opacity="0.2" />
      <path d="M266 65 L262 80 L270 80 Z" fill="currentColor" opacity="0.2" />

      {/* Side buildings */}
      <rect x="80" y="130" width="60" height="70" fill="currentColor" opacity="0.15" />
      <ellipse cx="110" cy="130" rx="30" ry="20" fill="currentColor" opacity="0.15" />

      <rect x="260" y="130" width="60" height="70" fill="currentColor" opacity="0.15" />
      <ellipse cx="290" cy="130" rx="30" ry="20" fill="currentColor" opacity="0.15" />

      {/* Far buildings silhouette */}
      <rect x="20" y="150" width="40" height="50" fill="currentColor" opacity="0.1" />
      <rect x="340" y="150" width="40" height="50" fill="currentColor" opacity="0.1" />

      {/* Ground line */}
      <rect x="0" y="195" width="400" height="5" fill="currentColor" opacity="0.1" />
    </svg>
  );
}

export function HeroCard({ lastSurahId, lastAyahNumber }: HeroCardProps) {
  const lastSurah = getSurahById(lastSurahId);

  if (!lastSurah) {
    return (
      <Link to="/quran" className="block">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25">
          {/* Atmospheric glow */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl" />
          </div>
          <MosqueSilhouette className="absolute inset-0 w-full h-full text-primary-foreground" />
          <div className="relative z-10 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm opacity-80 mb-1">Start Reading</p>
                <p className="text-xl font-semibold mb-1">Begin Your Journey</p>
                <p className="text-sm opacity-80">Open the Quran</p>
              </div>
              <Button
                size="icon"
                variant="secondary"
                className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white shrink-0 backdrop-blur-sm"
              >
                <BookOpen className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/quran/${lastSurahId}`} className="block">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25">
        {/* Atmospheric glow effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl" />
        </div>
        <MosqueSilhouette className="absolute inset-0 w-full h-full text-primary-foreground" />
        <div className="relative z-10 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm opacity-80 mb-1">Continue Reading</p>
              <p className="text-xl font-semibold mb-1">{lastSurah.englishName}</p>
              <p className="text-sm opacity-80">
                Verse {lastAyahNumber} of {lastSurah.numberOfAyahs}
              </p>
            </div>
            <Button
              size="icon"
              variant="secondary"
              className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white shrink-0 backdrop-blur-sm"
            >
              <Play className="h-5 w-5 ml-0.5" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
