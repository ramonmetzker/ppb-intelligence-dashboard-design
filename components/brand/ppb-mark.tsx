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
        fill="var(--brand)"
        fillRule="evenodd"
        d="M4 29V3h15l10 8.5L19 20H11v9H4Zm7-19v5h6l4-3.5L17 8h-6v2Z"
        clipRule="evenodd"
      />
      <path
        d="m15 23 4 4 9-9"
        stroke="var(--sidebar-foreground)"
        strokeWidth="3.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  )
}
