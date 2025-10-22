import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet, TrendingUp, ArrowUpRight } from "lucide-react"
import { useMarketStore } from "@/lib/stores/market-store"
import { useUsdVisibilityStore } from "@/lib/stores/usd-visibility-store"

interface WalletOverviewProps {
	balance: number
	totalCustomerBalanceUSD: number
	pendingExchangesUSD?: number
	// Optional RMB metrics when in China market
	totalRMB?: number
	totalCustomerBalanceRMB?: number
	availableCustomerBalanceRMB?: number
	pendingExchangesRMB?: number
}

export function WalletOverview({ balance, totalCustomerBalanceUSD, pendingExchangesUSD = 0, totalRMB, totalCustomerBalanceRMB, availableCustomerBalanceRMB, pendingExchangesRMB }: WalletOverviewProps) {
	const AED_RATE = 3.67;
	const balanceAED = balance * AED_RATE;
	const totalCustomerBalanceAED = totalCustomerBalanceUSD * AED_RATE;
	const { showUsd } = useUsdVisibilityStore()
	const { currentMarket } = useMarketStore()
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
						<div className="text-2xl font-bold">
							{currentMarket === 'DUBAI' ? (
								showUsd ? `$${balance.toLocaleString()}` : <span className="tracking-widest">*****</span>
							) : (
								<>¥{(totalRMB ?? 0).toLocaleString()}</>
							)}
						</div>
						<div className="flex items-center gap-2 mt-1">
							<Badge className="bg-green-100 text-green-800 font-semibold px-2 py-1 rounded-full text-xs flex items-center gap-1">
								<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.104.896-2 2-2s2 .896 2 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2c0-1.104.896-2 2-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 11V7a5 5 0 00-10 0v4" /></svg>
								Money In Safe
							</Badge>
						</div>
						{currentMarket === 'DUBAI' ? (
							<>
								<div className="text-sm text-muted-foreground">AED {balanceAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
								<p className="text-xs text-muted-foreground">Available for customer payments</p>
							</>
						) : (
							<p className="text-xs text-muted-foreground">China market RMB wallet total</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Customer Balance</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{currentMarket === 'DUBAI'
								? (showUsd ? `$${totalCustomerBalanceUSD.toLocaleString()}` : <span className="tracking-widest">*****</span>)
								: <>¥{(totalCustomerBalanceRMB ?? 0).toLocaleString()}</>}
						</div>
						{currentMarket === 'DUBAI' ? (
							<>
								<div className="text-sm text-muted-foreground">AED {totalCustomerBalanceAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
								<p className="text-xs text-muted-foreground">Sum of customers' USD balances not yet exchanged</p>
								{pendingExchangesUSD > 0 && (
									<p className="text-xs text-yellow-600 mt-1">Pending: {showUsd ? `$${pendingExchangesUSD.toLocaleString()}` : '*****'} (AED {(pendingExchangesUSD * AED_RATE).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</p>
								)}
							</>
						) : (
							<>
								{typeof availableCustomerBalanceRMB === 'number' && (
									<p className="text-xs text-muted-foreground">Available RMB: ¥{availableCustomerBalanceRMB.toLocaleString()}</p>
								)}
								{typeof pendingExchangesRMB === 'number' && pendingExchangesRMB > 0 && (
									<p className="text-xs text-yellow-600 mt-1">Pending exchanges: ¥{pendingExchangesRMB.toLocaleString()}</p>
								)}
							</>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
