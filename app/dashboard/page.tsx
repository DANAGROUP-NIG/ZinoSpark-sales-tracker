"use client"

import { useQuery } from "@tanstack/react-query"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { MetricsCard } from "@/components/dashboard/metrics-card"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { PWAStatus } from "@/components/pwa/pwa-status"
import { dashboardApi } from "@/lib/api"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Wallet, Users, Clock, TrendingUp } from "lucide-react"

// Mock data for development
const mockMetrics = {
  totalWalletBalance: 125750.5,
  activeCustomersCount: 48,
  pendingExchangesCount: 7,
  recentTransactionsCount: 23,
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data: metrics = mockMetrics, isLoading } = useQuery({
    queryKey: ["dashboard-metrics"],
    // Use mock data for now
    queryFn: () => Promise.resolve(mockMetrics),
  })

  return (
    <DashboardLayout allowedRoles={["CLIENT", "PARTNER"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your currency exchange operations</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {user?.role === "CLIENT" && (
            <MetricsCard
              title="Total Wallet Balance"
              value={
                isLoading ? "..." : `$${metrics.totalWalletBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
              }
              icon={Wallet}
              description="Available USD balance"
            />
          )}
          <MetricsCard
            title="Active Customers"
            value={isLoading ? "..." : metrics.activeCustomersCount}
            icon={Users}
            description="Customers with balances"
          />
          <MetricsCard
            title="Pending Exchanges"
            value={isLoading ? "..." : metrics.pendingExchangesCount}
            icon={Clock}
            description="Awaiting confirmation"
          />
          <MetricsCard
            title="Recent Transactions"
            value={isLoading ? "..." : metrics.recentTransactionsCount}
            icon={TrendingUp}
            description="Last 30 days"
          />
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Activity */}
        <RecentActivity />

        {/* PWA Status - Only show on mobile or when not installed */}
        <div className="block md:hidden">
          <PWAStatus />
        </div>
      </div>
    </DashboardLayout>
  )
}
