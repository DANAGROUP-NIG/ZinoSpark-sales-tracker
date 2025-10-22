"use client"

import { MobileSidebar } from "./sidebar"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LogOut, User, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUsdVisibilityStore } from "@/lib/stores/usd-visibility-store"
import { useMarketStore, type Market } from "@/lib/stores/market-store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function Header() {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const { showUsd, toggleUsd } = useUsdVisibilityStore()
  const { currentMarket, setMarket } = useMarketStore()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md shadow-sm">
      <div className="flex h-14 md:h-16 items-center justify-between gap-2 md:gap-4 px-3 md:px-6">
        {/* Left side - Mobile hamburger + Title */}
        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
          <MobileSidebar />
          <div className="min-w-0 flex-1">
            <h1 className="text-sm md:text-xl font-semibold text-gray-900 truncate">
              <span className="hidden sm:inline">Welcome back, </span>{user?.name || 'User'}
            </h1>
          </div>
        </div>
        
        {/* Right side - Controls */}
        <div className="flex items-center gap-1 md:gap-4">
          {/* Market Selector - Mobile optimized */}
          <div className="flex items-center gap-1 md:gap-2 bg-gray-50 px-1 md:px-2 py-1 rounded-lg">
            <span className="hidden sm:inline text-xs font-medium text-gray-600">Market</span>
            <Select value={currentMarket} onValueChange={(v: Market) => setMarket(v)}>
              <SelectTrigger className="w-[80px] md:w-[130px] h-8 md:h-9 text-xs md:text-sm">
                <SelectValue placeholder="Market" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DUBAI">
                  <span className="text-xs md:text-sm">Dubai</span>
                </SelectItem>
                <SelectItem value="CHINA">
                  <span className="text-xs md:text-sm">China</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* USD Visibility Toggle */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={showUsd ? "Hide USD amounts" : "Show USD amounts"}
            onClick={toggleUsd}
            className="h-8 w-8 md:h-9 md:w-9"
            title={showUsd ? "Hide USD amounts" : "Show USD amounts"}
          >
            {showUsd ? <Eye className="h-4 w-4 md:h-5 md:w-5 text-gray-500" /> : <EyeOff className="h-4 w-4 md:h-5 md:w-5 text-gray-500" />}
          </Button>

          {/* User Profile - Mobile optimized */}
          <div className="flex items-center gap-2 md:gap-3 bg-gray-50 px-2 md:px-3 py-1 md:py-2 rounded-lg">
            <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 bg-primary rounded-full">
              <User className="h-3 w-3 md:h-4 md:w-4 text-primary-foreground" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 uppercase">{user?.role}</p>
            </div>
            <Button 
              variant="destructive" 
              size="icon" 
              className="ml-2 h-8 w-8 md:h-9 md:w-9"
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
