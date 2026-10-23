export function PpbMark({
  size = 36,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label="PPB Intelligence"
      className={className}
    >
      <rect
        x="0.5"
        y="0.5"
        width="23"
        height="23"
        rx="6"
        fill="#21252d"
        stroke="#303641"
      />
      <rect x="4" y="14" width="6" height="6" rx="1" fill="#eef1f5" />
      <rect
        x="9.75"
        y="9.75"
        width="4.5"
        height="4.5"
        rx="0.75"
        stroke="#3fb6d4"
        strokeWidth="1.5"
      />
      <rect x="14" y="4" width="6" height="6" rx="1" fill="#1ea3b4" />
    </svg>
  )
}
