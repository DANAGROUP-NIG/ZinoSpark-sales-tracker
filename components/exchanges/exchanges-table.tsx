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
import { Search, Plus, Filter, MoreHorizontal, CheckCircle, XCircle, Clock } from "lucide-react"
import Link from "next/link"
import type { CurrencyExchange } from "@/lib/types"

// Mock exchanges data
const mockExchanges = [
  {
    id: "1",
    vendorId: "1",
    vendor: { 
      id: "1", 
      name: "Exchange Vendor A", 
      type: "EXCHANGE" as const,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    },
    amountNaira: 1650000,
    exchangeRate: 1650,
    amountUSD: 1000.0,
    status: "PENDING" as const,
    createdAt: "2024-01-20T14:45:00Z",
    updatedAt: "2024-01-20T14:45:00Z",
  },
  {
    id: "2",
    vendorId: "3",
    vendor: { 
      id: "3", 
      name: "Exchange Vendor C", 
      type: "EXCHANGE" as const,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    },
    amountNaira: 2000000,
    exchangeRate: 1680,
    amountUSD: 1190.48,
    status: "RECEIVED" as const,
    createdAt: "2024-01-18T11:30:00Z",
    updatedAt: "2024-01-19T09:15:00Z",
  },
  {
    id: "3",
    vendorId: "1",
    vendor: { 
      id: "1", 
      name: "Exchange Vendor A", 
      type: "EXCHANGE" as const,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    },
    amountNaira: 500000,
    exchangeRate: 1640,
    amountUSD: 304.88,
    status: "CANCELLED" as const,
    createdAt: "2024-01-15T09:20:00Z",
    updatedAt: "2024-01-16T10:30:00Z",
  },
]

export function ExchangesTable() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ["exchanges", { page, search, status: statusFilter }],
    // Use mock data for development
    queryFn: () =>
      Promise.resolve({
        exchanges: mockExchanges.filter(
          (e) =>
            (statusFilter === "all" || e.status === statusFilter) &&
            (search === "" || e.vendor.name.toLowerCase().includes(search.toLowerCase())),
        ),
        total: mockExchanges.length,
        page,
        totalPages: 1,
      }),
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

  const handleStatusUpdate = (exchange: CurrencyExchange, newStatus: string) => {
    updateStatusMutation.mutate({ id: exchange.id, status: newStatus })
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
      PENDING: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      RECEIVED: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      CANCELLED: { variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
    }

    const config = variants[status as keyof typeof variants] || variants.PENDING
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status}
      </Badge>
    )
  }

  const canUpdateStatus = user?.role === "PARTNER"

  return (
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
              <TableHead>Amount (USD)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              {canUpdateStatus && <TableHead className="w-[70px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
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
                  {canUpdateStatus && (
                    <TableCell>
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : data?.exchanges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canUpdateStatus ? 7 : 6} className="text-center py-8 text-muted-foreground">
                  No exchanges found
                </TableCell>
              </TableRow>
            ) : (
              data?.exchanges.map((exchange) => (
                <TableRow key={exchange.id}>
                  <TableCell className="font-medium">{exchange.vendor.name}</TableCell>
                  <TableCell>{formatCurrency(exchange.amountNaira, "NGN")}</TableCell>
                  <TableCell>₦{exchange.exchangeRate.toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(exchange.amountUSD)}</TableCell>
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
          [...Array(5)].map((_, i) => (
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
        ) : data?.exchanges.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">No exchanges found</CardContent>
          </Card>
        ) : (
          data?.exchanges.map((exchange) => (
            <Card key={exchange.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium">{exchange.vendor.name}</h3>
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
                    <span>₦{exchange.exchangeRate.toLocaleString()}/USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">USD:</span>
                    <span className="font-bold text-primary">{formatCurrency(exchange.amountUSD)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
