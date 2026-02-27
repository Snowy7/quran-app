import { NavLink, useLocation } from "react-router-dom";
import { Home, Bookmark, Brain, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

function QuranIcon({
  active,
  className,
}: {
  active?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("w-[22px] h-[22px]", className)}
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 4c0-1.1.9-2 2-2h4a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2V4z" />
      <path d="M22 4c0-1.1-.9-2-2-2h-4a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7V4z" />
    </svg>
  );
}

interface NavItem {
  to: string;
  icon: React.ElementType | "quran";
  label: string;
}

export function BottomNav() {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems: NavItem[] = [
    { to: "/", icon: Home, label: t("home") },
    { to: "/quran", icon: "quran", label: t("quran") },
    { to: "/collections", icon: Bookmark, label: t("saved") },
    { to: "/hifz", icon: Brain, label: t("hifz") },
    { to: "/prayer-times", icon: Clock, label: t("prayer") },
  ];

  const hideOnPaths = ["/quran/", "/hifz/drill"];
  const shouldHide = hideOnPaths.some(
    (p) => location.pathname.startsWith(p) && location.pathname !== "/quran",
  );
  if (shouldHide) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="flex justify-center pb-3 px-6">
        <nav className="relative bg-card backdrop-blur-xl border border-border/50 rounded-full shadow-elevated">
          <div className="flex items-center gap-1 px-3 h-[52px]">
            {navItems.map(({ to, icon: Icon, label }) => {
              const isActive =
                location.pathname === to ||
                (to !== "/" && location.pathname.startsWith(to));

              return (
                <NavLink
                  key={to}
                  to={to}
                  className="relative flex items-center justify-center touch-manipulation"
                  aria-label={label}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-full transition-all duration-300 ease-out",
                      isActive
                        ? "w-10 h-10 bg-primary shadow-md -translate-y-1.5"
                        : "w-9 h-9 hover:bg-secondary/60",
                    )}
                  >
                    {Icon === "quran" ? (
                      <QuranIcon
                        active={isActive}
                        className={cn(
                          "transition-colors duration-200",
                          isActive
                            ? "text-primary-foreground w-5 h-5"
                            : "text-muted-foreground w-[18px] h-[18px]",
                        )}
                      />
                    ) : (
                      <Icon
                        className={cn(
                          "transition-all duration-200",
                          isActive
                            ? "w-5 h-5 text-primary-foreground"
                            : "w-[18px] h-[18px] text-muted-foreground",
                        )}
                        strokeWidth={isActive ? 2.2 : 1.6}
                      />
                    )}
                  </div>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
