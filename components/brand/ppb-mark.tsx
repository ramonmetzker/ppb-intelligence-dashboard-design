type LogoProps = {
  size?: number
  className?: string
}

const bars = [
  { x: 0, y: 38, height: 55 },
  { x: 12, y: 38, height: 30 },
  { x: 24, y: 38, height: 55 },
  { x: 36, y: 38, height: 30 },
]

export function PpbMark({ size = 28, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-19 -1 108 108"
      fill="currentColor"
      role="img"
      aria-label="PPB"
      className={className}
    >
      {bars.map((bar) => (
        <rect key={bar.x} x={bar.x} y={bar.y} width="10" height={bar.height} rx="2" />
      ))}
      <g opacity="0.45">
        <rect x="48" y="13" width="10" height="55" rx="2" />
        <rect x="60" y="38" width="10" height="30" rx="2" />
      </g>
    </svg>
  )
}

export function PpbLoadingMark({ size = 42, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-19 -1 108 108"
      fill="currentColor"
      role="img"
      aria-label="Loading PPB"
      className={className}
    >
      {bars.map((bar, index) => (
        <rect
          key={bar.x}
          className="ppb-logo-loading-bar"
          x={bar.x}
          y={bar.y}
          width="10"
          height={bar.height}
          rx="2"
          style={{ animationDelay: `${index * 0.2}s` }}
        />
      ))}
      <g className="ppb-logo-loading-bar" opacity="0.45" style={{ animationDelay: '0.8s' }}>
        <rect x="48" y="13" width="10" height="55" rx="2" />
        <rect x="60" y="38" width="10" height="30" rx="2" />
      </g>
    </svg>
  )
}
