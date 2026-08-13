type CosmicSpinnerProps = {
  size?: number;
  /** Accessible name. Shown under the dial when `showLabel` is true. */
  label?: string;
  showLabel?: boolean;
  className?: string;
};

const R = 44;
const CIRC = 2 * Math.PI * R;
const ARC = CIRC * 0.22;

/**
 * Shared wait indicator — thin gold arc on a quiet ring.
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
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="2.2"
        />
        <circle
          className="cosmic-spinner-arc"
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke="#d4af37"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray={`${ARC} ${CIRC - ARC}`}
        />
      </svg>
      {label ? (
        <span className={showLabel ? "text-sm text-white/30" : "sr-only"}>
          {label}
        </span>
      ) : null}
    </div>
  );
}
