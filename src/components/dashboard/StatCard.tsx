import { LucideIcon } from 'lucide-react'
import { useState, useEffect } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatCard({ title, value, description, icon: Icon, trend, className = '' }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (typeof value === 'number') {
      setIsAnimating(true)
      const startValue = 0
      const endValue = value
      const duration = 1000
      const startTime = Date.now()

      const animate = () => {
        const currentTime = Date.now()
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        const currentValue = Math.floor(startValue + (endValue - startValue) * progress)
        setDisplayValue(currentValue)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setIsAnimating(false)
        }
      }

      animate()
    } else {
      setDisplayValue(0)
    }
  }, [value])

  return (
    <div className={`stat-card group ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold text-foreground">
              {typeof value === 'number' ? displayValue : value}
            </p>
            {trend && (
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-500' : 'text-red-500'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-200">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </div>
  )
} 