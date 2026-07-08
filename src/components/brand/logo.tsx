import { cn } from "@/lib/utils";

/**
 * The Logos brand mark: an open book with a flame rising from the spine —
 * "Thy word is a lamp unto my feet" (Psalm 119:105). Hand-drawn SVG so it
 * stays crisp at every size.
 */
export function LogoMark({
  className,
  id = "logos-gold",
}: {
  className?: string;
  id?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={cn("size-8", className)}
    >
      <defs>
        <linearGradient id={id} x1="12" y1="6" x2="52" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E8BC6A" />
          <stop offset="0.55" stopColor="#C9913B" />
          <stop offset="1" stopColor="#9C6A1F" />
        </linearGradient>
      </defs>
      {/* flame */}
      <path
        d="M32 3.5 C35.6 9.2 40.5 12.4 40.5 18 C40.5 22.8 36.7 26.5 32 26.5 C27.3 26.5 23.5 22.8 23.5 18 C23.5 12.4 28.4 9.2 32 3.5 Z"
        fill={`url(#${id})`}
      />
      {/* flame inner glow (cut-out) */}
      <path
        d="M32 12.5 C33.9 15.4 36.2 17 36.2 19.4 C36.2 21.7 34.3 23.5 32 23.5 C29.7 23.5 27.8 21.7 27.8 19.4 C27.8 17 30.1 15.4 32 12.5 Z"
        fill="#FDF6E9"
        fillOpacity="0.85"
      />
      {/* left page */}
      <path
        d="M30.4 32 C24.8 27.2 16 25.9 7.5 28.8 L7.5 52.6 C16 49.7 24.4 50.8 30.4 55.4 Z"
        fill={`url(#${id})`}
      />
      {/* right page */}
      <path
        d="M33.6 32 C39.2 27.2 48 25.9 56.5 28.8 L56.5 52.6 C48 49.7 39.6 50.8 33.6 55.4 Z"
        fill={`url(#${id})`}
      />
      {/* page edge details */}
      <path
        d="M12 34.2 C17.5 33 22.8 33.9 27 36.4 M12 39.6 C17.5 38.4 22.8 39.3 27 41.8 M37 36.4 C41.2 33.9 46.5 33 52 34.2 M37 41.8 C41.2 39.3 46.5 38.4 52 39.6"
        stroke="#FDF6E9"
        strokeOpacity="0.5"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Small typographic flourish used as a section divider. */
export function Ornament({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 12"
      fill="none"
      aria-hidden="true"
      className={cn("h-3 w-28 text-primary/60", className)}
    >
      <path d="M0 6 H44" stroke="currentColor" strokeWidth="1" />
      <path d="M76 6 H120" stroke="currentColor" strokeWidth="1" />
      <path d="M60 1 L65 6 L60 11 L55 6 Z" fill="currentColor" />
      <circle cx="49" cy="6" r="1.6" fill="currentColor" />
      <circle cx="71" cy="6" r="1.6" fill="currentColor" />
    </svg>
  );
}
