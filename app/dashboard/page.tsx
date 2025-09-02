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

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: dashboardApi.getMetrics,
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
                isLoading ? "..." : `$${(metrics?.totalWalletBalance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
              }
              icon={Wallet}
              description="Available USD balance"
            />
          )}
          <MetricsCard
            title="Active Customers"
            value={isLoading ? "..." : (metrics?.activeCustomersCount ?? 0)}
            icon={Users}
            description="Customers with balances"
          />
          <MetricsCard
            title="Pending Exchanges"
            value={isLoading ? "..." : (metrics?.pendingExchangesCount ?? 0)}
            icon={Clock}
            description="Awaiting confirmation"
          />
          <MetricsCard
            title="Recent Transactions"
            value={isLoading ? "..." : (metrics?.recentTransactionsCount ?? 0)}
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
