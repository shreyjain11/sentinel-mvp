'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Lock, Eye, Handshake, AlertTriangle, CheckCircle, XCircle, ExternalLink, Info } from "lucide-react"

interface TrustManifestoProps {
  variant?: 'banner' | 'modal' | 'sidebar'
  className?: string
}

export function TrustManifesto({ variant = 'banner', className = '' }: TrustManifestoProps) {
  const [showFullManifesto, setShowFullManifesto] = useState(false)

  const trustPoints = [
    {
      icon: Shield,
      title: "No Third-Party Negotiation",
      description: "We never negotiate with companies on your behalf. You stay in full control.",
      color: "text-emerald-600 dark:text-emerald-400"
    },
    {
      icon: Lock,
      title: "No Hidden Fees",
      description: "What you see is what you pay. No surprise charges or subscription fees.",
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: Eye,
      title: "No Financial Data Scraping",
      description: "We don't access your bank accounts or credit cards. Ever.",
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      icon: Handshake,
      title: "Manual Control Only",
      description: "We never make changes without your explicit approval.",
      color: "text-amber-600 dark:text-amber-400"
    }
  ]

  const rocketMoneyProblems = [
    "Locked into $86/month Xfinity contract for 5 years",
    "Hidden negotiation fees added to monthly bill",
    "Unauthorized changes made to account settings",
    "Bank account access required for 'savings'",
    "Difficult to cancel their own service"
  ]

  if (showFullManifesto) {
    return (
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="premium-card max-w-4xl max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-premium-blue to-premium-purple rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-card-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-foreground">Sentinel Trust Manifesto</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Our commitment to ethical, transparent subscription management
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullManifesto(false)}
                className="premium-button-outline"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Trust Points */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Our Core Principles</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {trustPoints.map((point, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 border border-border">
                    <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center ${point.color}`}>
                      <point.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">{point.title}</h4>
                      <p className="text-sm text-muted-foreground">{point.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Why People Switch */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Why People Switch from Rocket Money</h3>
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h4 className="font-medium text-red-600 dark:text-red-400">Common Rocket Money Complaints</h4>
                </div>
                <ul className="space-y-2">
                  {rocketMoneyProblems.map((problem, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <XCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{problem}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* How Sentinel is Different */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">How Sentinel is Different</h3>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <h4 className="font-medium text-emerald-600 dark:text-emerald-400">Sentinel's Approach</h4>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-foreground mb-1">Transparency</h5>
                    <p className="text-sm text-muted-foreground">
                      Every action is logged and visible. You approve every change before it happens.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-medium text-foreground mb-1">Privacy First</h5>
                    <p className="text-sm text-muted-foreground">
                      We only read emails you explicitly allow. No bank access, no hidden data collection.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-medium text-foreground mb-1">No Lock-in</h5>
                    <p className="text-sm text-muted-foreground">
                      Cancel anytime. No contracts, no fees, no complicated cancellation process.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-medium text-foreground mb-1">AI-Powered Insights</h5>
                    <p className="text-sm text-muted-foreground">
                      Smart detection with full transparency. See exactly why we detected each subscription.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center p-4 bg-gradient-to-r from-premium-blue/5 via-premium-purple/5 to-premium-blue/5 rounded-lg border border-premium-blue/10">
              <h4 className="text-lg font-semibold text-foreground mb-2">
                Ready to take control of your subscriptions?
              </h4>
              <p className="text-muted-foreground mb-4">
                Join thousands of users who've switched to ethical, transparent subscription management.
              </p>
              <Button className="premium-button">
                <Shield className="w-4 h-4 mr-2" />
                Get Started with Sentinel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (variant === 'sidebar') {
    return (
      <Card className="premium-card">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-premium-blue to-premium-purple rounded-lg flex items-center justify-center">
                                <Shield className="w-5 h-5 text-card-foreground" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">Trust Manifesto</CardTitle>
              <CardDescription className="text-muted-foreground">
                Our ethical approach
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {trustPoints.slice(0, 2).map((point, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className={`w-5 h-5 rounded-lg bg-muted flex items-center justify-center ${point.color}`}>
                  <point.icon className="w-3 h-3" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">{point.title}</h4>
                  <p className="text-xs text-muted-foreground">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFullManifesto(true)}
            className="w-full premium-button-outline"
          >
            <Info className="w-4 h-4 mr-2" />
            Read Full Manifesto
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Default banner variant
  return (
    <Card className={`trust-banner ${className}`}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-premium-blue to-premium-purple rounded-lg flex items-center justify-center">
                                <Shield className="w-6 h-6 text-card-foreground" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground mb-1">Sentinel Trust Manifesto</h3>
              <p className="text-sm text-muted-foreground">
                No third-party negotiation • No hidden fees • No financial data scraping • Manual control only
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFullManifesto(true)}
            className="premium-button-outline"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Read More
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 