'use client'

import { useState, useEffect } from 'react'
import { GmailService, GmailEmail, ParsedSubscription } from '@/lib/gmail'
import { SubscriptionService } from '@/lib/subscriptions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Mail, 
  Brain, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Eye
} from 'lucide-react'

interface EmailWithParsing {
  email: GmailEmail
  parsed: ParsedSubscription | null
  processing: boolean
  error?: string
}

export default function DebugGmailPage() {
  const [emails, setEmails] = useState<EmailWithParsing[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<EmailWithParsing | null>(null)
  const [stats, setStats] = useState({
    totalEmails: 0,
    successfulParses: 0,
    averageConfidence: 0,
    highConfidence: 0,
    lowConfidence: 0
  })
  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null)

  const fetchEmails = async () => {
    setLoading(true)
    try {
      console.log('Fetching emails for debug...')
      
      // First check if Gmail is connected
      const isConnected = await GmailService.isGmailConnected()
      if (!isConnected) {
        console.error('Gmail is not connected')
        setLoading(false)
        return
      }

      const fetchedEmails = await GmailService.fetchRelevantEmails()
      console.log(`Fetched ${fetchedEmails.length} emails`)

      const emailsWithParsing: EmailWithParsing[] = fetchedEmails.map(email => ({
        email,
        parsed: null,
        processing: false
      }))

      setEmails(emailsWithParsing)
      calculateStats(emailsWithParsing)
    } catch (error) {
      console.error('Error fetching emails:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      console.error('Error fetching emails:', errorMessage)
      // Let the UI handle error display instead of alerts
    } finally {
      setLoading(false)
    }
  }

  const parseEmail = async (index: number) => {
    const emailItem = emails[index]
    if (!emailItem || emailItem.processing) return

    const updatedEmails = [...emails]
    updatedEmails[index] = { ...emailItem, processing: true, error: undefined }
    setEmails(updatedEmails)

    try {
      console.log(`Parsing email: ${emailItem.email.subject}`)
      const parsed = await GmailService.parseEmailWithAI(emailItem.email)
      
      updatedEmails[index] = { 
        ...emailItem, 
        parsed, 
        processing: false,
        error: parsed ? undefined : 'AI determined this is not a subscription email'
      }
      setEmails(updatedEmails)
      calculateStats(updatedEmails)
    } catch (error) {
      console.error('Error parsing email:', error)
      updatedEmails[index] = { 
        ...emailItem, 
        processing: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      setEmails(updatedEmails)
    }
  }

  const parseAllEmails = async () => {
    setLoading(true)
    const updatedEmails = [...emails]
    
    for (let i = 0; i < updatedEmails.length; i++) {
      if (updatedEmails[i].parsed) continue
      
      updatedEmails[i] = { ...updatedEmails[i], processing: true }
      setEmails([...updatedEmails])
      
      try {
        const parsed = await GmailService.parseEmailWithAI(updatedEmails[i].email)
        updatedEmails[i] = { 
          ...updatedEmails[i], 
          parsed, 
          processing: false,
          error: parsed ? undefined : 'Not a subscription email'
        }
      } catch (error) {
        updatedEmails[i] = { 
          ...updatedEmails[i], 
          processing: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
      
      setEmails([...updatedEmails])
    }
    
    calculateStats(updatedEmails)
    setLoading(false)
  }

  const saveToDatabase = async (emailWithParsing: EmailWithParsing) => {
    if (!emailWithParsing.parsed) return

    try {
      const result = await SubscriptionService.createFromParsedData(emailWithParsing.parsed)
      if (result) {
        console.log(`Successfully saved ${emailWithParsing.parsed.serviceName} to database`)
      } else {
        console.error('Failed to save to database')
      }
    } catch (error) {
      console.error('Error saving to database:', error)
      console.error('Error saving to database:', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const calculateStats = (emailList: EmailWithParsing[]) => {
    const successfulParses = emailList.filter(e => e.parsed).length
    const confidenceScores = emailList
      .filter(e => e.parsed)
      .map(e => e.parsed!.confidence)
    
    const averageConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length 
      : 0

    const highConfidence = confidenceScores.filter(conf => conf >= 0.7).length
    const lowConfidence = confidenceScores.filter(conf => conf < 0.5).length

    setStats({
      totalEmails: emailList.length,
      successfulParses,
      averageConfidence,
      highConfidence,
      lowConfidence
    })
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'bg-green-100 text-green-800'
    if (confidence >= 0.5) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  useEffect(() => {
    const checkGmailConnection = async () => {
      const isConnected = await GmailService.isGmailConnected()
      setGmailConnected(isConnected)
      
      if (isConnected) {
        fetchEmails()
      }
    }
    
    checkGmailConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gmail Parsing Debug</h1>
            <p className="text-gray-600 mt-2">
              Test and debug AI-powered email parsing for subscription detection
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchEmails} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Fetch Emails
            </Button>
            <Button onClick={parseAllEmails} disabled={loading || emails.length === 0}>
              <Brain className="w-4 h-4 mr-2" />
              Parse All with AI
            </Button>
          </div>
        </div>

        {/* Gmail Connection Status */}
        {gmailConnected !== null && (
          <Card className={`mb-6 ${gmailConnected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className={`w-5 h-5 ${gmailConnected ? 'text-green-600' : 'text-red-600'}`} />
                  <div>
                    <h3 className={`font-medium ${gmailConnected ? 'text-green-900' : 'text-red-900'}`}>
                      {gmailConnected ? 'Gmail Connected' : 'Gmail Not Connected'}
                    </h3>
                    <p className={`text-sm ${gmailConnected ? 'text-green-700' : 'text-red-700'}`}>
                      {gmailConnected 
                        ? 'Ready to fetch and parse emails' 
                        : 'Go to dashboard to connect Gmail first'
                      }
                    </p>
                  </div>
                </div>
                {!gmailConnected && (
                  <Button onClick={() => window.location.href = '/dashboard'}>
                    Connect Gmail
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
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
                  <p className="text-sm font-medium text-gray-600">Successful Parses</p>
                  <p className="text-2xl font-bold">{stats.successfulParses}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                  <p className="text-2xl font-bold">{(stats.averageConfidence * 100).toFixed(1)}%</p>
                </div>
                <Brain className="w-5 h-5 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">High Confidence</p>
                  <p className="text-2xl font-bold">{stats.highConfidence}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Confidence</p>
                  <p className="text-2xl font-bold">{stats.lowConfidence}</p>
                </div>
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email List and Details */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Email List */}
          <Card>
            <CardHeader>
              <CardTitle>Email List ({emails.length})</CardTitle>
              <CardDescription>
                Click on an email to view details and parsing results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emails.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No emails loaded. Click "Fetch Emails" to start.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {emails.map((emailItem, index) => (
                    <div
                      key={emailItem.email.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedEmail?.email.id === emailItem.email.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedEmail(emailItem)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {emailItem.email.subject}
                          </h4>
                          <p className="text-xs text-gray-600 truncate">
                            {emailItem.email.sender}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(emailItem.email.receivedAt)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          {emailItem.processing && (
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                          )}
                          {emailItem.parsed && (
                            <Badge className={getConfidenceColor(emailItem.parsed.confidence)}>
                              {(emailItem.parsed.confidence * 100).toFixed(0)}%
                            </Badge>
                          )}
                          {emailItem.error && (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              parseEmail(index)
                            }}
                            disabled={emailItem.processing}
                          >
                            {emailItem.processing ? 'Parsing...' : 'Parse'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Details */}
          <Card>
            <CardHeader>
              <CardTitle>Email Details & Results</CardTitle>
              <CardDescription>
                {selectedEmail ? selectedEmail.email.subject : 'Select an email to view details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedEmail ? (
                <div className="text-center py-8">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select an email to view details</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Email Info */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-lg">Email Content</h3>
                    <div>
                      <Label className="text-sm font-medium">From</Label>
                      <div className="p-2 bg-gray-50 rounded border text-sm">
                        {selectedEmail.email.sender}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Subject</Label>
                      <div className="p-2 bg-gray-50 rounded border text-sm">
                        {selectedEmail.email.subject}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Body Preview</Label>
                      <Textarea
                        value={selectedEmail.email.body.substring(0, 500) + (selectedEmail.email.body.length > 500 ? '...' : '')}
                        readOnly
                        className="h-32 text-xs"
                      />
                    </div>
                  </div>

                  {/* Parsing Results */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-lg">AI Parsing Results</h3>
                    {selectedEmail.parsed ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge className={getConfidenceColor(selectedEmail.parsed.confidence)}>
                            Confidence: {(selectedEmail.parsed.confidence * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label>Service</Label>
                            <p className="font-medium">{selectedEmail.parsed.serviceName}</p>
                          </div>
                          <div>
                            <Label>Type</Label>
                            <p className="font-medium capitalize">{selectedEmail.parsed.type}</p>
                          </div>
                          <div>
                            <Label>Amount</Label>
                            <p className="font-medium">
                              {selectedEmail.parsed.amount 
                                ? `${selectedEmail.parsed.currency} ${selectedEmail.parsed.amount}`
                                : 'Not detected'
                              }
                            </p>
                          </div>
                          <div>
                            <Label>Billing Cycle</Label>
                            <p className="font-medium">{selectedEmail.parsed.billingCycle || 'Not detected'}</p>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button 
                            size="sm"
                            onClick={() => saveToDatabase(selectedEmail)}
                          >
                            <Database className="w-4 h-4 mr-2" />
                            Save to Database
                          </Button>
                        </div>
                      </div>
                    ) : selectedEmail.error ? (
                      <div className="text-center py-4">
                        <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                        <p className="text-red-600 text-sm">{selectedEmail.error}</p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Brain className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm">Email not yet parsed</p>
                        <Button 
                          className="mt-2"
                          size="sm"
                          onClick={() => {
                            const index = emails.findIndex(e => e.email.id === selectedEmail.email.id)
                            if (index !== -1) parseEmail(index)
                          }}
                        >
                          Parse with AI
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 