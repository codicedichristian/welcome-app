export default function SkeletonCard({ height = 200, radius = 22 }) {
  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: radius,
        background: 'linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s infinite',
        overflow: 'hidden',
      }}
    />
  )
}
