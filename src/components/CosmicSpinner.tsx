type CosmicSpinnerProps = {
  size?: number;
  /** Accessible name. Shown under the dial when `showLabel` is true. */
  label?: string;
  showLabel?: boolean;
  className?: string;
};

const TICKS = Array.from({ length: 12 }, (_, i) => i);

/**
 * Shared wait indicator — miniature cosmic clock with three spinning hands.
 * Use for session / DB / any blocking wait. Pass `size` for compact slots.
 */
export function CosmicSpinner({
  size = 88,
  label,
  showLabel = false,
  className = "",
}: CosmicSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`inline-flex flex-col items-center gap-5 ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="cosmic-spinner"
        aria-hidden
      >
        <circle cx="50" cy="50" r="22" fill="#3b82f6" opacity="0.18" />
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="rgba(0,0,0,0.45)"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="1.5"
        />
        {TICKS.map((i) => {
          const a = ((i * 30 - 90) * Math.PI) / 180;
          const major = i % 3 === 0;
          const outer = 46;
          const inner = major ? 38 : 41;
          return (
            <line
              key={i}
              x1={50 + outer * Math.cos(a)}
              y1={50 + outer * Math.sin(a)}
              x2={50 + inner * Math.cos(a)}
              y2={50 + inner * Math.sin(a)}
              stroke={major ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.28)"}
              strokeWidth={major ? 1.8 : 1}
              strokeLinecap="round"
            />
          );
        })}
        <line
          className="cosmic-spinner-hand cosmic-spinner-hand-year"
          x1="50"
          y1="50"
          x2="50"
          y2="28"
          stroke="#60a5fa"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <line
          className="cosmic-spinner-hand cosmic-spinner-hand-month"
          x1="50"
          y1="50"
          x2="50"
          y2="22"
          stroke="#c084fc"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <line
          className="cosmic-spinner-hand cosmic-spinner-hand-day"
          x1="50"
          y1="50"
          x2="50"
          y2="16"
          stroke="#881337"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle cx="50" cy="50" r="3.2" fill="#fff" stroke="#3b82f6" strokeWidth="1.4" />
      </svg>
      {label ? (
        <span className={showLabel ? "text-sm text-white/30" : "sr-only"}>
          {label}
        </span>
      ) : null}
    </div>
  );
}
