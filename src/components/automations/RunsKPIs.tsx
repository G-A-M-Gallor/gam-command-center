'use client'

interface RunsKPIsProps {
  stats: {
    totalRuns: number
    successRate: number
    avgDuration: number
    runningNow: number
    trend: {
      totalRuns: string
      successRate: string
      avgDuration: string
    }
  }
}

export function RunsKPIs({ stats }: RunsKPIsProps) {
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toFixed(0).padStart(2, '0')}`
  }

  const getTrendColor = (trend: string) => {
    if (trend.startsWith('+')) return 'text-green-500'
    if (trend.startsWith('-')) return 'text-red-500'
    return 'text-[#A1A1AA]'
  }

  const getTrendIcon = (trend: string) => {
    if (trend.startsWith('+')) return '↗'
    if (trend.startsWith('-')) return '↘'
    return '→'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* ריצות היום */}
      <div className="bg-[#2A2A2A] border border-[#404040] rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#E5E5E5] text-sm">ריצות היום</span>
          <span className="text-[#FF6B1A]">📊</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-white">
            {stats.totalRuns.toLocaleString()}
          </span>
          <span className={`text-xs flex items-center gap-1 ${getTrendColor(stats.trend.totalRuns)}`}>
            <span>{getTrendIcon(stats.trend.totalRuns)}</span>
            {stats.trend.totalRuns}
          </span>
        </div>
        <p className="text-[#A1A1AA] text-xs mt-1">מהאתמול</p>
      </div>

      {/* אחוז הצלחה */}
      <div className="bg-[#2A2A2A] border border-[#404040] rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#E5E5E5] text-sm">אחוז הצלחה</span>
          <span className="text-green-500">✓</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-white">
            {stats.successRate.toFixed(1)}%
          </span>
          <span className={`text-xs flex items-center gap-1 ${getTrendColor(stats.trend.successRate)}`}>
            <span>{getTrendIcon(stats.trend.successRate)}</span>
            {stats.trend.successRate}
          </span>
        </div>
        <p className="text-[#A1A1AA] text-xs mt-1">מהאתמול</p>
      </div>

      {/* זמן ממוצע */}
      <div className="bg-[#2A2A2A] border border-[#404040] rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#E5E5E5] text-sm">זמן ממוצע</span>
          <span className="text-blue-500">⏱</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-white">
            {formatDuration(stats.avgDuration)}
          </span>
          <span className={`text-xs flex items-center gap-1 ${getTrendColor(stats.trend.avgDuration)}`}>
            <span>{getTrendIcon(stats.trend.avgDuration)}</span>
            {stats.trend.avgDuration}
          </span>
        </div>
        <p className="text-[#A1A1AA] text-xs mt-1">שיפור</p>
      </div>

      {/* מעבדים עכשיו */}
      <div className="bg-[#2A2A2A] border border-[#404040] rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#E5E5E5] text-sm">מעבדים עכשיו</span>
          <span className="text-[#FF6B1A]">🔄</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-white">
            {stats.runningNow}
          </span>
          {stats.runningNow > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-[#FF6B1A] rounded-full animate-pulse"></span>
              <span className="text-xs text-[#A1A1AA]">פעילים</span>
            </div>
          )}
        </div>
        <p className="text-[#A1A1AA] text-xs mt-1">
          {stats.runningNow > 0 ? `${stats.runningNow} במהלך ביצוע` : 'לא בפעולה'}
        </p>
      </div>
    </div>
  )
}