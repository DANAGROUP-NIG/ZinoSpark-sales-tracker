"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/lib/stores/auth-store"
import { exchangesApi } from "@/lib/api"
import { useUsdVisibilityStore } from "@/lib/stores/usd-visibility-store"
import { Search, Plus, Filter, MoreHorizontal, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import Link from "next/link"
import type { CurrencyExchange } from "@/lib/types"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useMarketStore } from "@/lib/stores/market-store"

export function ExchangesTable() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { showUsd } = useUsdVisibilityStore()
  const AED_RATE = 3.67
  const { currentMarket } = useMarketStore()
  const [receiptModal, setReceiptModal] = useState<{ open: boolean; exchangeId?: string }>({ open: false })
  const [receiptAmount, setReceiptAmount] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["exchanges", { page, status: statusFilter, limit, currentMarket }],
    queryFn: () => exchangesApi.getAll({ page, limit, status: statusFilter === "all" ? undefined : statusFilter }),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => exchangesApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchanges"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] })
      toast({
        title: "Success",
        description: "Exchange status updated successfully.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update exchange status.",
        variant: "destructive",
      })
    },
  })

  const addReceiptMutation = useMutation({
    mutationFn: ({ id, amountUSD, transactionDate }: { id: string; amountUSD: number; transactionDate?: string }) =>
      exchangesApi.addReceipt(id, { amountUSD, transactionDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchanges"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] })
      toast({ title: "Receipt added", description: "Partial receipt recorded successfully." })
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add receipt.", variant: "destructive" })
    },
  })

  const handleStatusUpdate = (exchange: CurrencyExchange, newStatus: string) => {
    updateStatusMutation.mutate({ id: exchange.id, status: newStatus })
  }

  const handleAddReceipt = (exchange: any) => {
    setReceiptModal({ open: true, exchangeId: exchange.id })
    setReceiptAmount("")
  }

  const handleReceiptSubmit = () => {
    const amount = parseFloat(receiptAmount)
    if (!isFinite(amount) || amount <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid positive number.", variant: "destructive" })
      return
    }
    addReceiptMutation.mutate({
      id: receiptModal.exchangeId!,
      amountUSD: amount,
      transactionDate: new Date().toISOString(),
    })
    setReceiptModal({ open: false })
    setReceiptAmount("")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number, currency = "USD") => {
    if (currency === "USD") {
      return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    }
    return `₦${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: { variant: "default" as const, icon: Clock, color: "text-amber-700", bg: "bg-amber-100 hover:bg-amber-200" },
      RECEIVED: { variant: "default" as const, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100 hover:bg-green-200" },
      CANCELLED: { variant: "destructive" as const, icon: XCircle, color: "text-red-600", bg: "" },
    }

    const config = variants[status as keyof typeof variants] || variants.PENDING
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.bg || ''}`}>
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status}
      </Badge>
    )
  }

  const canUpdateStatus = user?.role === "PARTNER" || user?.role === "CLIENT"

  // Filter exchanges locally based on search
  const filteredExchanges = data?.exchanges?.filter((exchange: any) => 
    exchange.vendor?.name?.toLowerCase().includes(search.toLowerCase())
  ) || []

  const totalPages = data?.totalPages || 1
  const totalExchanges = data?.total || 0

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  return (
    <>
      <Dialog open={receiptModal.open} onOpenChange={open => setReceiptModal(v => ({ ...v, open }))}>
        <DialogContent className="max-w-xs p-4">
          <DialogHeader>
            <DialogTitle>Add Receipt</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="receipt-amount" className="block text-sm font-medium">Amount ({currentMarket === 'DUBAI' ? 'USD' : 'RMB'})</label>
            <input
              id="receipt-amount"
              type="number"
              min="0"
              step="0.01"
              className="w-full border rounded px-2 py-1"
              value={receiptAmount}
              onChange={e => setReceiptAmount(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button onClick={handleReceiptSubmit} disabled={addReceiptMutation.isPending || !receiptAmount}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exchanges..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="RECEIVED">Received</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {user?.role === "CLIENT" && (
          <Button asChild>
            <Link href="/exchanges/new">
              <Plus className="mr-2 h-4 w-4" />
              New Exchange
            </Link>
          </Button>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Amount (NGN)</TableHead>
              <TableHead>Exchange Rate</TableHead>
              {currentMarket === 'DUBAI' ? (
                <>
                  <TableHead>Amount (USD)</TableHead>
                  <TableHead>AED</TableHead>
                </>
              ) : (
                <TableHead>Amount (RMB)</TableHead>
              )}
              <TableHead>Remaining</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              {canUpdateStatus && <TableHead className="w-[90px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(limit)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                  {canUpdateStatus && (
                    <TableCell>
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : filteredExchanges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canUpdateStatus ? 9 : 8} className="text-center py-8 text-muted-foreground">
                  {search ? "No exchanges match your search" : "No exchanges found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredExchanges.map((exchange: any) => (
                <TableRow key={exchange.id}>
                  <TableCell className="font-medium">{exchange.vendor?.name || "Unknown Vendor"}</TableCell>
                  <TableCell>{formatCurrency(exchange.amountNaira, "NGN")}</TableCell>
                  <TableCell>₦{exchange.exchangeRate.toLocaleString()}</TableCell>
                  {currentMarket === 'DUBAI' ? (
                    <>
                      <TableCell className="font-medium">{showUsd ? formatCurrency(exchange.amountUSD) : <span className="tracking-widest">*****</span>}</TableCell>
                      <TableCell>AED {(exchange.amountUSD * AED_RATE).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    </>
                  ) : (
                    <TableCell className="font-medium">¥{((exchange.amountRMB ?? (exchange.amountNaira / exchange.exchangeRate)) as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  )}
                  <TableCell className="text-sm">{currentMarket === 'DUBAI' ? (showUsd ? `$${(exchange.unclaimedUSD ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '*****') : `¥${((exchange.unclaimedRMB ?? 0) as number).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}</TableCell>
                  <TableCell>{getStatusBadge(exchange.status)}</TableCell>
                  <TableCell>{formatDate(exchange.createdAt)}</TableCell>
                  {canUpdateStatus && (
                    <TableCell>
                      {exchange.status === "PENDING" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleAddReceipt(exchange)}>
                              <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                              Add Receipt
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(exchange, "RECEIVED")}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              Mark as Received
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(exchange, "CANCELLED")}>
                              <XCircle className="mr-2 h-4 w-4 text-red-600" />
                              Cancel Exchange
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          [...Array(limit)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredExchanges.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {search ? "No exchanges match your search" : "No exchanges found"}
            </CardContent>
          </Card>
        ) : (
          filteredExchanges.map((exchange: any) => (
            <Card key={exchange.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium">{exchange.vendor?.name || "Unknown Vendor"}</h3>
                    <p className="text-sm text-muted-foreground">{formatDate(exchange.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(exchange.status)}
                    {canUpdateStatus && exchange.status === "PENDING" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAddReceipt(exchange)}>
                            <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                            Add Receipt
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(exchange, "RECEIVED")}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                            Mark as Received
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(exchange, "CANCELLED")}>
                            <XCircle className="mr-2 h-4 w-4 text-red-600" />
                            Cancel Exchange
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Naira:</span>
                    <span className="font-medium">{formatCurrency(exchange.amountNaira, "NGN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Rate:</span>
                    <span>₦{exchange.exchangeRate.toLocaleString()}/{currentMarket === 'DUBAI' ? 'USD' : 'RMB'}</span>
                  </div>
                  {currentMarket === 'DUBAI' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">USD:</span>
                        <span className="font-bold text-purple-600">{showUsd ? formatCurrency(exchange.amountUSD) : <span className="tracking-widest">*****</span>}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">AED:</span>
                        <span>AED {(exchange.amountUSD * AED_RATE).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Remaining:</span>
                        <span>{showUsd ? `$${(exchange.unclaimedUSD ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '*****'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">RMB:</span>
                        <span className="font-bold text-purple-600">¥{((exchange.amountRMB ?? (exchange.amountNaira / exchange.exchangeRate)) as number).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Remaining:</span>
                        <span>¥{((exchange.unclaimedRMB ?? 0) as number).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  )}
                  {canUpdateStatus && exchange.status === "PENDING" && (
                    <div className="pt-2">
                      <Button variant="outline" size="sm" onClick={() => handleAddReceipt(exchange)}>Add Receipt</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalExchanges)} of {totalExchanges} exchanges
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={page === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
