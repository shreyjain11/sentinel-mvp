import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Plus, 
  RefreshCw, 
  Calendar, 
  Bell, 
  Brain, 
  Lock, 
  Settings,
  Mail,
  Shield
} from 'lucide-react'
import Link from 'next/link'

interface SidebarActionsProps {
  onAddSubscription: () => void
  onRefreshGmail: () => void
  onScanGmail?: () => void
  gmailConnected?: boolean
}

export function SidebarActions({ 
  onAddSubscription, 
  onRefreshGmail, 
  onScanGmail,
  gmailConnected = false 
}: SidebarActionsProps) {
  const actions = [
    {
      icon: Plus,
      label: 'Add New Subscription',
      onClick: onAddSubscription,
      variant: 'default' as const
    },
    {
      icon: RefreshCw,
      label: 'Refresh Gmail Status',
      onClick: onRefreshGmail,
      variant: 'outline' as const
    },
    {
      icon: Mail,
      label: 'Scan Gmail',
      onClick: onScanGmail,
      variant: 'outline' as const,
      disabled: !gmailConnected
    },
    {
      icon: Calendar,
      label: 'Sync with Calendar',
      href: '/calendar',
      variant: 'outline' as const
    },
    {
      icon: Bell,
      label: 'Notification Settings',
      href: '/notifications',
      variant: 'outline' as const
    },
    {
      icon: Brain,
      label: 'Review Subscriptions',
      href: '/review',
      variant: 'outline' as const
    },
    {
      icon: Lock,
      label: 'Privacy & Data Control',
      href: '/privacy',
      variant: 'outline' as const
    },
    {
      icon: Shield,
      label: 'Ethics & Trust',
      href: '/ethics',
      variant: 'outline' as const
    },
    {
      icon: Settings,
      label: 'Account Settings',
      href: '/settings',
      variant: 'outline' as const
    }
  ]

  return (
    <Card className="sidebar-card">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-foreground">Quick Actions</CardTitle>
        <CardDescription className="text-muted-foreground">
          Common tasks and settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {actions.map((action, index) => {
            const Icon = action.icon
            
            if (action.href) {
              return (
                <Link key={index} href={action.href}>
                  <Button 
                    variant={action.variant}
                    className="w-full justify-start premium-button-outline"
                    disabled={action.disabled}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {action.label}
                  </Button>
                </Link>
              )
            }

            return (
              <Button
                key={index}
                variant={action.variant}
                className="w-full justify-start premium-button-outline"
                onClick={action.onClick}
                disabled={action.disabled}
              >
                <Icon className="w-4 h-4 mr-3" />
                {action.label}
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
} 