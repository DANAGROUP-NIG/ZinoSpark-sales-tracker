"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { WalletOverview } from "@/components/wallet/wallet-overview"
import { WalletTransactions } from "@/components/wallet/wallet-transactions"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import { Loader2, RefreshCw } from "lucide-react"

export default function WalletPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const {
    data: walletData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["wallet", refreshKey],
    queryFn: api.getWalletData,
  })

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
    refetch()
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Failed to load wallet data</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
            <p className="text-muted-foreground">Manage your USD wallet and transaction history</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <WalletOverview
              balance={walletData?.balance || 0}
              totalExchanges={walletData?.totalExchanges || 0}
              recentActivity={walletData?.recentActivity || []}
            />
          </TabsContent>

          <TabsContent value="transactions">
            <WalletTransactions transactions={walletData?.transactions || []} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
