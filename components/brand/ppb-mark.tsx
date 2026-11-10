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
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="PPB"
      className={className}
    >
      <path
        d="M16 3 29 16 16 29 3 16 16 3Z"
        stroke="var(--brand)"
        strokeWidth="3.5"
        strokeLinejoin="miter"
      />
      <path
        d="m16 8 8 8-8 8-8-8 8-8Z"
        stroke="var(--sidebar-foreground)"
        strokeWidth="3.5"
        strokeLinejoin="miter"
      />
      <rect x="13.5" y="13.5" width="5" height="5" fill="var(--brand)" />
    </svg>
  )
}
