'use client'

import { cn } from "@/lib/utils"

interface TagProps {
  variant: 'trial' | 'subscription' | 'active' | 'cancelled' | 'expired' | 'ai' | 'no-contract' | 'manual-only' | 'risk-safe' | 'risk-medium' | 'risk-high'
  children: React.ReactNode
  className?: string
}

export function Tag({ variant, children, className }: TagProps) {
  return (
    <span
      className={cn(
        "tag",
        {
          'tag-trial': variant === 'trial',
          'tag-subscription': variant === 'subscription',
          'tag-active': variant === 'active',
          'tag-cancelled': variant === 'cancelled',
          'tag-expired': variant === 'expired',
          'tag-ai': variant === 'ai',
          'tag-no-contract': variant === 'no-contract',
          'tag-manual-only': variant === 'manual-only',
          'tag-risk-safe': variant === 'risk-safe',
          'tag-risk-medium': variant === 'risk-medium',
          'tag-risk-high': variant === 'risk-high',
        },
        className
      )}
    >
      {children}
    </span>
  )
} 