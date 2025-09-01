"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WifiOff, RefreshCw, Home, Smartphone } from "lucide-react"
import Link from "next/link"

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    const handleOnline = () => {
      setIsOnline(true)
      // Redirect to home page when back online
      window.location.href = "/"
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    // Initial check
    checkOnlineStatus()

    // Event listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <WifiOff className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">You're Offline</CardTitle>
          <CardDescription>
            Please check your internet connection and try again
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Don't worry! ZinoSpark works offline and your data is safely cached.
            </p>
            <p>
              Some features may be limited while you're offline, but you can still:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>View cached data</li>
              <li>Use basic navigation</li>
              <li>Access previously loaded pages</li>
            </ul>
          </div>

          <div className="flex flex-col space-y-2">
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Link href="/">
              <Button variant="outline" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </Button>
            </Link>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                <Smartphone className="h-3 w-3" />
                <span>Install ZinoSpark for better offline experience</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
