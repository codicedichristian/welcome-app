const shimmer = {
  background: 'linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeleton-shimmer 1.5s infinite',
}

export default function SkeletonCard({ height = 200, radius = 22, width = '100%' }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        overflow: 'hidden',
        flexShrink: 0,
        ...shimmer,
      }}
    />
  )
}

export function SkeletonText({ width = '100%', height = 16, radius = 6, style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        flexShrink: 0,
        ...shimmer,
        ...style,
      }}
    />
  )
}
