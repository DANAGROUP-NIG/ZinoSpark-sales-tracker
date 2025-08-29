"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { useAuthStore } from "@/lib/stores/auth-store"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, CreditCard, Building2, ArrowLeftRight, Wallet, Menu, LogOut } from "lucide-react"

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

function NavigationItems() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  const filteredNavigation = navigation.filter((item) => item.roles.includes(user?.role || "CLIENT"))

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-1 p-4">
        {filteredNavigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t">
        <div className="mb-3 text-sm">
          <p className="font-medium">{user?.name}</p>
          <p className="text-muted-foreground">{user?.role}</p>
        </div>
        <Button variant="outline" size="sm" onClick={logout} className="w-full justify-start bg-transparent">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r">
      <NavigationItems />
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
      <SheetContent side="left" className="p-0 w-64">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <NavigationItems />
      </SheetContent>
    </Sheet>
  )
}
