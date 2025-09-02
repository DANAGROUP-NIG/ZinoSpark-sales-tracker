"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { vendorPaymentsApi, customersApi, vendorsApi } from "@/lib/api"
import { Search, Plus, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import Link from "next/link"

export function VendorPaymentsTable() {
  const [search, setSearch] = useState("")
  const [customerFilter, setCustomerFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const { data: vendorPaymentsData, isLoading: vendorPaymentsLoading } = useQuery({
    queryKey: ["vendor-payments", { page, customerId: customerFilter, limit }],
    queryFn: () => vendorPaymentsApi.getAll({ page, limit, customerId: customerFilter === "all" ? undefined : customerFilter }),
  })

  const { data: customersData } = useQuery({
    queryKey: ["customers-for-vendor-payments"],
    queryFn: () => customersApi.getAll({ limit: 100 }),
  })

  const { data: vendorsData } = useQuery({
    queryKey: ["vendors-for-vendor-payments"],
    queryFn: () => vendorsApi.getAll({ limit: 100 }),
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

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
  }

  const getCustomerName = (customerId: string) => {
    const customer = customersData?.customers?.find(c => c.id === customerId)
    return customer?.name || "Unknown Customer"
  }

  const getVendorName = (vendorId: string) => {
    const vendor = vendorsData?.vendors?.find(v => v.id === vendorId)
    return vendor?.name || "Unknown Vendor"
  }

  // Filter vendor payments locally based on search
  const filteredVendorPayments = vendorPaymentsData?.vendorPayments?.filter(payment => 
    getCustomerName(payment.customerId).toLowerCase().includes(search.toLowerCase()) ||
    getVendorName(payment.vendorId).toLowerCase().includes(search.toLowerCase())
  ) || []

  const totalPages = vendorPaymentsData?.totalPages || 1
  const totalVendorPayments = vendorPaymentsData?.total || 0

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
          <Link href="/vendor-payments/new">
            <Plus className="mr-2 h-4 w-4" />
            Make Payment
          </Link>
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Amount (USD)</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendorPaymentsLoading ? (
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
            ) : filteredVendorPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {search ? "No vendor payments match your search" : "No vendor payments found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredVendorPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{getCustomerName(payment.customerId)}</TableCell>
                  <TableCell>{getVendorName(payment.vendorId)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(payment.amountUSD)}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {payment.description ? (
                        <span className="text-sm">{payment.description}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">No description</span>
                      )}
                    </div>
                  </TableCell>
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
        {vendorPaymentsLoading ? (
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
        ) : filteredVendorPayments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {search ? "No vendor payments match your search" : "No vendor payments found"}
            </CardContent>
          </Card>
        ) : (
          filteredVendorPayments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium">{getCustomerName(payment.customerId)}</h3>
                    <p className="text-sm text-muted-foreground">to {getVendorName(payment.vendorId)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(payment.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-purple-600 text-lg">{formatCurrency(payment.amountUSD)}</div>
                    <Badge className="mt-1">Completed</Badge>
                  </div>
                </div>
                {payment.description && (
                  <div className="text-sm text-muted-foreground border-t pt-2">
                    <strong>Description:</strong> {payment.description}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {!vendorPaymentsLoading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalVendorPayments)} of {totalVendorPayments} vendor payments
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
