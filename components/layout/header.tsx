"use client"

import { MobileSidebar } from "./sidebar"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LogOut, User, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUsdVisibilityStore } from "@/lib/stores/usd-visibility-store"

export function Header() {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const { showUsd, toggleUsd } = useUsdVisibilityStore()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md shadow-sm">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-4">
          <MobileSidebar />
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">
              Welcome back, {user?.name || 'User'}
            </h1>
            {/* <p className="text-sm text-gray-500">Here's what's happening with your business today.</p> */}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* USD Visibility Toggle */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={showUsd ? "Hide USD amounts" : "Show USD amounts"}
            onClick={toggleUsd}
            className="mr-2"
            title={showUsd ? "Hide USD amounts" : "Show USD amounts"}
          >
            {showUsd ? <Eye className="h-5 w-5 text-gray-500" /> : <EyeOff className="h-5 w-5 text-gray-500" />}
          </Button>
          {/* User Profile */}
          <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 uppercase">{user?.role}</p>
            </div>
            <Button 
              variant="destructive" 
              size="icon" 
              className="ml-2"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
