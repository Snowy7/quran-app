import { Moon, Sunrise, Sunset } from "lucide-react";

interface RamadanBannerProps {
  hijriDay: number;
  suhoorTime: string; // Fajr time (HH:MM)
  iftarTime: string; // Maghrib time (HH:MM)
}

function formatTime12h(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

function getTimeUntil(time24: string): string | null {
  const [h, m] = time24.split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);

  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return null;

  const hours = Math.floor(diff / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);

  if (hours > 0) return `in ${hours}h ${mins}m`;
  return `in ${mins}m`;
}

export function RamadanBanner({
  hijriDay,
  suhoorTime,
  iftarTime,
}: RamadanBannerProps) {
  const suhoorCountdown = getTimeUntil(suhoorTime);
  const iftarCountdown = getTimeUntil(iftarTime);

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Background gradient — deep night-to-dawn feel */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, hsl(250 40% 18%) 0%, hsl(260 35% 24%) 40%, hsl(280 30% 20%) 70%, hsl(250 40% 16%) 100%)",
        }}
      />

      {/* Stars pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(1px 1px at 20% 30%, white 50%, transparent 100%),
            radial-gradient(1px 1px at 60% 15%, white 50%, transparent 100%),
            radial-gradient(1px 1px at 80% 55%, white 50%, transparent 100%),
            radial-gradient(1px 1px at 35% 70%, white 50%, transparent 100%),
            radial-gradient(1px 1px at 90% 80%, white 50%, transparent 100%),
            radial-gradient(1px 1px at 10% 85%, white 50%, transparent 100%),
            radial-gradient(1px 1px at 50% 45%, white 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 75% 35%, white 60%, transparent 100%)`,
        }}
      />

      {/* Crescent moon glow */}
      <div
        className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-10"
        style={{
          background:
            "radial-gradient(circle, hsl(45 100% 80%) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 p-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/15 flex items-center justify-center">
              <Moon className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Ramadan Mubarak
              </h3>
              <p className="text-[10px] text-purple-200/60 font-medium">
                Day {hijriDay} of 30
              </p>
            </div>
          </div>

          {/* Day counter pill */}
          <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-xs font-bold text-amber-300">
              {hijriDay}/30
            </span>
          </div>
        </div>

        {/* Progress bar for Ramadan days */}
        <div className="w-full h-1 rounded-full bg-white/10 mb-4">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min((hijriDay / 30) * 100, 100)}%`,
              background:
                "linear-gradient(90deg, hsl(45 100% 65%) 0%, hsl(35 100% 55%) 100%)",
            }}
          />
        </div>

        {/* Suhoor & Iftar times */}
        <div className="flex gap-3">
          {/* Suhoor */}
          <div className="flex-1 bg-white/[0.06] backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sunrise className="w-3.5 h-3.5 text-sky-300/80" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-200/60">
                Suhoor
              </span>
            </div>
            <p className="text-lg font-bold text-white leading-none mb-0.5">
              {formatTime12h(suhoorTime)}
            </p>
            {suhoorCountdown && (
              <p className="text-[10px] text-sky-300/50">{suhoorCountdown}</p>
            )}
          </div>

          {/* Iftar */}
          <div className="flex-1 bg-white/[0.06] backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sunset className="w-3.5 h-3.5 text-orange-300/80" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-200/60">
                Iftar
              </span>
            </div>
            <p className="text-lg font-bold text-white leading-none mb-0.5">
              {formatTime12h(iftarTime)}
            </p>
            {iftarCountdown && (
              <p className="text-[10px] text-orange-300/50">{iftarCountdown}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
