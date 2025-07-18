import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Mail, Bell, Calendar, TrendingUp, Sparkles, Lock, CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm fixed top-0 w-full z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Sentinel</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How it Works</Link>
              <Link href="#privacy" className="text-gray-600 hover:text-gray-900 transition-colors">Privacy</Link>
              <Link href="/auth" className="ml-4">
                <Button>Get Started</Button>
              </Link>
            </nav>
            
            <Link href="/auth" className="md:hidden">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="info" className="mb-4">
            🔐 Privacy-First Subscription Management
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Never Miss a <span className="text-blue-600">Free Trial</span> Ending Again
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Track subscriptions and free trials without giving away your financial data. 
            AI-powered email parsing finds what you're paying for - privately and securely.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="w-full sm:w-auto">
                <Mail className="w-5 h-5 mr-2" />
                Start with Google
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <Sparkles className="w-5 h-5 mr-2" />
              See Demo
            </Button>
          </div>
          
          <div className="mt-8 flex items-center justify-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
              No credit card required
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
              Free forever for basic use
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Stay in Control
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features that respect your privacy
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="trust-card">
              <CardHeader>
                <Mail className="w-10 h-10 text-blue-600 mb-4" />
                <CardTitle>Smart Email Parsing</CardTitle>
                <CardDescription>
                  AI automatically finds subscriptions in your Gmail - no manual entry needed
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="trust-card">
              <CardHeader>
                <Bell className="w-10 h-10 text-purple-600 mb-4" />
                <CardTitle>Smart Notifications</CardTitle>
                <CardDescription>
                  Get alerts before trials end or subscriptions renew - never get charged unexpectedly
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="trust-card">
              <CardHeader>
                <Calendar className="w-10 h-10 text-green-600 mb-4" />
                <CardTitle>Calendar Sync</CardTitle>
                <CardDescription>
                  See all your renewals and trial endings in Google Calendar
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="trust-card">
              <CardHeader>
                <TrendingUp className="w-10 h-10 text-orange-600 mb-4" />
                <CardTitle>Spending Insights</CardTitle>
                <CardDescription>
                  Track how much you're spending and find opportunities to save
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="trust-card">
              <CardHeader>
                <Sparkles className="w-10 h-10 text-pink-600 mb-4" />
                <CardTitle>AI Recommendations</CardTitle>
                <CardDescription>
                  Get personalized suggestions for better alternatives and deals
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="trust-card">
              <CardHeader>
                <Lock className="w-10 h-10 text-indigo-600 mb-4" />
                <CardTitle>Privacy First</CardTitle>
                <CardDescription>
                  Your data stays yours - we never share or sell your information
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-white/50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-600">
              No complex setup, no credit card required
            </p>
          </div>
          
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Connect Your Gmail</h3>
                <p className="text-gray-600">
                  Sign in with Google - we only read emails, never send or delete
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">AI Finds Your Subscriptions</h3>
                <p className="text-gray-600">
                  Our AI scans for subscription emails and extracts the important details
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Stay in Control</h3>
                <p className="text-gray-600">
                  Get notifications, track spending, and never miss a trial ending again
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link href="/auth">
              <Button size="lg">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section id="privacy" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="trust-card">
            <CardHeader className="text-center">
              <Lock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-2xl">Your Privacy is Our Priority</CardTitle>
              <CardDescription className="text-lg">
                We believe in complete transparency about how we handle your data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">✅ What We Do</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Read emails to find subscriptions</li>
                    <li>• Store subscription details securely</li>
                    <li>• Send you notifications you opt into</li>
                    <li>• Delete your data when you ask</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">❌ What We Never Do</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Access your financial accounts</li>
                    <li>• Share or sell your data</li>
                    <li>• Send or delete your emails</li>
                    <li>• Store your email content</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Sentinel</span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-gray-900">Terms of Service</Link>
              <Link href="/support" className="hover:text-gray-900">Support</Link>
            </div>
          </div>
          
          <div className="text-center mt-8 text-sm text-gray-500">
            © 2024 Sentinel. All rights reserved. Built with ❤️ for privacy-conscious users.
          </div>
        </div>
      </footer>
    </div>
  )
}
