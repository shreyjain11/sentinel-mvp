import { Brain, BarChart3, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AiInsightCardProps {
  title: string
  description: string
  confidence?: number
  actionLabel?: string
  onAction?: () => void
  variant?: 'default' | 'insight' | 'recommendation'
}

export function AiInsightCard({ 
  title, 
  description, 
  confidence, 
  actionLabel = 'View Details',
  onAction,
  variant = 'default'
}: AiInsightCardProps) {
  const getIcon = () => {
    switch (variant) {
      case 'insight':
        return <BarChart3 className="w-6 h-6 text-premium-purple" />
      case 'recommendation':
        return <Sparkles className="w-6 h-6 text-premium-purple" />
      default:
        return <Brain className="w-6 h-6 text-premium-purple ai-pulse" />
    }
  }

  const getGradient = () => {
    switch (variant) {
      case 'insight':
        return 'from-premium-purple to-blue-500'
      case 'recommendation':
        return 'from-premium-purple to-pink-500'
      default:
        return 'from-premium-purple to-premium-blue'
    }
  }

  return (
    <Card className="premium-card-hero group">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getGradient()}`} />
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-premium-purple/10 group-hover:bg-premium-purple/20 transition-colors duration-200">
              {getIcon()}
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-foreground">{title}</CardTitle>
              <CardDescription className="text-muted-foreground">{description}</CardDescription>
            </div>
          </div>
          {confidence && (
            <div className="text-right">
              <div className="text-sm font-medium text-premium-purple">{confidence}%</div>
              <div className="text-xs text-muted-foreground">Confidence</div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {onAction && (
          <Button 
            onClick={onAction}
            variant="outline"
            className="w-full border-premium-purple/30 text-premium-purple hover:bg-premium-purple/10 hover:text-premium-purple"
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
} 