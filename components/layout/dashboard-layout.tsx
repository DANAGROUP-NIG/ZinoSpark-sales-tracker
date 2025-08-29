"use client"

import type React from "react"

import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useSidebarStore } from "@/lib/stores/sidebar-store"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  allowedRoles?: ("CLIENT" | "PARTNER")[]
}

export function DashboardLayout({ children, allowedRoles }: DashboardLayoutProps) {
  const { collapsed } = useSidebarStore()

  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className={cn(
          "transition-all duration-300",
          collapsed ? "md:pl-20" : "md:pl-64"
        )}>
          <Header />
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
