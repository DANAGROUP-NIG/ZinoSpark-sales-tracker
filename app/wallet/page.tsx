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
          <Tabs defaultValue="retry" className="inline-flex">
            <TabsList className="bg-transparent p-0 h-auto">
              <TabsTrigger 
                value="retry" 
                onClick={handleRefresh} 
                className="gap-2 px-1 py-1.5 text-sm font-medium text-muted-foreground border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
          <Tabs defaultValue="refresh" className="inline-flex">
            <TabsList className="bg-transparent p-0 h-auto">
              <TabsTrigger 
                value="refresh" 
                onClick={handleRefresh} 
                className="gap-2 px-1 py-1.5 text-sm font-medium text-muted-foreground border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="border-b border-gray-200 dark:border-gray-800 bg-transparent p-0">
            <TabsTrigger 
              value="overview" 
              className="px-4 py-2 text-sm font-medium text-muted-foreground border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              className="px-4 py-2 text-sm font-medium text-muted-foreground border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <WalletOverview
              balance={walletData?.balance || 0}
              totalCustomerBalanceUSD={walletData?.customerBalanceUSD || 0}
              pendingExchangesUSD={walletData?.pendingExchangesUSD || 0}
            />
          </TabsContent>

          <TabsContent value="transactions">
            <WalletTransactions />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
