"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wifi, WifiOff, Smartphone, Download, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

interface PWAStatus {
  isInstalled: boolean
  isOnline: boolean
  isStandalone: boolean
  canInstall: boolean
}

export function PWAStatus() {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isOnline: navigator.onLine,
    isStandalone: false,
    canInstall: false,
  })

  useEffect(() => {
    // Check if app is installed (standalone mode)
    const checkStandalone = () => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      setStatus(prev => ({ ...prev, isStandalone, isInstalled: isStandalone }))
    }

    // Check online status
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }))
      toast.success("You're back online!")
    }

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }))
      toast.warning("You're offline. Some features may be limited.")
    }

    // Check if app can be installed
    const handleBeforeInstallPrompt = () => {
      setStatus(prev => ({ ...prev, canInstall: true }))
    }

    // Initial checks
    checkStandalone()

    // Event listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const getStatusColor = () => {
    if (!status.isOnline) return "destructive"
    if (status.isInstalled) return "default"
    return "secondary"
  }

  const getStatusText = () => {
    if (!status.isOnline) return "Offline"
    if (status.isInstalled) return "Installed"
    if (status.canInstall) return "Can Install"
    return "Online"
  }

  const getStatusIcon = () => {
    if (!status.isOnline) return <WifiOff className="h-4 w-4" />
    if (status.isInstalled) return <CheckCircle className="h-4 w-4" />
    if (status.canInstall) return <Download className="h-4 w-4" />
    return <Wifi className="h-4 w-4" />
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">PWA Status</CardTitle>
          </div>
          <Badge variant={getStatusColor()}>
            {getStatusIcon()}
            <span className="ml-1">{getStatusText()}</span>
          </Badge>
        </div>
        <CardDescription>
          Current Progressive Web App status and capabilities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${status.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">Connection</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {status.isOnline ? "Connected to internet" : "Working offline"}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${status.isInstalled ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-sm font-medium">Installation</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {status.isInstalled ? "App is installed" : "App can be installed"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Features Available</h4>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-xs">Offline functionality</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-xs">Push notifications</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-xs">Background sync</span>
            </div>
            <div className="flex items-center space-x-2">
              {status.isInstalled ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-gray-400" />
              )}
              <span className="text-xs">Home screen access</span>
            </div>
          </div>
        </div>

        {status.canInstall && !status.isInstalled && (
          <div className="pt-2">
            <Button size="sm" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Install App
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
