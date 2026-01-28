import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
    >
      {/* Simple geometric logo - layered squares */}
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="3"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <rect
        x="12"
        y="12"
        width="16"
        height="16"
        rx="3"
        fill="currentColor"
      />
    </svg>
  );
}
