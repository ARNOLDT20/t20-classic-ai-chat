import { cn } from "@/lib/utils";

interface BrainLogoProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

/**
 * T20-CLASSIC AI brain mark.
 * Stylized neural brain built with semantic gradient tokens (--primary → --accent).
 * No raw colors — fully themed.
 */
export const BrainLogo = ({ className, size = 28, animated = true }: BrainLogoProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("drop-shadow-[0_0_8px_hsl(var(--primary)/0.55)]", className)}
      aria-label="T20-CLASSIC AI"
      role="img"
    >
      <defs>
        <linearGradient id="t20-brain-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
        <radialGradient id="t20-brain-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--primary-foreground))" stopOpacity="0.95" />
          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer brain silhouette — two hemispheres */}
      <g fill="none" stroke="url(#t20-brain-grad)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {/* Left hemisphere */}
        <path d="M30 10c-5 0-9 3-10 7-5 1-8 5-8 10 0 3 1 5 3 7-2 2-3 5-2 8 1 4 5 7 9 7 1 3 4 5 8 5V10z" />
        {/* Right hemisphere */}
        <path d="M34 10c5 0 9 3 10 7 5 1 8 5 8 10 0 3-1 5-3 7 2 2 3 5 2 8-1 4-5 7-9 7-1 3-4 5-8 5V10z" />

        {/* Inner neural folds — left */}
        <path d="M22 22c3 1 5 4 5 7M20 32c3 0 6 2 7 5M24 44c2-1 4-1 6 0" opacity="0.85" />
        {/* Inner neural folds — right */}
        <path d="M42 22c-3 1-5 4-5 7M44 32c-3 0-6 2-7 5M40 44c-2-1-4-1-6 0" opacity="0.85" />

        {/* Central seam */}
        <path d="M32 12v40" strokeDasharray="2 2.5" opacity="0.6" />
      </g>

      {/* Neural nodes */}
      <g fill="hsl(var(--accent))">
        <circle cx="22" cy="22" r="1.6" />
        <circle cx="42" cy="22" r="1.6" />
        <circle cx="20" cy="32" r="1.6" />
        <circle cx="44" cy="32" r="1.6" />
        <circle cx="24" cy="44" r="1.6" />
        <circle cx="40" cy="44" r="1.6" />
      </g>

      {/* Pulsing core */}
      <circle cx="32" cy="32" r="6" fill="url(#t20-brain-core)">
        {animated && (
          <animate attributeName="r" values="5;7.5;5" dur="2.4s" repeatCount="indefinite" />
        )}
      </circle>
      <circle cx="32" cy="32" r="2.2" fill="hsl(var(--primary-foreground))">
        {animated && (
          <animate attributeName="opacity" values="0.7;1;0.7" dur="1.6s" repeatCount="indefinite" />
        )}
      </circle>
    </svg>
  );
};
