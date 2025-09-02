import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet, TrendingUp, ArrowUpRight } from "lucide-react"

interface WalletOverviewProps {
  balance: number
  totalCustomerBalanceUSD: number
}

export function WalletOverview({ balance, totalCustomerBalanceUSD }: WalletOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${balance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Available for customer payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customer Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCustomerBalanceUSD.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Sum of all customers' USD balances</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
