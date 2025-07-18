'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  Mail, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  TrendingUp,
  Eye,
  Filter,
  BarChart3,
  PieChart,
  Target
} from 'lucide-react'
import { GmailService } from '@/lib/gmail'

interface EmailAnalysis {
  email: any
  preFilterResult: 'passed' | 'rejected'
  preFilterReason?: string
  confirmationCheck: 'passed' | 'failed'
  confirmationReason?: string
  aiAnalysis?: any
  finalConfidence: number
  finalDecision: 'accepted' | 'rejected'
  rejectionReason?: string
  processingTime?: number
}

interface AnalyticsStats {
  totalEmails: number
  preFilterPassed: number
  confirmationPassed: number
  aiProcessed: number
  finalAccepted: number
  avgConfidence: number
  avgProcessingTime: number
  topRejectionReasons: { reason: string; count: number }[]
}

export default function ConfidenceAnalyticsPage() {
  const [analyses, setAnalyses] = useState<EmailAnalysis[]>([])
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<EmailAnalysis | null>(null)
  const [filterLevel, setFilterLevel] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  const runFullAnalysis = async () => {
    setLoading(true)
    try {
      console.log('🔍 Starting comprehensive email analysis...')
      
      // Fetch emails
      const emails = await GmailService.fetchRelevantEmails()
      console.log(`📧 Fetched ${emails.length} emails for analysis`)
      
      const emailAnalyses: EmailAnalysis[] = []
      
      for (let i = 0; i < emails.length; i++) {
        const email = emails[i]
        console.log(`\n📊 Analyzing email ${i + 1}/${emails.length}: ${email.subject}`)
        
        const startTime = Date.now()
        const analysis: EmailAnalysis = {
          email,
          preFilterResult: 'passed',
          confirmationCheck: 'passed',
          finalConfidence: 0,
          finalDecision: 'rejected'
        }

        // Step 1: Pre-filtering
        const preFilterResult = await analyzePreFilter(email)
        analysis.preFilterResult = preFilterResult.result
        analysis.preFilterReason = preFilterResult.reason

        if (preFilterResult.result === 'rejected') {
          analysis.finalDecision = 'rejected'
          analysis.rejectionReason = `Pre-filter: ${preFilterResult.reason}`
          analysis.finalConfidence = 0
        } else {
          // Step 2: Confirmation check
          const confirmationResult = analyzeConfirmationKeywords(email)
          analysis.confirmationCheck = confirmationResult.result
          analysis.confirmationReason = confirmationResult.reason

          if (confirmationResult.result === 'failed') {
            analysis.finalDecision = 'rejected'
            analysis.rejectionReason = `Confirmation: ${confirmationResult.reason}`
            analysis.finalConfidence = 0
          } else {
            // Step 3: AI Analysis
            try {
              const aiResult = await performDetailedAIAnalysis(email)
              analysis.aiAnalysis = aiResult
              analysis.finalConfidence = aiResult.confidence
              
              if (aiResult.confidence >= 0.9 && aiResult.isLegitimateService) {
                analysis.finalDecision = 'accepted'
              } else {
                analysis.finalDecision = 'rejected'
                analysis.rejectionReason = aiResult.confidence < 0.9 
                  ? `Low AI confidence: ${(aiResult.confidence * 100).toFixed(1)}%`
                  : 'Not recognized as legitimate service'
              }
            } catch (error) {
              console.error('AI analysis failed:', error)
              analysis.finalDecision = 'rejected'
              analysis.rejectionReason = 'AI analysis failed'
              analysis.finalConfidence = 0
            }
          }
        }

        analysis.processingTime = Date.now() - startTime
        emailAnalyses.push(analysis)
        
        console.log(`✅ Analysis complete: ${analysis.finalDecision} (${(analysis.finalConfidence * 100).toFixed(1)}% confidence)`)
      }
      
      setAnalyses(emailAnalyses)
      calculateAnalyticsStats(emailAnalyses)
      
    } catch (error) {
      console.error('Analysis failed:', error)
    }
    setLoading(false)
  }

  const analyzePreFilter = async (email: any) => {
    const subject = email.subject.toLowerCase()
    const body = email.body.toLowerCase()
    const content = `${subject} ${body}`

    const rejectKeywords = [
      'unsubscribe', 'newsletter', 'marketing', 'promotional', 'sale', 'discount',
      'offer', 'deal', 'free shipping', 'coupon', 'promo', 'spam', 'bulk',
      'mailing list', 'opt-out', 'update your preferences', 'email preferences',
      'notification settings', 'privacy policy', 'terms of service'
    ]

    const matchedRejectKeywords = rejectKeywords.filter(keyword => content.includes(keyword))
    
    if (matchedRejectKeywords.length > 0) {
      return {
        result: 'rejected' as const,
        reason: `Contains marketing keywords: ${matchedRejectKeywords.join(', ')}`
      }
    }

    return {
      result: 'passed' as const,
      reason: 'No marketing keywords detected'
    }
  }

  const analyzeConfirmationKeywords = (email: any) => {
    const subject = email.subject.toLowerCase()
    const body = email.body.toLowerCase()
    const content = `${subject} ${body}`

    const confirmationKeywords = [
      'welcome to', 'subscription confirmed', 'trial started', 'signup confirmed',
      'registration complete', 'account created', 'billing confirmation',
      'payment confirmation', 'subscription activated', 'trial activated',
      'premium account', 'upgrade confirmed', 'plan activated'
    ]

    const matchedConfirmationKeywords = confirmationKeywords.filter(keyword => content.includes(keyword))
    
    if (matchedConfirmationKeywords.length === 0) {
      return {
        result: 'failed' as const,
        reason: 'No subscription confirmation keywords found'
      }
    }

    return {
      result: 'passed' as const,
      reason: `Found confirmation keywords: ${matchedConfirmationKeywords.join(', ')}`
    }
  }

  const performDetailedAIAnalysis = async (email: any) => {
    // Simulate AI analysis for demo
    const mockAIResponse = {
      isSubscription: false,
      serviceName: email.sender.includes('supabase') ? 'Supabase' : 
                   email.sender.includes('resend') ? 'Resend' :
                   email.subject.includes('Basketball') ? 'Basketball Academy' : 'Unknown',
      isLegitimateService: true,
      confidence: 0.1,
      reasoning: {
        isPaidService: email.subject.includes('Payment') ? 'Contains payment reference but appears to be one-time payment' : 'This appears to be a free service confirmation',
        isLegitimate: 'Company appears legitimate but this is not a subscription service',
        hasConfirmation: 'Contains confirmation language but for account creation, not subscription',
        hasPricing: email.subject.includes('Payment') ? 'Contains payment amount but for one-time fee' : 'No subscription pricing detected'
      },
      detectedKeywords: ['confirm', 'account', 'welcome'],
      concerns: ['Not a recurring subscription', 'Free service confirmation', 'One-time payment rather than subscription']
    }

    return mockAIResponse
  }

  const calculateAnalyticsStats = (analyses: EmailAnalysis[]) => {
    const total = analyses.length
    const preFilterPassed = analyses.filter(a => a.preFilterResult === 'passed').length
    const confirmationPassed = analyses.filter(a => a.confirmationCheck === 'passed').length
    const aiProcessed = analyses.filter(a => a.aiAnalysis).length
    const finalAccepted = analyses.filter(a => a.finalDecision === 'accepted').length
    
    const confidenceScores = analyses.map(a => a.finalConfidence).filter(c => c > 0)
    const avgConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length 
      : 0

    const processingTimes = analyses.map(a => a.processingTime || 0).filter(t => t > 0)
    const avgProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0

    // Count rejection reasons
    const rejectionCounts: { [key: string]: number } = {}
    analyses.forEach(a => {
      if (a.rejectionReason) {
        const reason = a.rejectionReason.split(':')[0] // Get the category
        rejectionCounts[reason] = (rejectionCounts[reason] || 0) + 1
      }
    })

    const topRejectionReasons = Object.entries(rejectionCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    setStats({
      totalEmails: total,
      preFilterPassed,
      confirmationPassed,
      aiProcessed,
      finalAccepted,
      avgConfidence,
      avgProcessingTime,
      topRejectionReasons
    })
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'bg-green-100 text-green-800 border-green-300'
    if (confidence >= 0.4) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-red-100 text-red-800 border-red-300'
  }

  const getDecisionColor = (decision: string) => {
    return decision === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const filteredAnalyses = analyses.filter((analysis) => {
    if (filterLevel === 'all') return true
    if (filterLevel === 'high') return analysis.finalConfidence >= 0.7
    if (filterLevel === 'medium') return analysis.finalConfidence >= 0.4 && analysis.finalConfidence < 0.7
    if (filterLevel === 'low') return analysis.finalConfidence < 0.4
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Confidence & Analytics</h1>
          <p className="text-gray-600">Detailed analysis of email parsing decisions and AI reasoning</p>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Button 
                onClick={runFullAnalysis} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Brain className="w-4 h-4 mr-2 animate-pulse" />
                    Analyzing Emails...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Run Full Analysis
                  </>
                )}
              </Button>

              {analyses.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <Button
                    variant={filterLevel === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterLevel('all')}
                  >
                    All ({analyses.length})
                  </Button>
                  <Button
                    variant={filterLevel === 'high' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterLevel('high')}
                  >
                    High (≥70%)
                  </Button>
                  <Button
                    variant={filterLevel === 'medium' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterLevel('medium')}
                  >
                    Medium (40-70%)
                  </Button>
                  <Button
                    variant={filterLevel === 'low' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterLevel('low')}
                  >
                    Low (&lt;40%)
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistics Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Emails</p>
                    <p className="text-2xl font-bold">{stats.totalEmails}</p>
                  </div>
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pre-filter Pass Rate</p>
                    <p className="text-2xl font-bold">{((stats.preFilterPassed / stats.totalEmails) * 100).toFixed(1)}%</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Final Acceptance Rate</p>
                    <p className="text-2xl font-bold">{((stats.finalAccepted / stats.totalEmails) * 100).toFixed(1)}%</p>
                  </div>
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
                    <p className="text-2xl font-bold">{stats.avgProcessingTime.toFixed(0)}ms</p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Email Analysis List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Email Analysis Results ({filteredAnalyses.length})
              </CardTitle>
              <CardDescription>
                Detailed confidence scoring and decision reasoning for each email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredAnalyses.map((analysis, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedEmail === analysis ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedEmail(analysis)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {analysis.email.subject}
                        </h4>
                        <p className="text-xs text-gray-600 truncate">
                          {analysis.email.sender}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={getConfidenceColor(analysis.finalConfidence)}>
                            {(analysis.finalConfidence * 100).toFixed(1)}%
                          </Badge>
                          <Badge className={getDecisionColor(analysis.finalDecision)}>
                            {analysis.finalDecision}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        {analysis.finalDecision === 'accepted' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </div>
                    
                    {analysis.rejectionReason && (
                      <p className="text-xs text-red-600 mt-2 truncate">
                        {analysis.rejectionReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Detailed Analysis
              </CardTitle>
              <CardDescription>
                Step-by-step reasoning and AI analysis results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedEmail ? (
                <div className="space-y-4">
                  {/* Email Info */}
                  <div>
                    <h3 className="font-medium mb-2">Email Information</h3>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <p><strong>Subject:</strong> {selectedEmail.email.subject}</p>
                      <p><strong>From:</strong> {selectedEmail.email.sender}</p>
                      <p><strong>Date:</strong> {new Date(selectedEmail.email.receivedAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Processing Pipeline */}
                  <div>
                    <h3 className="font-medium mb-2">Processing Pipeline</h3>
                    <div className="space-y-3">
                      
                      {/* Step 1: Pre-filter */}
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            selectedEmail.preFilterResult === 'passed' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className="text-sm font-medium">Pre-filter</span>
                        </div>
                        <Badge variant={selectedEmail.preFilterResult === 'passed' ? 'default' : 'destructive'}>
                          {selectedEmail.preFilterResult}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 ml-5">{selectedEmail.preFilterReason}</p>

                      {/* Step 2: Confirmation Check */}
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            selectedEmail.confirmationCheck === 'passed' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className="text-sm font-medium">Confirmation Check</span>
                        </div>
                        <Badge variant={selectedEmail.confirmationCheck === 'passed' ? 'default' : 'destructive'}>
                          {selectedEmail.confirmationCheck}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 ml-5">{selectedEmail.confirmationReason}</p>

                      {/* Step 3: AI Analysis */}
                      {selectedEmail.aiAnalysis && (
                        <>
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500" />
                              <span className="text-sm font-medium">AI Analysis</span>
                            </div>
                            <Badge className={getConfidenceColor(selectedEmail.finalConfidence)}>
                              {(selectedEmail.finalConfidence * 100).toFixed(1)}%
                            </Badge>
                          </div>
                          
                          {/* AI Reasoning */}
                          <div className="ml-5 space-y-2">
                            <div className="bg-blue-50 p-3 rounded text-sm">
                              <p><strong>Service:</strong> {selectedEmail.aiAnalysis.serviceName}</p>
                              <p><strong>Is Subscription:</strong> {selectedEmail.aiAnalysis.isSubscription ? 'Yes' : 'No'}</p>
                              <p><strong>Is Legitimate:</strong> {selectedEmail.aiAnalysis.isLegitimateService ? 'Yes' : 'No'}</p>
                            </div>
                            
                            {selectedEmail.aiAnalysis.reasoning && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm">AI Reasoning:</h4>
                                {Object.entries(selectedEmail.aiAnalysis.reasoning).map(([key, value]) => (
                                  <div key={key} className="bg-gray-50 p-2 rounded text-xs">
                                    <strong>{key}:</strong> {value as string}
                                  </div>
                                ))}
                              </div>
                            )}

                            {selectedEmail.aiAnalysis.concerns && selectedEmail.aiAnalysis.concerns.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm">Concerns:</h4>
                                <ul className="text-xs text-red-600 space-y-1">
                                  {selectedEmail.aiAnalysis.concerns.map((concern: string, idx: number) => (
                                    <li key={idx}>• {concern}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Final Decision */}
                      <div className="flex items-center justify-between p-2 bg-gray-100 rounded border">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            selectedEmail.finalDecision === 'accepted' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className="text-sm font-medium">Final Decision</span>
                        </div>
                        <Badge className={getDecisionColor(selectedEmail.finalDecision)}>
                          {selectedEmail.finalDecision}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Confidence Breakdown */}
                  <div>
                    <h3 className="font-medium mb-2">Confidence Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Final Confidence Score</span>
                        <span className="font-medium">{(selectedEmail.finalConfidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${selectedEmail.finalConfidence * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Select an email to view detailed analysis</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Rejection Reasons Analysis */}
        {stats && stats.topRejectionReasons.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Top Rejection Reasons
              </CardTitle>
              <CardDescription>
                Most common reasons emails were rejected by the AI system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topRejectionReasons.map((reason, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{reason.reason}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${(reason.count / stats.totalEmails) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{reason.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
} 