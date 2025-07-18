'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestEnvPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables Test</CardTitle>
            <CardDescription>
              Check if environment variables are loaded correctly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-100 rounded-lg">
                <h3 className="font-medium mb-2">Google Client ID</h3>
                <p className="text-sm font-mono break-all">
                  {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 
                    `${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.substring(0, 20)}...` : 
                    'NOT FOUND'
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Length: {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.length || 0}
                </p>
              </div>
              
              <div className="p-4 bg-gray-100 rounded-lg">
                <h3 className="font-medium mb-2">Google Client Secret</h3>
                <p className="text-sm font-mono break-all">
                  {process.env.GOOGLE_CLIENT_SECRET ? 
                    `${process.env.GOOGLE_CLIENT_SECRET.substring(0, 10)}...` : 
                    'NOT FOUND'
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Length: {process.env.GOOGLE_CLIENT_SECRET?.length || 0}
                </p>
              </div>
              
              <div className="p-4 bg-gray-100 rounded-lg">
                <h3 className="font-medium mb-2">Supabase URL</h3>
                <p className="text-sm font-mono break-all">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT FOUND'}
                </p>
              </div>
              
              <div className="p-4 bg-gray-100 rounded-lg">
                <h3 className="font-medium mb-2">App URL</h3>
                <p className="text-sm font-mono break-all">
                  {process.env.NEXT_PUBLIC_APP_URL || 'NOT FOUND'}
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Expected Values</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Google Client ID should be ~72 characters long</li>
                <li>• Google Client Secret should be ~39 characters long</li>
                <li>• Both should start with "GOCSPX-"</li>
                <li>• Client ID should end with ".apps.googleusercontent.com"</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 