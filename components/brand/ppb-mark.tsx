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
        d="M8.5 27V11.5C8.5 8.46 10.96 6 14 6h1.5a5.5 5.5 0 0 1 0 11H8.5"
        stroke="var(--sidebar-foreground)"
        strokeWidth="3.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23.5 5v15.5c0 3.04-2.46 5.5-5.5 5.5h-1.5a5.5 5.5 0 0 1 0-11h7"
        stroke="var(--brand)"
        strokeWidth="3.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
