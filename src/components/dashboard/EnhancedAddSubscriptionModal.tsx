'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { X, Plus, Calendar, DollarSign, Globe, Search, Check, AlertCircle } from "lucide-react"
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

interface EnhancedAddSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userId: string
}

interface FormData {
  service_name: string
  amount: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  start_date: string
  renewal_date: string
  status: 'trial' | 'active' | 'cancelled'
  trial_end_date: string
  notes: string
  category: string
}

export default function EnhancedAddSubscriptionModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  userId 
}: EnhancedAddSubscriptionModalProps) {
  const [loading, setLoading] = useState(false)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [searchResults, setSearchResults] = useState<ServiceData[]>([])
  const [selectedService, setSelectedService] = useState<ServiceData | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdSubscription, setCreatedSubscription] = useState<Subscription | null>(null)
  
  const autocompleteRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<FormData>({
    service_name: '',
    amount: '',
    frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    renewal_date: '',
    status: 'active',
    trial_end_date: '',
    notes: '',
    category: ''
  })

  // Handle click outside autocomplete
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-calculate renewal date when start date or frequency changes
  useEffect(() => {
    if (formData.start_date) {
      const nextRenewal = calculateNextRenewalDate(formData.start_date, formData.frequency)
      setFormData(prev => ({ ...prev, renewal_date: nextRenewal }))
    }
  }, [formData.start_date, formData.frequency])

  // Handle service search
  const handleServiceSearch = (query: string) => {
    setFormData(prev => ({ ...prev, service_name: query }))
    
    if (query.length >= 2) {
      const results = searchServices(query)
      setSearchResults(results)
      setShowAutocomplete(true)
    } else {
      setSearchResults([])
      setShowAutocomplete(false)
    }
  }

  // Handle service selection
  const handleServiceSelect = (service: ServiceData) => {
    setSelectedService(service)
    setFormData(prev => ({
      ...prev,
      service_name: service.name,
      frequency: service.defaultFrequency,
      amount: service.defaultAmount?.toString() || '',
      category: service.category
    }))
    setShowAutocomplete(false)
    setErrors(prev => ({ ...prev, service_name: '' }))
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.service_name.trim()) {
      newErrors.service_name = 'Service name is required'
    }

    if (formData.amount && parseFloat(formData.amount) < 0) {
      newErrors.amount = 'Amount must be positive'
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required'
    }

    if (formData.status === 'trial' && !formData.trial_end_date) {
      newErrors.trial_end_date = 'Trial end date is required for trial subscriptions'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Format currency input
  const formatCurrency = (value: string): string => {
    // Remove all non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '')
    
    // Ensure only one decimal point
    const parts = numericValue.split('.')
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('')
    }
    
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].slice(0, 2)
    }
    
    return numericValue
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const subscriptionData: Partial<Subscription> = {
        name: formData.service_name,
        service: formData.service_name,
        type: formData.status === 'trial' ? 'trial' : 'subscription',
        status: formData.status === 'trial' ? 'active' : formData.status,
        amount: parseFloat(formData.amount) || undefined,
        currency: 'USD',
        billing_cycle: formData.frequency,
        start_date: formData.start_date,
        end_date: formData.renewal_date || formData.start_date,
        renewal_date: formData.renewal_date || undefined,
        trial_end_date: formData.trial_end_date || undefined,
        auto_renew: formData.status === 'active',
        category: formData.category,
        notes: formData.notes,
        created_by: 'manual'
      }

      const result = await SubscriptionService.createSubscription(userId, subscriptionData)
      
      if (result) {
        setCreatedSubscription(result)
        setShowSuccess(true)
        onSuccess()
        
        // Reset form after a delay
        setTimeout(() => {
          resetForm()
          onClose()
        }, 3000)
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      setErrors({ submit: 'Failed to create subscription. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      service_name: '',
      amount: '',
      frequency: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      renewal_date: '',
      status: 'active',
      trial_end_date: '',
      notes: '',
      category: ''
    })
    setSelectedService(null)
    setErrors({})
    setShowSuccess(false)
    setCreatedSubscription(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  if (showSuccess && createdSubscription) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-xl text-green-600">Subscription Added!</CardTitle>
            <CardDescription>
              Your subscription has been successfully created
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{createdSubscription.name}</h4>
                <Badge variant={createdSubscription.status === 'active' ? 'default' : 'secondary'}>
                  {createdSubscription.status}
                </Badge>
              </div>
              {createdSubscription.amount && (
                <p className="text-sm text-muted-foreground">
                  ${createdSubscription.amount} / {createdSubscription.billing_cycle}
                </p>
              )}
              {createdSubscription.renewal_date && (
                <p className="text-sm text-muted-foreground">
                  Next renewal: {new Date(createdSubscription.renewal_date).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleClose} variant="outline">
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl">Add New Subscription</CardTitle>
            <CardDescription>
              Quickly add a subscription with smart suggestions
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Name with Autocomplete */}
            <div className="space-y-2">
              <Label htmlFor="service_name">Service Name *</Label>
              <div className="relative">
                <Input
                  ref={inputRef}
                  id="service_name"
                  value={formData.service_name}
                  onChange={(e) => handleServiceSearch(e.target.value)}
                  placeholder="Start typing to search services..."
                  className={errors.service_name ? 'border-red-500' : ''}
                  required
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                
                {/* Autocomplete Dropdown */}
                {showAutocomplete && searchResults.length > 0 && (
                  <div
                    ref={autocompleteRef}
                    className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto"
                  >
                    {searchResults.map((service) => (
                      <button
                        key={service.name}
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-muted flex items-center space-x-3"
                        onClick={() => handleServiceSelect(service)}
                      >
                        <span className="text-lg">{service.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-muted-foreground">{service.category}</div>
                        </div>
                        {service.defaultAmount && (
                          <div className="text-sm text-muted-foreground">
                            ${service.defaultAmount}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.service_name && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.service_name}
                </p>
              )}
            </div>

            {/* Billing Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="amount">Amount (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: formatCurrency(e.target.value) })}
                    placeholder="0.00"
                    className={`pl-8 ${errors.amount ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.amount && (
                  <p className="text-sm text-red-500">{errors.amount}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="frequency">Billing Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value: FormData['frequency']) => 
                    setFormData({ ...formData, frequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: FormData['status']) => 
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className={errors.start_date ? 'border-red-500' : ''}
                  required
                />
                {errors.start_date && (
                  <p className="text-sm text-red-500">{errors.start_date}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="renewal_date">
                  Next Renewal Date
                  <span className="text-xs text-muted-foreground ml-1">(auto-calculated)</span>
                </Label>
                <Input
                  id="renewal_date"
                  type="date"
                  value={formData.renewal_date}
                  onChange={(e) => setFormData({ ...formData, renewal_date: e.target.value })}
                />
              </div>
            </div>

            {/* Trial End Date (conditional) */}
            {formData.status === 'trial' && (
              <div>
                <Label htmlFor="trial_end_date">Trial End Date *</Label>
                <Input
                  id="trial_end_date"
                  type="date"
                  value={formData.trial_end_date}
                  onChange={(e) => setFormData({ ...formData, trial_end_date: e.target.value })}
                  className={errors.trial_end_date ? 'border-red-500' : ''}
                  required
                />
                {errors.trial_end_date && (
                  <p className="text-sm text-red-500">{errors.trial_end_date}</p>
                )}
              </div>
            )}

            {/* Category */}
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes about this subscription..."
                rows={3}
              />
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {errors.submit}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Subscription'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 