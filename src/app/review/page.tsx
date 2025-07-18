'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { 
  Shield, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Eye,
  Brain,
  AlertTriangle,
  Loader2,
  DollarSign,
  Calendar,
  ExternalLink,
  Save,
  Trash2
} from "lucide-react"
import Link from "next/link"
import { SubscriptionService } from '@/lib/subscriptions'
import { Subscription } from '@/types'

interface ReviewableSubscription extends Subscription {
  isEditing?: boolean
  originalData?: Subscription
}

export default function ReviewPage() {
  const [subscriptions, setSubscriptions] = useState<ReviewableSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<{ [key: string]: boolean }>({})
  const [filterConfidence, setFilterConfidence] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'ai' | 'manual'>('all')

  useEffect(() => {
    loadSubscriptions()
  }, [])

  const loadSubscriptions = async () => {
    try {
      setLoading(true)
      const allSubscriptions = await SubscriptionService.getSubscriptions('')
      setSubscriptions(allSubscriptions.map(sub => ({ ...sub, isEditing: false })))
    } catch (error) {
      console.error('Error loading subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceLevel = (score?: number): 'high' | 'medium' | 'low' => {
    if (!score) return 'low'
    if (score >= 0.7) return 'high'
    if (score >= 0.4) return 'medium'
    return 'low'
  }

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (filterConfidence !== 'all') {
      const level = getConfidenceLevel(sub.confidence_score)
      if (level !== filterConfidence) return false
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'ai' && sub.created_by !== 'ai') return false
      if (filterStatus === 'manual' && sub.created_by !== 'manual') return false
    }

    return true
  })

  const confirmSubscription = async (subscriptionId: string) => {
    try {
      setProcessing(prev => ({ ...prev, [subscriptionId]: true }))
      
      const subscription = subscriptions.find(s => s.id === subscriptionId)
      if (subscription && subscription.created_by === 'ai') {
        console.log(`✅ Confirmed subscription: ${subscription.name}`)
        
        setSubscriptions(prev => prev.map(sub => 
          sub.id === subscriptionId 
            ? { ...sub, notes: (sub.notes || '') + ' [AI-Confirmed]' }
            : sub
        ))
      }
    } catch (error) {
      console.error('Error confirming subscription:', error)
    } finally {
      setProcessing(prev => ({ ...prev, [subscriptionId]: false }))
    }
  }

  const rejectSubscription = async (subscriptionId: string) => {
    try {
      setProcessing(prev => ({ ...prev, [subscriptionId]: true }))
      
      const success = await SubscriptionService.deleteSubscription(subscriptionId)
      if (success) {
        setSubscriptions(prev => prev.filter(sub => sub.id !== subscriptionId))
        console.log(`🗑️ Rejected and deleted subscription: ${subscriptionId}`)
      } else {
        alert('Failed to reject subscription')
      }
    } catch (error) {
      console.error('Error rejecting subscription:', error)
    } finally {
      setProcessing(prev => ({ ...prev, [subscriptionId]: false }))
    }
  }

  const startEditing = (subscriptionId: string) => {
    setSubscriptions(prev => prev.map(sub => 
      sub.id === subscriptionId 
        ? { ...sub, isEditing: true, originalData: { ...sub } }
        : sub
    ))
  }

  const cancelEditing = (subscriptionId: string) => {
    setSubscriptions(prev => prev.map(sub => 
      sub.id === subscriptionId && sub.originalData
        ? { ...sub.originalData, isEditing: false, originalData: undefined }
        : sub
    ))
  }

  const updateSubscriptionField = (subscriptionId: string, field: keyof Subscription, value: any) => {
    setSubscriptions(prev => prev.map(sub => 
      sub.id === subscriptionId 
        ? { ...sub, [field]: value }
        : sub
    ))
  }

  const saveSubscription = async (subscriptionId: string) => {
    try {
      setProcessing(prev => ({ ...prev, [subscriptionId]: true }))
      
      const subscription = subscriptions.find(s => s.id === subscriptionId)
      if (!subscription) return

      const { isEditing, originalData, ...subscriptionData } = subscription
      
      console.log('Saving subscription updates:', subscriptionData)
      
      setSubscriptions(prev => prev.map(sub => 
        sub.id === subscriptionId 
          ? { ...sub, isEditing: false, originalData: undefined }
          : sub
      ))
      
      console.log(`💾 Saved subscription: ${subscription.name}`)
    } catch (error) {
      console.error('Error saving subscription:', error)
    } finally {
      setProcessing(prev => ({ ...prev, [subscriptionId]: false }))
    }
  }

  const formatCurrency = (amount?: number, currency?: string) => {
    if (!amount) return 'Free'
    return `${currency || '$'}${amount.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading subscriptions for review...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Review AI-Parsed Subscriptions</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Brain className="w-3 h-3" />
                <span>{filteredSubscriptions.length} subscriptions</span>
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="bg-white rounded-lg p-6 border">
            <div className="flex items-start space-x-4 mb-6">
              <Brain className="w-8 h-8 text-blue-600 mt-1" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">AI Subscription Detection</h2>
                <p className="text-gray-600 mb-4">
                  Review subscriptions discovered by AI analysis of your email. Confirm accurate detections, 
                  reject false positives, or edit details before adding to your dashboard.
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="font-medium text-green-900">High Confidence</div>
                    <div className="text-green-600">≥70% accuracy</div>
                    <div className="text-xl font-bold text-green-700">
                      {filteredSubscriptions.filter(s => getConfidenceLevel(s.confidence_score) === 'high').length}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="font-medium text-yellow-900">Medium Confidence</div>
                    <div className="text-yellow-600">40-70% accuracy</div>
                    <div className="text-xl font-bold text-yellow-700">
                      {filteredSubscriptions.filter(s => getConfidenceLevel(s.confidence_score) === 'medium').length}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="font-medium text-red-900">Low Confidence</div>
                    <div className="text-red-600">&lt;40% accuracy</div>
                    <div className="text-xl font-bold text-red-700">
                      {filteredSubscriptions.filter(s => getConfidenceLevel(s.confidence_score) === 'low').length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <Label>Confidence Level</Label>
                <Select value={filterConfidence} onValueChange={(value) => setFilterConfidence(value as any)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by confidence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Confidence Levels</SelectItem>
                    <SelectItem value="high">High (≥70%)</SelectItem>
                    <SelectItem value="medium">Medium (40-70%)</SelectItem>
                    <SelectItem value="low">Low (&lt;40%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Creation Method</Label>
                <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by creation method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="ai">AI-Parsed Only</SelectItem>
                    <SelectItem value="manual">Manual Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {filteredSubscriptions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No subscriptions to review</h3>
                <p className="text-gray-600 mb-4">
                  No subscriptions match your current filters, or all have been reviewed.
                </p>
                <Button variant="outline" onClick={() => {
                  setFilterConfidence('all')
                  setFilterStatus('all')
                }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredSubscriptions.map((subscription) => (
              <Card key={subscription.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {subscription.isEditing ? (
                          <Input
                            value={subscription.name}
                            onChange={(e) => updateSubscriptionField(subscription.id, 'name', e.target.value)}
                            className="text-lg font-semibold"
                          />
                        ) : (
                          <CardTitle className="text-lg">{subscription.name}</CardTitle>
                        )}
                        
                        {subscription.created_by === 'ai' && (
                          <Badge className="flex items-center space-x-1 bg-purple-100 text-purple-800">
                            <Brain className="w-3 h-3" />
                            <span>AI</span>
                          </Badge>
                        )}
                        
                        <Badge 
                          variant="outline" 
                          className={getConfidenceColor(getConfidenceLevel(subscription.confidence_score))}
                        >
                          {subscription.confidence_score ? `${Math.round(subscription.confidence_score * 100)}%` : 'N/A'}
                        </Badge>
                      </div>
                      
                      {subscription.isEditing ? (
                        <Input
                          value={subscription.service || ''}
                          onChange={(e) => updateSubscriptionField(subscription.id, 'service', e.target.value)}
                          placeholder="Service"
                        />
                      ) : (
                        <CardDescription>{subscription.service}</CardDescription>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {subscription.isEditing ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => saveSubscription(subscription.id)}
                            disabled={processing[subscription.id]}
                          >
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelEditing(subscription.id)}
                            disabled={processing[subscription.id]}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(subscription.id)}
                            disabled={processing[subscription.id]}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          
                          {subscription.created_by === 'ai' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => confirmSubscription(subscription.id)}
                                disabled={processing[subscription.id]}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectSubscription(subscription.id)}
                                disabled={processing[subscription.id]}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Pricing</Label>
                      {subscription.isEditing ? (
                        <div className="space-y-2">
                          <Input
                            type="number"
                            value={subscription.amount || ''}
                            onChange={(e) => updateSubscriptionField(subscription.id, 'amount', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                          <Input
                            value={subscription.currency || ''}
                            onChange={(e) => updateSubscriptionField(subscription.id, 'currency', e.target.value)}
                            placeholder="USD"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-medium">
                            {formatCurrency(subscription.amount, subscription.currency)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Billing Cycle</Label>
                      {subscription.isEditing ? (
                        <Select 
                          value={subscription.billing_cycle || ''} 
                          onValueChange={(value) => updateSubscriptionField(subscription.id, 'billing_cycle', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select cycle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="capitalize">{subscription.billing_cycle || 'Not specified'}</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Next Billing</Label>
                      {subscription.isEditing ? (
                        <Input
                          type="date"
                          value={subscription.renewal_date ? subscription.renewal_date.split('T')[0] : ''}
                          onChange={(e) => updateSubscriptionField(subscription.id, 'renewal_date', e.target.value)}
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span>
                            {subscription.renewal_date ? formatDate(subscription.renewal_date) : 'Not set'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      {subscription.isEditing ? (
                        <Select 
                          value={subscription.status || ''} 
                          onValueChange={(value) => updateSubscriptionField(subscription.id, 'status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="trial">Trial</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                          {subscription.status || 'Unknown'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {subscription.isEditing && (
                    <div className="mt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Website</Label>
                          <Input
                            value={subscription.website || ''}
                            onChange={(e) => updateSubscriptionField(subscription.id, 'website', e.target.value)}
                            placeholder="https://example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Input
                            value={subscription.category || ''}
                            onChange={(e) => updateSubscriptionField(subscription.id, 'category', e.target.value)}
                            placeholder="e.g., Streaming, Software, etc."
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          value={subscription.notes || ''}
                          onChange={(e) => updateSubscriptionField(subscription.id, 'notes', e.target.value)}
                          placeholder="Additional notes about this subscription..."
                          rows={3}
                        />
                      </div>
                    </div>
                  )}

                  {subscription.created_by === 'ai' && subscription.parsed_data && (
                    <details className="mt-6 p-4 border rounded-lg bg-gray-50">
                      <summary className="cursor-pointer font-medium text-gray-900 mb-2">
                        AI Parsing Details
                      </summary>
                      <pre className="text-xs text-gray-600 overflow-x-auto">
                        {JSON.stringify(subscription.parsed_data, null, 2)}
                      </pre>
                    </details>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="mt-8 text-center">
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </main>
    </div>
  )
} 