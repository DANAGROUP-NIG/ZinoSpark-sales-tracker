"use client"

import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { paymentOrdersApi, customersApi, vendorsApi } from "@/lib/api"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useMarketStore } from "@/lib/stores/market-store"
import { useUsdVisibilityStore } from "@/lib/stores/usd-visibility-store"
import { Search, Plus, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckCircle, XCircle, Clock, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function PaymentOrdersTable() {
  const [search, setSearch] = useState("")
  const [customerFilter, setCustomerFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [rangePreset, setRangePreset] = useState<"today" | "yesterday" | "week" | "month" | "custom">("today")
  const [customDays, setCustomDays] = useState<number>(30)
  const [limit] = useState(10)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [updateNotes, setUpdateNotes] = useState("")

  const { user } = useAuthStore()
  const { currentMarket } = useMarketStore()
  const { showUsd } = useUsdVisibilityStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { startDate, endDate } = useMemo(() => {
    const toDateOnly = (d: Date) => d.toISOString().slice(0,10)
    const end = new Date(); end.setHours(23,59,59,999)
    if (rangePreset === "today") {
      const s = new Date(); s.setHours(0,0,0,0)
      return { startDate: toDateOnly(s), endDate: toDateOnly(end) }
    }
    if (rangePreset === "yesterday") {
      const yStart = new Date(); yStart.setDate(yStart.getDate() - 1); yStart.setHours(0,0,0,0)
      const yEnd = new Date(); yEnd.setDate(yEnd.getDate() - 1); yEnd.setHours(23,59,59,999)
      return { startDate: toDateOnly(yStart), endDate: toDateOnly(yEnd) }
    }
    if (rangePreset === "week") {
      const s = new Date(); s.setDate(s.getDate() - 6); s.setHours(0,0,0,0)
      return { startDate: toDateOnly(s), endDate: toDateOnly(end) }
    }
    if (rangePreset === "month") {
      const s = new Date(); s.setDate(s.getDate() - 29); s.setHours(0,0,0,0)
      return { startDate: toDateOnly(s), endDate: toDateOnly(end) }
    }
    const days = Number.isFinite(customDays) && customDays > 0 ? customDays : 30
    const s = new Date(); s.setDate(s.getDate() - (days - 1)); s.setHours(0,0,0,0)
    return { startDate: toDateOnly(s), endDate: toDateOnly(end) }
  }, [rangePreset, customDays])

  const { data: paymentOrdersData, isLoading: paymentOrdersLoading } = useQuery({
    queryKey: ["payment-orders", { page, customerId: customerFilter, status: statusFilter, limit, startDate, endDate, search }],
    queryFn: () => paymentOrdersApi.getAll({ 
      page, 
      limit, 
      customerId: customerFilter === "all" ? undefined : customerFilter, 
      status: statusFilter === "all" ? undefined : statusFilter,
      market: currentMarket,
      startDate, 
      endDate,
      search: search || undefined
    }),
  })

  const { data: summary } = useQuery({
    queryKey: ["payment-orders-summary", { customerId: customerFilter, status: statusFilter, startDate, endDate }],
    queryFn: () => paymentOrdersApi.getSummary({ 
      customerId: customerFilter === "all" ? undefined : customerFilter, 
      status: statusFilter === "all" ? undefined : statusFilter,
      market: currentMarket,
      startDate, 
      endDate 
    }),
  })

  const { data: customersData } = useQuery({
    queryKey: ["customers-for-payment-orders"],
    queryFn: () => customersApi.getAll({ limit: 100 }),
  })

  const updatePaymentOrderMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status?: string; notes?: string }) =>
      paymentOrdersApi.update(id, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-orders"] })
      queryClient.invalidateQueries({ queryKey: ["vendor-payments"] })
      toast({
        title: "Payment Order Updated",
        description: "Payment order has been updated successfully",
      })
      setSelectedOrder(null)
      setUpdateNotes("")
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update payment order",
        variant: "destructive",
      })
    },
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount?: number) => {
    const safe = typeof amount === 'number' && isFinite(amount) ? amount : 0
    return `$${safe.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
  }

  const getCustomerName = (customerId: string) => {
    const customer = customersData?.customers?.find((c: any) => c.id === customerId)
    return customer?.name || "Unknown Customer"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case "COMPLETED":
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>
      case "CANCELLED":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleUpdateStatus = (status: "COMPLETED" | "CANCELLED", order: any) => {
    updatePaymentOrderMutation.mutate({
      id: order.id,
      status,
      notes: order.notes || "",
    })
  }

  const paymentOrders = paymentOrdersData?.paymentOrders || []
  const totalOrders = paymentOrdersData?.total || 0
  const totalPages = Math.ceil(totalOrders / limit)

  return (
    <div className="space-y-6">

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full md:w-64"
                />
              </div>
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customersData?.customers?.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={rangePreset} onValueChange={(v: any) => setRangePreset(v)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payment Orders Table */}
      <Card>
        <CardContent className="p-0">
          {paymentOrdersLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading payment orders...</p>
              </div>
            </div>
          ) : paymentOrders.length === 0 ? (
            <div className="text-center p-8">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payment orders found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or create a new payment order.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.customer?.name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      {order.vendor?.name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {currentMarket === 'DUBAI' 
                            ? (showUsd ? formatCurrency(order.amountUSD) : "*****")
                            : (order.amountRMB ? `¥${order.amountRMB.toFixed(2)}` : `¥${order.amountUSD.toFixed(2)}`)
                          }
                        </span>
                        {currentMarket === 'DUBAI' && order.amountRMB && (
                          <span className="text-xs text-muted-foreground">
                            ¥{order.amountRMB.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.creator?.name || "Unknown"}</span>
                        <span className="text-xs text-muted-foreground">{order.creator?.role}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order)
                            setUpdateNotes(order.notes || "")
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {user?.role === "PARTNER" && order.status === "PENDING" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus("COMPLETED", order)}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus("CANCELLED", order)}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!paymentOrdersLoading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalOrders)} of {totalOrders} payment orders
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Order Details</DialogTitle>
            <DialogDescription>
              View and manage payment order details
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Customer</Label>
                  <p className="text-sm">{selectedOrder.customer?.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Vendor</Label>
                  <p className="text-sm">{selectedOrder.vendor?.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount {currentMarket === 'DUBAI' ? 'USD' : 'RMB'}</Label>
                  <p className="text-sm font-medium">
                    {currentMarket === 'DUBAI' 
                      ? (showUsd ? formatCurrency(selectedOrder.amountUSD) : "*****")
                      : (selectedOrder.amountRMB ? `¥${selectedOrder.amountRMB.toFixed(2)}` : `¥${selectedOrder.amountUSD.toFixed(2)}`)
                    }
                  </p>
                </div>
                {currentMarket === 'DUBAI' && selectedOrder.amountRMB && (
                  <div>
                    <Label className="text-sm font-medium">Amount RMB</Label>
                    <p className="text-sm font-medium">¥{selectedOrder.amountRMB.toFixed(2)}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created By</Label>
                  <p className="text-sm">{selectedOrder.creator?.name} ({selectedOrder.creator?.role})</p>
                </div>
              </div>
              
              {selectedOrder.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm">{selectedOrder.description}</p>
                </div>
              )}

              {user?.role === "PARTNER" && selectedOrder.status === "PENDING" && (
                <div>
                  <Label htmlFor="updateNotes" className="text-sm font-medium">Notes</Label>
                  <Textarea
                    id="updateNotes"
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                    placeholder="Add notes for this payment order..."
                    rows={3}
                  />
                </div>
              )}

              {selectedOrder.processor && (
                <div>
                  <Label className="text-sm font-medium">Processed By</Label>
                  <p className="text-sm">{selectedOrder.processor?.name} ({selectedOrder.processor?.role})</p>
                  {selectedOrder.processedAt && (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(selectedOrder.processedAt)}
                    </p>
                  )}
                </div>
              )}

              {selectedOrder.vendorPayment && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <Label className="text-sm font-medium text-green-900">Vendor Payment</Label>
                  <p className="text-sm text-green-800">
                    Payment ID: {selectedOrder.vendorPayment.id}
                  </p>
                  <p className="text-sm text-green-800">
                    Amount: {currentMarket === 'DUBAI' 
                      ? (showUsd ? formatCurrency(selectedOrder.vendorPayment.amountUSD) : "*****")
                      : (selectedOrder.vendorPayment.amountRMB ? `¥${selectedOrder.vendorPayment.amountRMB.toFixed(2)}` : `¥${selectedOrder.vendorPayment.amountUSD.toFixed(2)}`)
                    }
                  </p>
                  {selectedOrder.vendorPayment.transactionDate && (
                    <p className="text-sm text-green-800">
                      Date: {formatDate(selectedOrder.vendorPayment.transactionDate)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
