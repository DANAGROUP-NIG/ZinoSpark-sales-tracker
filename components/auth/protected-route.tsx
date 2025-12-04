"use client"

import type React from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ("CLIENT" | "PARTNER")[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Allow time for hydration
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    // Grant CLIENT full access: if user is CLIENT, bypass allowedRoles checks
    if (allowedRoles && user && user.role !== "CLIENT" && !allowedRoles.includes(user.role)) {
      router.push("/unauthorized")
      return
    }
  }, [isAuthenticated, user, allowedRoles, router, isLoading])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Fallback UI for unauthenticated users for static export/refresh
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-lg font-semibold mb-4">Please log in to access your dashboard.</h2>
        <a href="/login" className="px-4 py-2 bg-blue-600 text-white rounded">Go to Login</a>
      </div>
    );
  }

  if (allowedRoles && user && user.role !== "CLIENT" && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-lg font-semibold mb-4">You are not authorized to access this page.</h2>
        <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded">Go Home</a>
      </div>
    );
  }

  return <>{children}</>
}
