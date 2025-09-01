"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PWAStatus } from "@/components/pwa/pwa-status"
import { InstallPrompt } from "@/components/pwa/install-prompt"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Smartphone, 
  Wifi, 
  Bell, 
  Download, 
  Settings, 
  Info,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"

interface PWASettings {
  notifications: boolean
  backgroundSync: boolean
  offlineMode: boolean
  autoUpdate: boolean
}

export default function PWASettingsPage() {
  const [settings, setSettings] = useState<PWASettings>({
    notifications: true,
    backgroundSync: true,
    offlineMode: true,
    autoUpdate: true,
  })

  const [isInstalled, setIsInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    // Check if app is installed
    const checkStandalone = () => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      setIsInstalled(isStandalone)
    }

    // Check online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Check if app can be installed
    const handleBeforeInstallPrompt = () => {
      setCanInstall(true)
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

  const handleSettingChange = (key: keyof PWASettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    toast.success(`${key.replace(/([A-Z])/g, ' $1').toLowerCase()} ${value ? 'enabled' : 'disabled'}`)
  }

  const handleClearCache = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
        toast.success("Cache cleared successfully")
      }
    } catch (error) {
      toast.error("Failed to clear cache")
    }
  }

  const handleUpdateApp = () => {
    window.location.reload()
    toast.info("Checking for updates...")
  }

  return (
    <DashboardLayout allowedRoles={["CLIENT", "PARTNER"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PWA Settings</h1>
          <p className="text-muted-foreground">Manage your Progressive Web App preferences</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* PWA Status */}
          <div className="md:col-span-2">
            <PWAStatus />
          </div>

          {/* Installation Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <CardTitle>Installation</CardTitle>
              </div>
              <CardDescription>
                Install ZinoSpark on your device for better experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>App Status</Label>
                  <div className="flex items-center space-x-2">
                    <Badge variant={isInstalled ? "default" : "secondary"}>
                      {isInstalled ? "Installed" : "Not Installed"}
                    </Badge>
                    {isInstalled ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
                {canInstall && !isInstalled && (
                  <Button size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Install
                  </Button>
                )}
              </div>

              {isInstalled && (
                <div className="text-sm text-muted-foreground">
                  <p>✓ App is installed and running in standalone mode</p>
                  <p>✓ You can access it from your home screen</p>
                  <p>✓ Offline functionality is available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Wifi className="h-5 w-5 text-primary" />
                <CardTitle>Connection</CardTitle>
              </div>
              <CardDescription>
                Current network and sync status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Network Status</Label>
                  <div className="flex items-center space-x-2">
                    <Badge variant={isOnline ? "default" : "destructive"}>
                      {isOnline ? "Online" : "Offline"}
                    </Badge>
                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                {isOnline ? (
                  <p>✓ Connected to internet</p>
                ) : (
                  <p>⚠ Working in offline mode</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PWA Features */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-primary" />
                <CardTitle>Features</CardTitle>
              </div>
              <CardDescription>
                Enable or disable PWA features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Push Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive updates and alerts
                  </p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Background Sync</Label>
                  <p className="text-xs text-muted-foreground">
                    Sync data when online
                  </p>
                </div>
                <Switch
                  checked={settings.backgroundSync}
                  onCheckedChange={(checked) => handleSettingChange('backgroundSync', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Offline Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Work without internet
                  </p>
                </div>
                <Switch
                  checked={settings.offlineMode}
                  onCheckedChange={(checked) => handleSettingChange('offlineMode', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto Update</Label>
                  <p className="text-xs text-muted-foreground">
                    Update app automatically
                  </p>
                </div>
                <Switch
                  checked={settings.autoUpdate}
                  onCheckedChange={(checked) => handleSettingChange('autoUpdate', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cache Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                <CardTitle>Cache Management</CardTitle>
              </div>
              <CardDescription>
                Manage app cache and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button onClick={handleClearCache} variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Cache
                </Button>
                <Button onClick={handleUpdateApp} variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Check for Updates
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>Clearing cache will remove offline data but may improve performance.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PWA Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-primary" />
              <CardTitle>About PWA</CardTitle>
            </div>
            <CardDescription>
              Learn more about Progressive Web Apps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                Progressive Web Apps (PWAs) are web applications that can be installed on your device 
                and provide a native app-like experience.
              </p>
              <p>
                <strong>Benefits:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Quick access from home screen</li>
                <li>Works offline</li>
                <li>Faster loading times</li>
                <li>Push notifications</li>
                <li>Background sync</li>
                <li>No app store required</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
