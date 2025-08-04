'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  ArrowLeft, 
  Lock,
  Eye,
  EyeOff,
  Bot,
  X,
  Check,
  AlertTriangle,
  Heart,
  Users,
  Zap,
  Mail,
  FileText,
  Star,
  Target,
  Scale,
  Globe,
  MessageCircle,
  ExternalLink
} from "lucide-react"
import Link from "next/link"

export default function EthicsPage() {
  const [activeTab, setActiveTab] = useState('principles')

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                  <Shield className="w-5 h-5 text-card-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Sentinel</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Heart className="w-4 h-4" />
            <span>Built with Ethics First</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Our Ethical Commitment
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            At Sentinel, we believe managing your subscriptions shouldn't come at the cost of your privacy, trust, or control. 
            We're building tools that empower you — not trap you.
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="premium-card-glass mb-8">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-card-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-card-foreground mb-4">Our Mission</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                We're creating a world where subscription management is transparent, user-controlled, and privacy-first. 
                No hidden fees, no data sales, no surprise cancellations. Just honest tools that put you back in control.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { id: 'principles', label: 'Core Principles', icon: Shield },
            { id: 'comparison', label: 'vs Competitors', icon: Scale },
            { id: 'technology', label: 'Privacy Tech', icon: Lock },
            { id: 'commitments', label: 'Future Pledges', icon: Star }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center space-x-2"
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </Button>
          ))}
        </div>

        {/* Content Sections */}
        {activeTab === 'principles' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-foreground text-center mb-8">
              What Makes Sentinel Different
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* No Account Linking */}
              <Card className="premium-card">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                      <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <CardTitle>No Account Linking Required</CardTitle>
                      <CardDescription>Your financial data stays yours</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We never ask for your bank login or credit card data. Unlike other apps that require 
                    full financial access, Sentinel works with the data you choose to share.
                  </p>
                </CardContent>
              </Card>

              {/* AI You Control */}
              <Card className="premium-card">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle>AI You Control</CardTitle>
                      <CardDescription>You approve every action</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Our AI helps identify subscriptions — but you approve every action. We never cancel 
                    anything without your explicit permission.
                  </p>
                </CardContent>
              </Card>

              {/* No Third-Party Negotiation */}
              <Card className="premium-card">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <CardTitle>No Third-Party Negotiation</CardTitle>
                      <CardDescription>No hidden contracts or fees</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Unlike others, we don't negotiate bills behind your back or lock you into contracts 
                    you didn't agree to. You maintain full control.
                  </p>
                </CardContent>
              </Card>

              {/* Transparent Detection */}
              <Card className="premium-card">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                      <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle>Transparent Detection</CardTitle>
                      <CardDescription>You see what we see</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Every AI-detected trial or subscription includes confidence scores and detection logic. 
                    No black box decisions.
                  </p>
                </CardContent>
              </Card>

              {/* No Data Sales */}
              <Card className="premium-card">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                      <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <CardTitle>No Data Sales. Ever.</CardTitle>
                      <CardDescription>Your privacy is non-negotiable</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Sentinel will never sell or share your data with third parties — not now, not ever. 
                    Your data stays with you.
                  </p>
                </CardContent>
              </Card>

              {/* User Empowerment */}
              <Card className="premium-card">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <CardTitle>User Empowerment</CardTitle>
                      <CardDescription>Tools that work for you</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We build features that give you more control, better insights, and clearer choices. 
                    You're the decision maker, not us.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-foreground text-center mb-8">
              How We Compare to Other Apps
            </h2>
            
            <Card className="premium-card-glass">
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-foreground">Feature</th>
                        <th className="text-center py-3 px-4 font-medium text-foreground">
                          <div className="flex items-center justify-center space-x-2">
                            <Shield className="w-4 h-4 text-blue-400" />
                            <span>Sentinel</span>
                          </div>
                        </th>
                        <th className="text-center py-3 px-4 font-medium text-foreground">
                          <div className="flex items-center justify-center space-x-2">
                            <AlertTriangle className="w-4 h-4 text-orange-400" />
                            <span>Rocket Money</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[
                        {
                          feature: "Cancels without your approval",
                          sentinel: false,
                          rocket: true,
                          description: "We never cancel anything without explicit permission"
                        },
                        {
                          feature: "Links to your bank account",
                          sentinel: false,
                          rocket: true,
                          description: "We never require bank access"
                        },
                        {
                          feature: "Charges for bill negotiations",
                          sentinel: false,
                          rocket: true,
                          description: "No hidden fees or surprise charges"
                        },
                        {
                          feature: "Transparent detection methods",
                          sentinel: true,
                          rocket: false,
                          description: "You see exactly how we detect subscriptions"
                        },
                        {
                          feature: "Sells or shares your data",
                          sentinel: false,
                          rocket: "Unknown",
                          description: "We have a strict no-data-sales policy"
                        },
                        {
                          feature: "Requires credit card access",
                          sentinel: false,
                          rocket: true,
                          description: "We work with the data you choose to share"
                        },
                        {
                          feature: "Locks you into contracts",
                          sentinel: false,
                          rocket: true,
                          description: "No hidden agreements or commitments"
                        },
                        {
                          feature: "Shows confidence scores",
                          sentinel: true,
                          rocket: false,
                          description: "Transparent AI decision making"
                        }
                      ].map((row, index) => (
                        <tr key={index} className="hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-foreground">{row.feature}</div>
                              <div className="text-sm text-muted-foreground">{row.description}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {row.sentinel === true ? (
                              <Check className="w-5 h-5 text-green-400 mx-auto" />
                            ) : row.sentinel === false ? (
                              <X className="w-5 h-5 text-red-400 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {row.rocket === true ? (
                              <Check className="w-5 h-5 text-green-400 mx-auto" />
                            ) : row.rocket === false ? (
                              <X className="w-5 h-5 text-red-400 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">{row.rocket}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                <strong>Note:</strong> This comparison is based on publicly available information. 
                We encourage you to read the privacy policies and terms of service of any app you use.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'technology' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-foreground text-center mb-8">
              Privacy-First Technology
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="w-5 h-5" />
                    <span>Email Parsing</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Opt-in and local whenever possible</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Only reads relevant emails (receipts, confirmations)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">No full inbox scanning</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Raw emails are never persisted</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="w-5 h-5" />
                    <span>Transparent Processing</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">All scanned data is shown transparently</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Confidence scores for every detection</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">You control what gets processed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Easy data export and deletion</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lock className="w-5 h-5" />
                    <span>Data Protection</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">End-to-end encryption</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">GDPR and CCPA compliant</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">No third-party data sharing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Regular security audits</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>User Control</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Full data export rights</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Account deletion at any time</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Granular privacy controls</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">No auto-renewal traps</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'commitments' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-foreground text-center mb-8">
              Our Future Commitments
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Public Transparency</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Public changelog for all updates</li>
                    <li>• Regular ethics audits and reviews</li>
                    <li>• Transparent pricing with no hidden fees</li>
                    <li>• Open communication about data practices</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="w-5 h-5" />
                    <span>Open Source Components</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Core detection algorithms will be open-sourced</li>
                    <li>• Community contributions welcome</li>
                    <li>• Public API for developers</li>
                    <li>• Transparent development roadmap</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5" />
                    <span>Community Feedback</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• User feedback shapes feature development</li>
                    <li>• Regular community surveys and polls</li>
                    <li>• Public feature request tracking</li>
                    <li>• Monthly transparency reports</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="w-5 h-5" />
                    <span>Ethical Standards</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Never sell user data, ever</li>
                    <li>• No dark patterns or deceptive UI</li>
                    <li>• Clear, honest communication</li>
                    <li>• Commitment to user empowerment</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Contact Section */}
        <Card className="premium-card-glass mt-12">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-card-foreground">Questions About Our Ethics?</CardTitle>
            <CardDescription className="text-muted-foreground">
              We're committed to transparency and welcome your feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Have feedback, questions, or concerns about our ethical standards? 
              We'd love to hear from you.
            </p>
                          <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="premium-button">
                  <a href="mailto:usesentinel@gmail.com">
                    <Mail className="w-4 h-4 mr-2" />
                    usesentinel@gmail.com
                  </a>
                </Button>
                <Button variant="outline" asChild className="premium-button-outline">
                  <Link href="/privacy">
                    <FileText className="w-4 h-4 mr-2" />
                    Privacy Policy
                  </Link>
                </Button>
              </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/dashboard">
            <Button className="premium-button">Back to Dashboard</Button>
          </Link>
        </div>
      </main>
    </div>
  )
} 