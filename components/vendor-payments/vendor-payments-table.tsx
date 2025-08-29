"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { vendorPaymentsApi } from "@/lib/api"
import { Search, Plus, Filter } from "lucide-react"
import Link from "next/link"

// Mock vendor payments data
const mockVendorPayments = [
  {
    id: "1",
    customerId: "1",
    vendorId: "2",
    customer: { name: "John Doe" },
    vendor: { name: "Payment Vendor B" },
    amountUSD: 500.0,
    description: "International transfer for business expenses",
    createdAt: "2024-01-20T14:45:00Z",
  },
  {
    id: "2",
    customerId: "2",
    vendorId: "4",
    customer: { name: "Jane Smith" },
    vendor: { name: "Payment Vendor D" },
    amountUSD: 750.0,
    description: "Payment for overseas supplier",
    createdAt: "2024-01-18T11:30:00Z",
  },
  {
    id: "3",
    customerId: "3",
    vendorId: "2",
    customer: { name: "Alice Johnson" },
    vendor: { name: "Payment Vendor B" },
    amountUSD: 1200.0,
    description: "",
    createdAt: "2024-01-15T09:20:00Z",
  },
  {
    id: "4",
    customerId: "1",
    vendorId: "4",
    customer: { name: "John Doe" },
    vendor: { name: "Payment Vendor D" },
    amountUSD: 300.0,
    description: "Monthly service payment",
    createdAt: "2024-01-12T16:15:00Z",
  },
]

const mockCustomers = [
  { id: "1", name: "John Doe" },
  { id: "2", name: "Jane Smith" },
  { id: "3", name: "Alice Johnson" },
]

export function VendorPaymentsTable() {
  const [search, setSearch] = useState("")
  const [customerFilter, setCustomerFilter] = useState("all")
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-payments", { page, search, customerId: customerFilter }],
    // Use mock data for development
    queryFn: () =>
      Promise.resolve({
        vendorPayments: mockVendorPayments.filter(
          (p) =>
            (customerFilter === "all" || p.customerId === customerFilter) &&
            (search === "" ||
              p.customer.name.toLowerCase().includes(search.toLowerCase()) ||
              p.vendor.name.toLowerCase().includes(search.toLowerCase())),
        ),
        total: mockVendorPayments.length,
        page,
        totalPages: 1,
      }),
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
              {mockCustomers.map((customer) => (
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
                </TableRow>
              ))
            ) : data?.vendorPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No vendor payments found
                </TableCell>
              </TableRow>
            ) : (
              data?.vendorPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.customer.name}</TableCell>
                  <TableCell>{payment.vendor.name}</TableCell>
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
                    <Badge>Completed</Badge>
                  </TableCell>
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
        ) : data?.vendorPayments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">No vendor payments found</CardContent>
          </Card>
        ) : (
          data?.vendorPayments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium">{payment.customer.name}</h3>
                    <p className="text-sm text-muted-foreground">to {payment.vendor.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(payment.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary text-lg">{formatCurrency(payment.amountUSD)}</div>
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
    </div>
  )
}
