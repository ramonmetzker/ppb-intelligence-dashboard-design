export function PpbMark({
  size = 28,
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
      <rect x="0.5" y="0.5" width="23" height="23" rx="3" fill="#141d40" stroke="#26336e" />
      <rect x="4" y="14" width="6" height="6" rx="0.75" fill="#e8eeff" />
      <rect x="9.75" y="9.75" width="4.5" height="4.5" rx="0.5" stroke="#7fa2ff" strokeWidth="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="0.75" fill="#2457e6" />
    </svg>
  )
}
