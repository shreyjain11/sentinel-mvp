'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import EnhancedAddSubscriptionModal from "@/components/dashboard/EnhancedAddSubscriptionModal"
import { getCurrentUser } from "@/lib/auth"

export default function TestEnhancedModalPage() {
  const [showModal, setShowModal] = useState(false)
  const [userId, setUserId] = useState<string>('')

  const handleOpenModal = async () => {
    try {
      const user = await getCurrentUser()
      if (user) {
        setUserId(user.id)
        setShowModal(true)
      } else {
        alert('Please log in first')
      }
    } catch (error) {
      console.error('Error getting user:', error)
      alert('Error getting user information')
    }
  }

  const handleSuccess = () => {
    console.log('Subscription added successfully!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Enhanced Subscription Modal Demo</CardTitle>
            <CardDescription>
              Test the new enhanced subscription input flow with autocomplete, smart defaults, and improved UX
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Features to Test:</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>🔍 <strong>Service Name Autocomplete:</strong> Start typing to see suggestions from 100+ popular services</li>
                  <li>💰 <strong>Smart Defaults:</strong> Auto-fill frequency and amount when selecting known services</li>
                  <li>📅 <strong>Auto-calculated Renewal:</strong> Automatically calculates next renewal date based on frequency</li>
                  <li>✅ <strong>Form Validation:</strong> Real-time validation with helpful error messages</li>
                  <li>🎨 <strong>Beautiful UI:</strong> Clean, modern design with proper mobile responsiveness</li>
                  <li>💳 <strong>Currency Formatting:</strong> Proper USD formatting with $ symbol</li>
                  <li>📱 <strong>Mobile Optimized:</strong> Full-screen modal on mobile devices</li>
                  <li>🎯 <strong>Success Preview:</strong> Shows subscription card after successful creation</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Try These Test Cases:</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Type "Netflix" in service name - should auto-fill monthly frequency and $15.99</li>
                  <li>Type "Spotify" - should auto-fill monthly frequency and $9.99</li>
                  <li>Type "Figma" - should auto-fill monthly frequency and $12</li>
                  <li>Try a custom service name not in the list</li>
                  <li>Test different frequencies and see renewal date auto-calculate</li>
                  <li>Try the trial status and see trial end date field appear</li>
                </ul>
              </div>

              <Button onClick={handleOpenModal} size="lg" className="w-full">
                🚀 Open Enhanced Subscription Modal
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Technical Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Database Schema:</h4>
                <p className="text-sm text-muted-foreground">
                  Uses existing <code>subscriptions</code> table with fields: user_id, service_name, amount, 
                  frequency, renewal_date, status, trial_end_date, notes, created_at, updated_at
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Service Database:</h4>
                <p className="text-sm text-muted-foreground">
                  100+ popular subscription services with default frequencies, amounts, and categories
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Validation Rules:</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  <li>Service name is required</li>
                  <li>Amount must be positive (if provided)</li>
                  <li>Start date is required</li>
                  <li>Trial end date required for trial status</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {userId && (
        <EnhancedAddSubscriptionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
          userId={userId}
        />
      )}
    </div>
  )
} 