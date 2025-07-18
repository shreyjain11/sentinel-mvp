'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, ArrowLeft, TrendingUp, PieChart, BarChart3, DollarSign, Calendar, AlertTriangle, Lightbulb, RefreshCw } from "lucide-react"
import Link from "next/link"
import { SubscriptionService } from '@/lib/subscriptions'
import { Subscription } from '@/types'

interface Analytics {
  totalMonthlySpending: number
  totalYearlySpending: number
  activeSubscriptions: number
  trialSubscriptions: number
  categoryBreakdown: { category: string; amount: number; count: number }[]
  monthlyTrends: { month: string; amount: number }[]
  savingsOpportunities: {
    expensiveServices: Subscription[]
    unusedTrials: Subscription[]
    duplicateCategories: { category: string; services: Subscription[]; totalCost: number }[]
    totalPotentialSavings: number
  }
}

export default function InsightsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const subscriptions = await SubscriptionService.getSubscriptions('')
      const analyticsData = calculateAnalytics(subscriptions)
      setAnalytics(analyticsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = (subscriptions: Subscription[]): Analytics => {
    // Calculate monthly spending
    const monthlySpending = subscriptions
      .filter(sub => sub.status === 'active')
      .reduce((total, sub) => {
        const amount = sub.amount || 0
        switch (sub.billing_cycle) {
          case 'monthly': return total + amount
          case 'yearly': return total + (amount / 12)
          case 'weekly': return total + (amount * 4.33)
          case 'daily': return total + (amount * 30.44)
          default: return total + amount
        }
      }, 0)

    // Category breakdown
    const categoryMap = new Map<string, { amount: number; count: number }>()
    subscriptions.filter(sub => sub.status === 'active').forEach(sub => {
      const category = sub.category || 'Other'
      const amount = normalizeToMonthly(sub.amount || 0, sub.billing_cycle)
      
      if (categoryMap.has(category)) {
        const existing = categoryMap.get(category)!
        categoryMap.set(category, {
          amount: existing.amount + amount,
          count: existing.count + 1
        })
      } else {
        categoryMap.set(category, { amount, count: 1 })
      }
    })

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count
    })).sort((a, b) => b.amount - a.amount)

    // Monthly trends (last 6 months)
    const monthlyTrends = generateMonthlyTrends(subscriptions)

    // Savings opportunities
    const savingsOpportunities = calculateSavingsOpportunities(subscriptions)

    return {
      totalMonthlySpending: monthlySpending,
      totalYearlySpending: monthlySpending * 12,
      activeSubscriptions: subscriptions.filter(sub => sub.status === 'active').length,
      trialSubscriptions: subscriptions.filter(sub => sub.type === 'trial').length,
      categoryBreakdown,
      monthlyTrends,
      savingsOpportunities
    }
  }

  const normalizeToMonthly = (amount: number, cycle: string): number => {
    switch (cycle) {
      case 'yearly': return amount / 12
      case 'weekly': return amount * 4.33
      case 'daily': return amount * 30.44
      default: return amount
    }
  }

  const generateMonthlyTrends = (subscriptions: Subscription[]) => {
    const months = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      
      // Calculate spending for this month
      const monthlyAmount = subscriptions
        .filter(sub => {
          const startDate = new Date(sub.start_date)
          return startDate <= date && sub.status === 'active'
        })
        .reduce((total, sub) => total + normalizeToMonthly(sub.amount || 0, sub.billing_cycle), 0)
      
      months.push({ month: monthName, amount: monthlyAmount })
    }
    
    return months
  }

  const calculateSavingsOpportunities = (subscriptions: Subscription[]) => {
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active')
    
    // Find expensive services (top 20% by cost)
    const expensiveServices = activeSubscriptions
      .sort((a, b) => normalizeToMonthly(b.amount || 0, b.billing_cycle) - normalizeToMonthly(a.amount || 0, a.billing_cycle))
      .slice(0, Math.max(1, Math.ceil(activeSubscriptions.length * 0.2)))

    // Find unused trials
    const unusedTrials = subscriptions.filter(sub => {
      if (sub.type !== 'trial') return false
      const trialEnd = new Date(sub.trial_end_date || sub.end_date)
      const now = new Date()
      return trialEnd > now // Trial is still active
    })

    // Find duplicate categories with multiple services
    const categoryGroups = new Map<string, Subscription[]>()
    activeSubscriptions.forEach(sub => {
      const category = sub.category || 'Other'
      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, [])
      }
      categoryGroups.get(category)!.push(sub)
    })

    const duplicateCategories = Array.from(categoryGroups.entries())
      .filter(([_, services]) => services.length > 1)
      .map(([category, services]) => ({
        category,
        services,
        totalCost: services.reduce((total, sub) => total + normalizeToMonthly(sub.amount || 0, sub.billing_cycle), 0)
      }))
      .sort((a, b) => b.totalCost - a.totalCost)

    // Calculate potential savings
    const expensiveSavings = expensiveServices.reduce((total, sub) => 
      total + normalizeToMonthly(sub.amount || 0, sub.billing_cycle), 0) * 0.3 // Assume 30% could be saved
    
    const duplicateSavings = duplicateCategories.reduce((total, group) => 
      total + (group.totalCost * 0.5), 0) // Assume 50% savings by consolidating

    return {
      expensiveServices,
      unusedTrials,
      duplicateCategories,
      totalPotentialSavings: expensiveSavings + duplicateSavings
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadAnalytics}>Try Again</Button>
        </div>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Sentinel</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Insights</h1>
          <p className="text-gray-600">
            Analyze your subscription spending and usage patterns
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Monthly Spending</p>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.totalMonthlySpending)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Yearly Projection</p>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.totalYearlySpending)}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Active Services</p>
                  <p className="text-2xl font-bold">{analytics.activeSubscriptions}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Active Trials</p>
                  <p className="text-2xl font-bold">{analytics.trialSubscriptions}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Spending Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Spending Trends</span>
              </CardTitle>
              <CardDescription>
                Monthly subscription costs over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.monthlyTrends.map((month, index) => {
                  const maxAmount = Math.max(...analytics.monthlyTrends.map(m => m.amount))
                  const percentage = maxAmount > 0 ? (month.amount / maxAmount) * 100 : 0
                  
                  return (
                    <div key={month.month} className="flex items-center space-x-4">
                      <div className="w-12 text-sm text-gray-600">{month.month}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-20 text-sm font-medium text-right">
                        {formatCurrency(month.amount)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="w-5 h-5" />
                <span>Category Breakdown</span>
              </CardTitle>
              <CardDescription>
                Spending distribution by service category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.categoryBreakdown.slice(0, 6).map((category, index) => {
                  const colors = [
                    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
                    'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'
                  ]
                  const percentage = analytics.totalMonthlySpending > 0 
                    ? (category.amount / analytics.totalMonthlySpending) * 100 
                    : 0
                  
                  return (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${colors[index % colors.length]}`} />
                        <span className="text-sm font-medium">{category.category}</span>
                        <Badge variant="outline" className="text-xs">
                          {category.count} {category.count === 1 ? 'service' : 'services'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatCurrency(category.amount)}</div>
                        <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Usage Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Service Status Overview</span>
              </CardTitle>
              <CardDescription>
                Distribution of your subscriptions by status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="font-medium text-green-900">Active Subscriptions</span>
                  </div>
                  <div className="text-green-900 font-bold">{analytics.activeSubscriptions}</div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-full" />
                    <span className="font-medium text-orange-900">Active Trials</span>
                  </div>
                  <div className="text-orange-900 font-bold">{analytics.trialSubscriptions}</div>
                </div>

                {analytics.categoryBreakdown.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Top Category</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      You spend the most on <strong>{analytics.categoryBreakdown[0].category}</strong> services 
                      ({formatCurrency(analytics.categoryBreakdown[0].amount)}/month)
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Savings Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5" />
                <span>Savings Opportunities</span>
              </CardTitle>
              <CardDescription>
                AI-powered recommendations to reduce costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.savingsOpportunities.totalPotentialSavings > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium text-yellow-900">Potential Monthly Savings</span>
                    </div>
                    <p className="text-lg font-bold text-yellow-900">
                      {formatCurrency(analytics.savingsOpportunities.totalPotentialSavings)}
                    </p>
                  </div>
                )}

                {analytics.savingsOpportunities.expensiveServices.length > 0 && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-900">Most Expensive Services</span>
                    </div>
                    <div className="space-y-1">
                      {analytics.savingsOpportunities.expensiveServices.slice(0, 3).map(service => (
                        <div key={service.id} className="flex justify-between text-sm">
                          <span className="text-red-700">{service.name}</span>
                          <span className="font-medium text-red-900">
                            {formatCurrency(normalizeToMonthly(service.amount || 0, service.billing_cycle))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analytics.savingsOpportunities.duplicateCategories.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Duplicate Categories</span>
                    </div>
                    <div className="space-y-1">
                      {analytics.savingsOpportunities.duplicateCategories.slice(0, 3).map(category => (
                        <div key={category.category} className="text-sm text-blue-700">
                          <strong>{category.services.length}</strong> {category.category} services 
                          ({formatCurrency(category.totalCost)}/month)
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analytics.savingsOpportunities.unusedTrials.length > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Active Trials</span>
                    </div>
                    <p className="text-sm text-green-700">
                      You have <strong>{analytics.savingsOpportunities.unusedTrials.length}</strong> active trial{analytics.savingsOpportunities.unusedTrials.length !== 1 ? 's' : ''}. 
                      Remember to cancel before they convert to paid subscriptions!
                    </p>
                  </div>
                )}

                {analytics.savingsOpportunities.totalPotentialSavings === 0 && 
                 analytics.savingsOpportunities.unusedTrials.length === 0 && (
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-green-700">
                      Great job! Your subscriptions are well-optimized.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button onClick={loadAnalytics} variant="outline" className="mr-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Analytics
          </Button>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </main>
    </div>
  )
} 