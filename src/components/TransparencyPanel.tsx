'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Brain, CheckCircle, XCircle, Eye, Calendar, Target, BarChart3, Clock, Info, AlertTriangle } from "lucide-react"
import { Subscription } from '@/types'

interface TransparencyPanelProps {
  subscription: Subscription
  className?: string
}

interface AIParsingDetails {
  confidenceScore: number
  keywordsMatched: string[]
  lastScanDate: string
  detectionMethod: string
  userApproved: boolean
  activityLog: Array<{
    date: string
    action: string
    details: string
  }>
}

export function TransparencyPanel({ subscription, className = '' }: TransparencyPanelProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [userApproved, setUserApproved] = useState(subscription.created_by === 'ai' ? false : true)

  // Mock AI parsing details - in real app, this would come from the database
  const aiDetails: AIParsingDetails = {
    confidenceScore: subscription.confidence_score || 85,
    keywordsMatched: [
      'subscription',
      'billing',
      'renewal',
      'payment',
      subscription.service.toLowerCase(),
      subscription.billing_cycle
    ],
    lastScanDate: subscription.created_at,
    detectionMethod: subscription.created_by === 'ai' ? 'Email Parsing' : 'Manual Entry',
    userApproved: userApproved,
    activityLog: [
      {
        date: subscription.created_at,
        action: subscription.created_by === 'ai' ? 'AI Detected' : 'Manually Added',
        details: subscription.created_by === 'ai' ? 'Found in email scan' : 'User entered manually'
      },
      {
        date: subscription.updated_at,
        action: 'Last Updated',
        details: 'Subscription details modified'
      }
    ]
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400'
    if (score >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getConfidenceLabel = (score: number) => {
    if (score >= 90) return 'Very High'
    if (score >= 70) return 'High'
    if (score >= 50) return 'Medium'
    return 'Low'
  }

  const getConfidenceIcon = (score: number) => {
    if (score >= 90) return CheckCircle
    if (score >= 70) return Target
    return AlertTriangle
  }

  const ConfidenceIcon = getConfidenceIcon(aiDetails.confidenceScore)

  return (
    <Card className={`transparency-panel ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-premium-blue to-premium-purple rounded-xl flex items-center justify-center">
                                <Brain className="w-5 h-5 text-card-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-foreground">
                AI Transparency
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                How we detected this subscription
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">AI Approved</span>
            <Switch
              checked={userApproved}
              onCheckedChange={setUserApproved}
              className="data-[state=checked]:bg-premium-blue"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confidence Score */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-foreground flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Confidence Score</span>
            </h4>
            <div className={`flex items-center space-x-2 ${getConfidenceColor(aiDetails.confidenceScore)}`}>
              <ConfidenceIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{getConfidenceLabel(aiDetails.confidenceScore)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    aiDetails.confidenceScore >= 90 ? 'bg-emerald-400' :
                    aiDetails.confidenceScore >= 70 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${aiDetails.confidenceScore}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-medium text-foreground">
              {aiDetails.confidenceScore}%
            </span>
          </div>
        </div>

        {/* Detection Method */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-muted/30 border border-border">
            <div className="flex items-center space-x-2 mb-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-foreground">Detection Method</span>
            </div>
            <p className="text-sm text-muted-foreground">{aiDetails.detectionMethod}</p>
          </div>
          
          <div className="p-3 rounded-xl bg-muted/30 border border-border">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-foreground">Last Scan</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(aiDetails.lastScanDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Keywords Matched */}
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground flex items-center space-x-2">
            <Target className="w-4 h-4 text-amber-400" />
            <span>Keywords Matched</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {aiDetails.keywordsMatched.map((keyword, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-premium-blue/10 text-premium-blue border border-premium-blue/30 rounded-full text-xs"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {/* Activity Log */}
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground flex items-center space-x-2">
            <Clock className="w-4 h-4 text-green-400" />
            <span>Activity Log</span>
          </h4>
          <div className="activity-log">
            {aiDetails.activityLog.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-2 rounded-lg bg-muted/20">
                <div className="w-2 h-2 rounded-full bg-premium-blue mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">{activity.action}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{activity.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="premium-button-outline"
          >
            <Eye className="w-4 h-4 mr-2" />
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="premium-button-outline"
            onClick={() => {
              // Toggle approval status
              setUserApproved(!userApproved)
            }}
          >
            {userApproved ? (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Reject Detection
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Detection
              </>
            )}
          </Button>
        </div>

        {/* Additional Info */}
        {showDetails && (
          <div className="p-4 rounded-xl bg-muted/30 border border-border">
            <h4 className="font-semibold text-foreground mb-3">How AI Detection Works</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Sentinel uses advanced natural language processing to scan your emails for subscription-related information. 
              We look for billing confirmations, renewal notices, and payment receipts to automatically detect subscriptions.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-premium-blue mt-2 flex-shrink-0" />
                <span className="text-muted-foreground">Keywords and patterns are matched against known subscription emails</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-premium-blue mt-2 flex-shrink-0" />
                <span className="text-muted-foreground">Confidence scores are calculated based on match quality</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-premium-blue mt-2 flex-shrink-0" />
                <span className="text-muted-foreground">You can approve or reject any AI detection</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <strong>Privacy Note:</strong> We only scan emails you explicitly allow. 
                  No data is stored or processed without your consent.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Approval Status */}
        <div className={`p-3 rounded-xl border ${
          userApproved 
            ? 'bg-emerald-500/10 border-emerald-500/30' 
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className="flex items-center space-x-2">
            {userApproved ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-sm font-medium ${
              userApproved ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {userApproved ? 'AI Detection Approved' : 'AI Detection Pending Approval'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {userApproved 
              ? 'This subscription has been verified and is actively tracked.'
              : 'Please review and approve this AI detection to start tracking.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 