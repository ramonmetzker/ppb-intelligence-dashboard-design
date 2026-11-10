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
        d="M6.5 28V9.5L15 4l8.5 5.5v4L15 19l-8.5-5.5"
        stroke="var(--brand)"
        strokeWidth="4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path
        d="M25.5 4v18.5L17 28l-8.5-5.5v-4L17 13l8.5 5.5"
        stroke="var(--brand)"
        strokeWidth="4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  )
}
