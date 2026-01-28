import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", sizeMap[size], className)}
    >
      {/* Crescent Moon */}
      <path
        d="M32 4C17.088 4 5 16.088 5 31s12.088 27 27 27c4.697 0 9.132-1.2 12.988-3.313C35.31 52.85 28 44.347 28 34c0-10.347 7.31-18.85 16.988-20.687C41.132 5.2 36.697 4 32 4z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path
        d="M32 6C18.193 6 7 17.193 7 31s11.193 25 25 25c3.945 0 7.68-.922 10.998-2.555C34.834 51.762 28 43.614 28 34c0-9.614 6.834-17.762 15.998-19.445C40.68 6.922 36.945 6 32 6z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />

      {/* Star */}
      <path
        d="M50 14l1.545 4.755h5.002l-4.046 2.94 1.545 4.755L50 23.51l-4.046 2.94 1.545-4.755-4.046-2.94h5.002L50 14z"
        fill="currentColor"
      />

      {/* Decorative geometric pattern - inner arc */}
      <path
        d="M20 31c0-6.627 5.373-12 12-12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M32 43c-6.627 0-12-5.373-12-12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />

      {/* Small decorative dots */}
      <circle cx="16" cy="31" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="32" cy="47" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="32" cy="15" r="1.5" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

// Simplified logo for favicon/small sizes
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
    >
      {/* Simplified crescent */}
      <path
        d="M16 3C9.373 3 4 8.373 4 15s5.373 12 12 12c2.21 0 4.286-.6 6.066-1.646C17.014 24.202 13 20.063 13 15s4.014-9.202 9.066-10.354C20.286 3.6 18.21 3 16 3z"
        fill="currentColor"
      />
      {/* Star */}
      <path
        d="M25 7l.927 2.853h3.001l-2.428 1.764.928 2.853L25 12.706l-2.428 1.764.928-2.853-2.428-1.764h3.001L25 7z"
        fill="currentColor"
      />
    </svg>
  );
}
