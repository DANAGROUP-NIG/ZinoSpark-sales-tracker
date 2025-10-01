"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import Link from "next/link"
import { paymentsApi, customersApi } from "@/lib/api"
import { useUsdVisibilityStore } from "@/lib/stores/usd-visibility-store"

export function PaymentsTable() {
  const [search, setSearch] = useState("")
  const [customerFilter, setCustomerFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [startDate, setStartDate] = useState<string | undefined>(undefined)
  const [endDate, setEndDate] = useState<string | undefined>(undefined)
  const [limit] = useState(10)

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["payments", { page, customerId: customerFilter, limit, startDate, endDate }],
    queryFn: () => paymentsApi.getAll({ page, limit, customerId: customerFilter === "all" ? undefined : customerFilter, startDate, endDate }),
  })

  const { data: summary } = useQuery({
    queryKey: ["payments-summary", { customerId: customerFilter, startDate, endDate }],
    queryFn: () => paymentsApi.getSummary({ customerId: customerFilter === "all" ? undefined : customerFilter, startDate, endDate }),
  })

  const { data: customersData } = useQuery({
    queryKey: ["customers-for-payments"],
    queryFn: () => customersApi.getAll({ limit: 100 }),
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

  const formatCurrency = (amount: number, currency = "USD") => {
    if (currency === "USD") {
      return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    }
    return `₦${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
  }

  const getCustomerName = (customerId: string) => {
    const customer = customersData?.customers?.find(c => c.id === customerId)
    return customer?.name || "Unknown Customer"
  }

  // Filter payments locally based on search
  const filteredPayments = paymentsData?.payments?.filter(payment => 
    getCustomerName(payment.customerId).toLowerCase().includes(search.toLowerCase())
  ) || []

  const totalPages = paymentsData?.totalPages || 1
  const totalPayments = paymentsData?.total || 0

  const { showUsd } = useUsdVisibilityStore()
  const AED_RATE = 3.67

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Input type="date" value={startDate || ''} onChange={(e) => setStartDate(e.target.value || undefined)} className="w-full sm:w-44" />
          <Input type="date" value={endDate || ''} onChange={(e) => setEndDate(e.target.value || undefined)} className="w-full sm:w-44" />
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All customers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All customers</SelectItem>
              {customersData?.customers?.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button asChild>
          <Link href="/payments/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Payment
          </Link>
        </Button>
      </div>

      {/* Summary */}
      {summary && Array.isArray(summary) && summary.length > 0 && (
        <div className="rounded-md border p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Summary ({summary[0].date} ...)</span>
            <span className="font-medium">USD: ${summary.reduce((a:number, s:any)=>a+(s.totalAmountUSD||0),0).toLocaleString()} • NGN: ₦{summary.reduce((a:number, s:any)=>a+(s.totalAmountNaira||0),0).toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Amount (NGN)</TableHead>
              <TableHead>Exchange Rate</TableHead>
              <TableHead>Amount (USD)</TableHead>
              <TableHead>AED</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentsLoading ? (
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
                </TableRow>
              ))
            ) : filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {search ? "No payments match your search" : "No payments found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{getCustomerName(payment.customerId)}</TableCell>
                  <TableCell>{formatCurrency(payment.amountNaira, "NGN")}</TableCell>
                  <TableCell>₦{payment.exchangeRate.toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{showUsd ? formatCurrency(payment.amountUSD) : <span className="tracking-widest">*****</span>}</TableCell>
                  <TableCell>AED {(payment.amountUSD * AED_RATE).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>{formatDate(payment.createdAt)}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 hover:bg-green-200 text-green-600">
                      Completed
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {paymentsLoading ? (
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
        ) : filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {search ? "No payments match your search" : "No payments found"}
            </CardContent>
          </Card>
        ) : (
          filteredPayments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium">{getCustomerName(payment.customerId)}</h3>
                    <p className="text-sm text-muted-foreground">{formatDate(payment.createdAt)}</p>
                  </div>
                  <Badge>Completed</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Naira:</span>
                    <span className="font-medium">{formatCurrency(payment.amountNaira, "NGN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Rate:</span>
                    <span>₦{payment.exchangeRate.toLocaleString()}/USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">USD:</span>
                    <span className="font-bold text-purple-600">{showUsd ? formatCurrency(payment.amountUSD) : <span className="tracking-widest">*****</span>}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">AED:</span>
                    <span>AED {(payment.amountUSD * AED_RATE).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {!paymentsLoading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalPayments)} of {totalPayments} payments
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
  )
}
