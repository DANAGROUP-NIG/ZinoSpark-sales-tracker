"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useSidebarStore } from "@/lib/stores/sidebar-store"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, CreditCard, Building2, ArrowLeftRight, Wallet, Menu, LogOut, ChevronLeft, ChevronRight } from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["CLIENT", "PARTNER"],
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
    roles: ["CLIENT"],
  },
  {
    name: "Payments",
    href: "/payments",
    icon: CreditCard,
    roles: ["CLIENT"],
  },
  {
    name: "Vendors",
    href: "/vendors",
    icon: Building2,
    roles: ["CLIENT"],
  },
  {
    name: "Exchanges",
    href: "/exchanges",
    icon: ArrowLeftRight,
    roles: ["CLIENT", "PARTNER"],
  },
  {
    name: "Vendor Payments",
    href: "/vendor-payments",
    icon: CreditCard,
    roles: ["CLIENT", "PARTNER"],
  },
  {
    name: "Wallet",
    href: "/wallet",
    icon: Wallet,
    roles: ["CLIENT"],
  },
]

function NavigationItems({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  // Give CLIENT full access
  const filteredNavigation = navigation.filter((item) => {
    const role = user?.role || "CLIENT"
    return role === "CLIENT" || item.roles.includes(role)
  })

  return (
    <div className="flex flex-col h-full">
      <div className={cn("flex-1 space-y-2", collapsed ? "p-2" : "p-6")}>
        {filteredNavigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center rounded-xl text-sm font-medium transition-all duration-200 group",
                collapsed ? "justify-center p-3 mx-2" : "gap-3 px-4 py-3",
                isActive
                  ? "bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/10"
                  : "text-blue-200 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className={cn("h-5 w-5 transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-105")} />
              {!collapsed && <span className="transition-opacity duration-200">{item.name}</span>}
            </Link>
          )
        })}
      </div>

      <div className="p-6 border-t border-blue-700/30">
        {!collapsed && (
          <div className="mb-4 p-3 bg-white/10 rounded-xl backdrop-blur-sm">
            <p className="font-medium text-white text-sm">{user?.name}</p>
            <p className="text-blue-200 text-xs uppercase tracking-wide">{user?.role}</p>
          </div>
        )}
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={logout} 
          className={cn(
            "w-full transition-all duration-200",
            collapsed ? "justify-center px-2" : "justify-start"
          )}
          style={{
            backgroundColor: '#b91c1c',
            borderColor: '#b91c1c',
            color: 'white',
            border: '1px solid #b91c1c'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#b91c1c'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#b91c1c'
          }}
        >
          <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
          {!collapsed && "Sign Out"}
        </Button>
      </div>
    </div>
  )
}

export function Sidebar() {
  const { collapsed, toggleCollapsed } = useSidebarStore()

  return (
    <div className={cn(
      "hidden md:flex md:flex-col md:fixed md:inset-y-0 transition-all duration-300",
      collapsed ? "md:w-20" : "md:w-64"
    )}>
      <div className="flex flex-col h-full bg-gradient-to-b from-blue-800 to-blue-900 shadow-xl">
        {/* Logo Section */}
        <div className="flex items-center px-6 py-6 border-b border-blue-700/30 relative">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center">
              <img 
                src="https://res.cloudinary.com/dny7tqd0d/image/upload/v1755503447/business-logos/kzlzjquorjuzmklredpu.png" 
                alt="Zino Spark Logo" 
                className="w-40 h-20 object-contain"
              />
            </div>
            {/* {!collapsed && (
              <div className="transition-opacity duration-200">
                <h1 className="text-lg font-bold text-white">Zino Spark</h1>
                <p className="text-xs text-blue-200">Transactions</p>
              </div>
            )} */}
          </div>
          {/* Collapse Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className="fixed right-0 top-20 w-8 h-8 bg-white text-blue-800 rounded-l-full shadow-lg z-[9999] border-l border-t border-b border-gray-200 transition-none hover:bg-white"
            style={{ transform: 'none' }}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        <NavigationItems collapsed={collapsed} />
      </div>
    </div>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64 bg-gradient-to-b from-blue-800 to-blue-900">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        {/* Logo Section for Mobile */}
        <div className="flex items-center px-6 py-6 border-b border-blue-700/30">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center">
              <img 
                src="https://res.cloudinary.com/dny7tqd0d/image/upload/v1755503447/business-logos/kzlzjquorjuzmklredpu.png" 
                alt="Zino Spark Logo" 
                className="w-40 h-20 object-contain"
              />
            </div>
            {/* <div>
              <h1 className="text-lg font-bold text-white">Zino Spark Sales</h1>
              <p className="text-xs text-blue-100">Currency Exchange</p>
            </div> */}
          </div>
        </div>
        <NavigationItems />
      </SheetContent>
    </Sheet>
  )
}
