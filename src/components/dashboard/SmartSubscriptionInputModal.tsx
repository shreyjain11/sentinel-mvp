'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { 
  X, 
  Plus, 
  Calendar, 
  DollarSign, 
  Globe, 
  Search, 
  Check, 
  AlertCircle,
  Lightbulb,
  Edit3,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Zap
} from "lucide-react"
import { Subscription } from '@/types'
import { SubscriptionService } from '@/lib/subscriptions'
import { 
  POPULAR_SUBSCRIPTION_SERVICES, 
  FREQUENCY_OPTIONS, 
  STATUS_OPTIONS, 
  CATEGORY_OPTIONS,
  findServiceByName,
  searchServices,
  calculateNextRenewalDate,
  SubscriptionService as ServiceData
} from '@/lib/subscription-services'

interface SmartSubscriptionInputModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userId: string
}

interface FormData {
  service_name: string
  amount: string
  currency: string
  billing_cycle: string
  status: 'trial' | 'active' | 'cancelled'
  start_date: string
  next_renewal: string
  trial_end_date: string
  auto_renew: boolean
  category: string
  notes: string
  manual_renewal_override: boolean
}

interface SmartSuggestion {
  type: 'amount' | 'frequency' | 'trial' | 'category'
  value: any
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

interface ConfidenceLevel {
  overall: 'high' | 'medium' | 'low'
  reasons: string[]
  missingFields: string[]
}

export default function SmartSubscriptionInputModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  userId 
}: SmartSubscriptionInputModalProps) {
  const [formData, setFormData] = useState<FormData>({
    service_name: '',
    amount: '',
    currency: 'USD',
    billing_cycle: 'monthly',
    status: 'active',
    start_date: new Date().toISOString().split('T')[0],
    next_renewal: '',
    trial_end_date: '',
    auto_renew: true,
    category: '',
    notes: '',
    manual_renewal_override: false
  })

  const [smartSetupMode, setSmartSetupMode] = useState(false)
  const [serviceSearchQuery, setServiceSearchQuery] = useState('')
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  // Smart suggestions logic
  const smartSuggestions = useMemo((): SmartSuggestion[] => {
    const suggestions: SmartSuggestion[] = []
    const service = findServiceByName(formData.service_name)
    
    if (service) {
      // Amount suggestion
      if (service.defaultAmount && service.defaultAmount > 0 && !formData.amount) {
        suggestions.push({
          type: 'amount',
          value: service.defaultAmount,
          confidence: 'high',
          reason: `${service.name} typically costs $${service.defaultAmount}/${service.defaultFrequency}`
        })
      }

      // Frequency suggestion
      if (service.defaultFrequency !== formData.billing_cycle) {
        suggestions.push({
          type: 'frequency',
          value: service.defaultFrequency,
          confidence: 'high',
          reason: `${service.name} is usually billed ${service.defaultFrequency}`
        })
      }

      // Category suggestion
      if (service.category && service.category !== formData.category) {
        suggestions.push({
          type: 'category',
          value: service.category,
          confidence: 'high',
          reason: `${service.name} is categorized as ${service.category}`
        })
      }

      // Trial suggestion based on common patterns
      const commonTrialServices = ['Netflix', 'Hulu', 'Disney+', 'Apple TV+', 'Amazon Prime', 'Spotify', 'Apple Music']
      if (commonTrialServices.includes(service.name) && formData.status !== 'trial') {
        suggestions.push({
          type: 'trial',
          value: '7 days',
          confidence: 'medium',
          reason: `${service.name} often offers free trials`
        })
      }
    }

    return suggestions
  }, [formData.service_name, formData.amount, formData.billing_cycle, formData.category, formData.status])

  // Confidence assessment
  const confidenceLevel = useMemo((): ConfidenceLevel => {
    const missingFields: string[] = []
    const reasons: string[] = []
    
    if (!formData.service_name) missingFields.push('Service name')
    if (!formData.amount) missingFields.push('Amount')
    if (!formData.category) missingFields.push('Category')
    
    const service = findServiceByName(formData.service_name)
    
    if (service) {
      reasons.push('Known service with standard pricing')
      if (service.defaultAmount && parseFloat(formData.amount) === service.defaultAmount) {
        reasons.push('Amount matches typical pricing')
      }
    } else if (formData.service_name) {
      reasons.push('Custom service - manual verification needed')
    }

    if (formData.amount && parseFloat(formData.amount) > 0) {
      reasons.push('Valid amount provided')
    }

    let overall: 'high' | 'medium' | 'low' = 'low'
    if (missingFields.length === 0 && service && reasons.length >= 2) {
      overall = 'high'
    } else if (missingFields.length <= 1 && formData.service_name && formData.amount) {
      overall = 'medium'
    }

    return { overall, reasons, missingFields }
  }, [formData])

  // Auto-activate smart setup mode when confidence is low or fields are missing
  useEffect(() => {
    if (confidenceLevel.overall === 'low' || confidenceLevel.missingFields.length > 1) {
      setSmartSetupMode(true)
    }
  }, [confidenceLevel])

  // Calculate next renewal date
  useEffect(() => {
    if (formData.start_date && formData.billing_cycle && !formData.manual_renewal_override) {
      const calculated = calculateNextRenewalDate(formData.start_date, formData.billing_cycle)
      setFormData(prev => ({ ...prev, next_renewal: calculated }))
    }
  }, [formData.start_date, formData.billing_cycle, formData.manual_renewal_override])

  // Service search
  const serviceSearchResults = useMemo(() => {
    if (!serviceSearchQuery.trim()) return []
    return searchServices(serviceSearchQuery)
  }, [serviceSearchQuery])

  const handleServiceSelect = (service: ServiceData) => {
    setFormData(prev => ({
      ...prev,
      service_name: service.name,
      category: service.category,
      billing_cycle: service.defaultFrequency
    }))
    setServiceSearchQuery(service.name)
    setShowServiceSuggestions(false)
  }

  const applySuggestion = (suggestion: SmartSuggestion) => {
    switch (suggestion.type) {
      case 'amount':
        setFormData(prev => ({ ...prev, amount: suggestion.value.toString() }))
        break
      case 'frequency':
        setFormData(prev => ({ ...prev, billing_cycle: suggestion.value }))
        break
      case 'category':
        setFormData(prev => ({ ...prev, category: suggestion.value }))
        break
      case 'trial':
        setFormData(prev => ({ 
          ...prev, 
          status: 'trial',
          trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }))
        break
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const subscriptionData = {
        name: formData.service_name,
        service: formData.service_name,
        type: (formData.status === 'trial' ? 'trial' : 'subscription') as 'trial' | 'subscription',
        status: formData.status === 'trial' ? 'active' : formData.status,
        amount: parseFloat(formData.amount) || 0,
        currency: formData.currency,
        billing_cycle: formData.billing_cycle as 'daily' | 'weekly' | 'monthly' | 'yearly',
        start_date: formData.start_date,
        end_date: formData.next_renewal,
        renewal_date: formData.next_renewal,
        trial_end_date: formData.status === 'trial' ? formData.trial_end_date : undefined,
        auto_renew: formData.auto_renew,
        category: formData.category,
        notes: formData.notes,
        confidence_score: confidenceLevel.overall === 'high' ? 0.9 : confidenceLevel.overall === 'medium' ? 0.7 : 0.4,
        created_by: 'manual' as const
      }

      const result = await SubscriptionService.createSubscription(userId, subscriptionData)
      
      if (result) {
        onSuccess()
        handleClose()
      } else {
        setError('Failed to create subscription. Please try again.')
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      service_name: '',
      amount: '',
      currency: 'USD',
      billing_cycle: 'monthly',
      status: 'active',
      start_date: new Date().toISOString().split('T')[0],
      next_renewal: '',
      trial_end_date: '',
      auto_renew: true,
      category: '',
      notes: '',
      manual_renewal_override: false
    })
    setServiceSearchQuery('')
    setShowServiceSuggestions(false)
    setSmartSetupMode(false)
    setShowPreview(false)
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[95vh] overflow-y-auto bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl flex items-center space-x-2 text-card-foreground">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <span>Smart Subscription Input</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              AI-powered subscription entry with smart suggestions
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent>
                  {/* Smart Setup Mode Toggle */}
        <div className="flex items-center justify-between mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-3">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Smart Setup Mode</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Get AI suggestions and field guidance
              </p>
            </div>
          </div>
          <Switch
            checked={smartSetupMode}
            onCheckedChange={setSmartSetupMode}
          />
        </div>

          {/* Confidence Indicator */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <Badge 
                variant={confidenceLevel.overall === 'high' ? 'default' : 
                        confidenceLevel.overall === 'medium' ? 'secondary' : 'destructive'}
                className="flex items-center space-x-1"
              >
                {confidenceLevel.overall === 'high' ? <CheckCircle2 className="w-3 h-3" /> :
                 confidenceLevel.overall === 'medium' ? <AlertTriangle className="w-3 h-3" /> :
                 <HelpCircle className="w-3 h-3" />}
                <span className="capitalize">{confidenceLevel.overall} Confidence</span>
              </Badge>
            </div>
            {smartSetupMode && confidenceLevel.missingFields.length > 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Missing: {confidenceLevel.missingFields.join(', ')}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Service Name with Search */}
                <div className="space-y-2">
                  <Label htmlFor="service_name" className="flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <span>Service Name *</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="service_name"
                      value={serviceSearchQuery}
                      onChange={(e) => {
                        setServiceSearchQuery(e.target.value)
                        setFormData(prev => ({ ...prev, service_name: e.target.value }))
                        setShowServiceSuggestions(true)
                      }}
                      onFocus={() => setShowServiceSuggestions(true)}
                      placeholder="e.g., Netflix, Spotify, ChatGPT..."
                      className={smartSetupMode && !formData.service_name ? 'border-amber-300 dark:border-amber-600' : ''}
                      spellCheck="false"
                      required
                    />
                    <Search className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                    
                    {/* Service Suggestions Dropdown */}
                    {showServiceSuggestions && serviceSearchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                        {serviceSearchResults.map((service, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleServiceSelect(service)}
                            className="w-full text-left px-3 py-2 hover:bg-muted flex items-center space-x-2 text-card-foreground"
                          >
                            <span className="text-lg">{service.icon}</span>
                            <div>
                              <div className="font-medium text-card-foreground">{service.name}</div>
                              <div className="text-xs text-muted-foreground">{service.category}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {smartSetupMode && !formData.service_name && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                      <Lightbulb className="w-3 h-3" />
                      <span>Start typing to see suggestions for popular services</span>
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Billing Amount *</span>
                  </Label>
                  <div className="flex space-x-2">
                    <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      className={`flex-1 ${smartSetupMode && !formData.amount ? 'border-amber-300 dark:border-amber-600' : ''}`}
                      required
                    />
                  </div>
                  {smartSetupMode && !formData.amount && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                      <Lightbulb className="w-3 h-3" />
                      <span>Enter the amount you pay per billing cycle</span>
                    </p>
                  )}
                </div>

                {/* Billing Frequency */}
                <div className="space-y-2">
                  <Label htmlFor="billing_cycle">Billing Frequency *</Label>
                  <Select value={formData.billing_cycle} onValueChange={(value) => setFormData(prev => ({ ...prev, billing_cycle: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'trial' | 'active' | 'cancelled') => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Start Date</span>
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>

                {/* Next Renewal */}
                <div className="space-y-2">
                  <Label htmlFor="next_renewal" className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Next Renewal</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, manual_renewal_override: !prev.manual_renewal_override }))}
                      className="h-auto p-1"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  </Label>
                  <Input
                    id="next_renewal"
                    type="date"
                    value={formData.next_renewal}
                    onChange={(e) => setFormData(prev => ({ ...prev, next_renewal: e.target.value }))}
                    disabled={!formData.manual_renewal_override}
                    className={formData.manual_renewal_override ? '' : 'bg-muted'}
                  />
                  {!formData.manual_renewal_override && (
                                          <p className="text-xs text-muted-foreground">Auto-calculated from start date + frequency</p>
                  )}
                </div>

                {/* Trial End Date (if trial) */}
                {formData.status === 'trial' && (
                  <div className="space-y-2">
                    <Label htmlFor="trial_end_date">Trial End Date</Label>
                    <Input
                      id="trial_end_date"
                      type="date"
                      value={formData.trial_end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, trial_end_date: e.target.value }))}
                    />
                  </div>
                )}

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className={smartSetupMode && !formData.category ? 'border-amber-300 dark:border-amber-600' : ''}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Auto Renew */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_renew"
                    checked={formData.auto_renew}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_renew: checked }))}
                  />
                  <Label htmlFor="auto_renew">Auto-renew enabled</Label>
                </div>
              </div>
            </div>

            {/* Smart Suggestions */}
            {smartSetupMode && smartSuggestions.length > 0 && (
              <div className="border border-border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4" />
                  <span>Smart Suggestions</span>
                </h4>
                <div className="space-y-2">
                  {smartSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-card rounded border border-border">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-card-foreground">{suggestion.reason}</p>
                        <Badge 
                          variant={suggestion.confidence === 'high' ? 'default' : 
                                  suggestion.confidence === 'medium' ? 'secondary' : 'outline'}
                          className="text-xs mt-1"
                        >
                          {suggestion.confidence} confidence
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => applySuggestion(suggestion)}
                      >
                        Apply
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this subscription..."
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-2"
              >
                <Info className="w-4 h-4" />
                <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
              </Button>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex items-center space-x-2">
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Add Subscription</span>
                  </>
                )}
              </Button>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="border border-border rounded-lg p-4 bg-muted">
                <h4 className="font-medium mb-3 text-card-foreground">Subscription Preview</h4>
                <div className="text-sm space-y-1 text-card-foreground">
                  <p><strong>Service:</strong> {formData.service_name || 'Not specified'}</p>
                  <p><strong>Amount:</strong> {formData.currency} {formData.amount || '0.00'}</p>
                  <p><strong>Frequency:</strong> {formData.billing_cycle}</p>
                  <p><strong>Status:</strong> {formData.status}</p>
                  <p><strong>Next Renewal:</strong> {formData.next_renewal || 'Not calculated'}</p>
                  <p><strong>Category:</strong> {formData.category || 'Not specified'}</p>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 