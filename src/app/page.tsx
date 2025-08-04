'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Lock, Eye, Handshake, Brain, Mail, Calendar, TrendingUp, Users, Zap, ArrowRight } from "lucide-react"
import Link from "next/link"
import { TrustManifesto } from "@/components/TrustManifesto"

export default function LandingPage() {
  const features = [
    {
      icon: Shield,
      title: "Privacy-First Design",
      description: "We never access your bank accounts or credit cards. Your financial data stays private.",
      color: "text-emerald-600 dark:text-emerald-400"
    },
    {
      icon: Brain,
      title: "AI-Powered Detection",
      description: "Smart email scanning finds subscriptions automatically with full transparency.",
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      icon: Handshake,
      title: "Manual Control Only",
      description: "We never negotiate or make changes on your behalf. You stay in full control.",
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: Lock,
      title: "No Hidden Fees",
      description: "What you see is what you pay. No surprise charges or subscription fees.",
      color: "text-amber-600 dark:text-amber-400"
    }
  ]

  const stats = [
    { value: "10,000+", label: "Active Users", icon: Users },
    { value: "95%", label: "Privacy Score", icon: Shield },
    { value: "0", label: "Hidden Fees", icon: Lock },
    { value: "24/7", label: "AI Monitoring", icon: Brain }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-premium-purple rounded-lg flex items-center justify-center">
                                  <Shield className="w-6 h-6 text-card-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">Sentinel</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/auth">
                <Button variant="outline" className="premium-button-outline">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="premium-button">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Privacy-First Subscription Management
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Track and manage your subscriptions without compromising your privacy. 
              AI-powered detection with full transparency and manual control.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="premium-button text-lg px-6 py-3">
                  <Shield className="w-5 h-5 mr-2" />
                  Start Free Trial
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg" className="premium-button-outline text-lg px-6 py-3">
                  <Eye className="w-5 h-5 mr-2" />
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>

          {/* Trust Manifesto */}
          <div className="mb-8">
            <TrustManifesto variant="banner" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-premium-blue to-premium-purple rounded-lg mx-auto mb-2">
                                      <stat.icon className="w-5 h-5 text-card-foreground" />
                </div>
                <div className="text-xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              How Sentinel Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ethical, transparent, and privacy-first subscription management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="premium-card text-center">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 bg-gradient-to-br from-premium-blue to-premium-purple rounded-lg flex items-center justify-center mx-auto mb-3`}>
                    <feature.icon className="w-5 h-5 text-card-foreground" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Sentinel */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Why Choose Sentinel
            </h2>
            <p className="text-lg text-muted-foreground">
              Built for users who value privacy and control
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="premium-card">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Complete Privacy</h3>
                    <p className="text-sm text-muted-foreground">
                      We only scan emails you explicitly allow. No bank access, no hidden data collection, 
                      no third-party sharing. Your data stays yours.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Handshake className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Full Control</h3>
                    <p className="text-sm text-muted-foreground">
                      We never negotiate with companies on your behalf. You handle all communications 
                      and make every decision. We just provide the tools and insights.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Smart AI Detection</h3>
                    <p className="text-sm text-muted-foreground">
                      Advanced AI scans your emails for subscriptions with full transparency. 
                      See exactly why we detected each subscription with confidence scores.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                    <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">No Hidden Costs</h3>
                    <p className="text-sm text-muted-foreground">
                      What you see is what you pay. No surprise charges, no subscription fees, 
                      no hidden costs. Transparent pricing from day one.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-premium-blue/5 via-premium-purple/5 to-premium-blue/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Take Control?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of users who've switched to ethical, transparent subscription management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="premium-button text-lg px-6 py-3">
                <Shield className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
            </Link>
            <Link href="/auth">
              <Button variant="outline" size="lg" className="premium-button-outline text-lg px-6 py-3">
                <ArrowRight className="w-5 h-5 mr-2" />
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-premium-purple rounded-lg flex items-center justify-center">
                                  <Shield className="w-5 h-5 text-card-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Sentinel</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/support" className="hover:text-foreground transition-colors">Support</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2024 Sentinel. Privacy-first subscription management.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
