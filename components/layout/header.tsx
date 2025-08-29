"use client"

import { MobileSidebar } from "./sidebar"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"

export function Header() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

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
