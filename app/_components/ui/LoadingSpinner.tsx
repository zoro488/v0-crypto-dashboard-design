export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-12 h-12 rounded-full border-2 border-purple-500/20 animate-pulse" />
        {/* Spinning ring */}
        <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
        {/* Inner glow */}
        <div className="absolute inset-2 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/10 to-violet-500/10 animate-pulse" />
      </div>
    </div>
  )
}

export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i} 
          className="h-16 rounded-xl bg-white/5 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 animate-pulse">
      <div className="h-4 w-24 bg-white/10 rounded mb-4" />
      <div className="h-8 w-32 bg-white/10 rounded mb-2" />
      <div className="h-3 w-20 bg-white/5 rounded" />
    </div>
  )
}
