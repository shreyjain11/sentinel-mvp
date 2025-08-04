'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Lock, Clock, DollarSign, FileText, Eye, Shield, Info, ExternalLink } from "lucide-react"
import { Subscription } from '@/types'

interface ContractLockInDetectorProps {
  subscription: Subscription
  className?: string
}

interface RiskAnalysis {
  riskLevel: 'safe' | 'medium' | 'high'
  warnings: string[]
  tips: string[]
  contractTerms: string[]
  earlyTerminationFee?: string
  lockInPeriod?: string
}

export function ContractLockInDetector({ subscription, className = '' }: ContractLockInDetectorProps) {
  const [showDetails, setShowDetails] = useState(false)

  // Analyze subscription for contract risks
  const analyzeContractRisk = (sub: Subscription): RiskAnalysis => {
    const warnings: string[] = []
    const tips: string[] = []
    const contractTerms: string[] = []
    let riskLevel: 'safe' | 'medium' | 'high' = 'safe'
    let earlyTerminationFee: string | undefined
    let lockInPeriod: string | undefined

    // Check for long-term commitments
    if (sub.billing_cycle === 'yearly' && sub.amount && sub.amount > 100) {
      warnings.push('High annual commitment detected')
      tips.push('Consider monthly billing to reduce commitment')
      contractTerms.push('Annual billing with high upfront cost')
      riskLevel = 'medium'
    }

    // Check for multi-year terms (based on service patterns)
    const multiYearServices = ['xfinity', 'comcast', 'spectrum', 'at&t', 'verizon', 'directv']
    if (multiYearServices.some(service => sub.service.toLowerCase().includes(service))) {
      warnings.push('Potential multi-year contract detected')
      tips.push('Check for early termination fees before canceling')
      contractTerms.push('Common provider with long-term contracts')
      riskLevel = 'high'
      earlyTerminationFee = 'Typically $200-400'
      lockInPeriod = 'Usually 12-24 months'
    }

    // Check for trial-to-paid conversions
    if (sub.type === 'trial' && sub.auto_renew) {
      warnings.push('Auto-renewal enabled on trial')
      tips.push('Set calendar reminder before trial ends')
      contractTerms.push('Trial converts to paid automatically')
      riskLevel = riskLevel === 'safe' ? 'medium' : riskLevel
    }

    // Check for high-value subscriptions
    if (sub.amount && sub.amount > 50) {
      warnings.push('High-value subscription')
      tips.push('Review usage to ensure value for money')
      contractTerms.push('Premium pricing tier')
      riskLevel = riskLevel === 'safe' ? 'medium' : riskLevel
    }

    // Check for specific service risks
    if (sub.service.toLowerCase().includes('adobe')) {
      warnings.push('Adobe Creative Cloud detected')
      tips.push('Adobe has 12-month minimum commitment')
      contractTerms.push('12-month minimum contract term')
      riskLevel = 'high'
      earlyTerminationFee = 'Remaining months of annual plan'
      lockInPeriod = '12 months minimum'
    }

    if (sub.service.toLowerCase().includes('gym') || sub.service.toLowerCase().includes('fitness')) {
      warnings.push('Gym membership detected')
      tips.push('Gyms often have strict cancellation policies')
      contractTerms.push('Physical location may require in-person cancellation')
      riskLevel = 'medium'
    }

    // Check for streaming services with annual plans
    const streamingServices = ['netflix', 'hulu', 'disney', 'paramount', 'peacock']
    if (streamingServices.some(service => sub.service.toLowerCase().includes(service)) && sub.billing_cycle === 'yearly') {
      warnings.push('Annual streaming subscription')
      tips.push('Most streaming services allow monthly cancellation')
      contractTerms.push('Annual billing but typically no lock-in')
      riskLevel = 'safe'
    }

    return {
      riskLevel,
      warnings,
      tips,
      contractTerms,
      earlyTerminationFee,
      lockInPeriod
    }
  }

  const riskAnalysis = analyzeContractRisk(subscription)

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'safe': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/30'
      default: return 'text-muted-foreground bg-muted border-border'
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'safe': return Shield
      case 'medium': return AlertTriangle
      case 'high': return Lock
      default: return Info
    }
  }

  const RiskIcon = getRiskIcon(riskAnalysis.riskLevel)

  if (riskAnalysis.riskLevel === 'safe' && !showDetails) {
    return null // Don't show for safe subscriptions unless user wants details
  }

  return (
    <Card className={`premium-card ${className} ${riskAnalysis.riskLevel === 'high' ? 'contract-warning' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getRiskColor(riskAnalysis.riskLevel)}`}>
              <RiskIcon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-foreground">
                Contract Lock-In Analysis
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Risk assessment for {subscription.service}
              </CardDescription>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(riskAnalysis.riskLevel)}`}>
            {riskAnalysis.riskLevel.toUpperCase()} RISK
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Summary */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-start space-x-3">
            <RiskIcon className="w-5 h-5 mt-0.5 text-foreground" />
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                {riskAnalysis.riskLevel === 'safe' ? 'Safe to Cancel' : 
                 riskAnalysis.riskLevel === 'medium' ? 'Medium Risk - Review Terms' : 
                 'High Risk - Check Contract Terms'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {riskAnalysis.riskLevel === 'safe' ? 'This subscription appears to have no lock-in period or hidden fees.' :
                 riskAnalysis.riskLevel === 'medium' ? 'This subscription may have some restrictions or fees to consider.' :
                 'This subscription likely has significant lock-in terms or early termination fees.'}
              </p>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {riskAnalysis.warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Warnings</span>
            </h4>
            <ul className="space-y-1">
              {riskAnalysis.warnings.map((warning, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                  <span className="text-muted-foreground">{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Contract Terms */}
        {riskAnalysis.contractTerms.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Contract Terms</span>
            </h4>
            <ul className="space-y-1">
              {riskAnalysis.contractTerms.map((term, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                  <span className="text-muted-foreground">{term}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Specific Fees/Periods */}
        {(riskAnalysis.earlyTerminationFee || riskAnalysis.lockInPeriod) && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <h4 className="font-semibold text-red-400 mb-3 flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <span>Contract Details</span>
            </h4>
            <div className="space-y-2 text-sm">
              {riskAnalysis.lockInPeriod && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Lock-in Period: <span className="text-foreground font-medium">{riskAnalysis.lockInPeriod}</span></span>
                </div>
              )}
              {riskAnalysis.earlyTerminationFee && (
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Early Termination Fee: <span className="text-foreground font-medium">{riskAnalysis.earlyTerminationFee}</span></span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tips */}
        {riskAnalysis.tips.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground flex items-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Tips & Recommendations</span>
            </h4>
            <ul className="space-y-1">
              {riskAnalysis.tips.map((tip, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                  <span className="text-muted-foreground">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

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
              // Open service's terms page or cancellation page
              const serviceName = subscription.service.toLowerCase()
              let termsUrl = ''
              
              if (serviceName.includes('adobe')) termsUrl = 'https://www.adobe.com/legal/subscription-terms.html'
              else if (serviceName.includes('netflix')) termsUrl = 'https://help.netflix.com/legal/termsofuse'
              else if (serviceName.includes('spotify')) termsUrl = 'https://www.spotify.com/legal/end-user-agreement/'
              else if (serviceName.includes('microsoft')) termsUrl = 'https://www.microsoft.com/en-us/servicesagreement'
              
              if (termsUrl) {
                window.open(termsUrl, '_blank')
              }
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Terms
          </Button>
        </div>

        {/* Additional Info */}
        {showDetails && (
          <div className="p-4 rounded-xl bg-muted/30 border border-border">
            <h4 className="font-semibold text-foreground mb-3">How This Analysis Works</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Sentinel analyzes your subscription based on service patterns, billing cycles, and known contract terms. 
              This helps identify potential lock-in periods, early termination fees, and cancellation restrictions.
            </p>
            <div className="text-xs text-muted-foreground">
              <p><strong>Note:</strong> This analysis is based on common patterns and may not reflect your specific contract terms. 
              Always verify with the service provider before canceling.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 