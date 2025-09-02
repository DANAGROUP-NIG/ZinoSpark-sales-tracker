"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { customersApi, paymentsApi, vendorPaymentsApi } from "@/lib/api"
import { ArrowLeft, Mail, Phone, Wallet, Calendar } from "lucide-react"
import Link from "next/link"

export default function CustomerDetailPage() {
  const params = useParams()
  const customerId = params.id as string

  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => customersApi.getById(customerId),
  })

  // Use embedded payments/vendorPayments from customer detail if present; otherwise fallback to list APIs
  const embeddedPayments = customer?.payments || []
  const embeddedVendorPayments = customer?.vendorPayments || []
  const hasEmbedded = embeddedPayments.length > 0 || embeddedVendorPayments.length > 0
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["customer-payments", customerId],
    queryFn: () => paymentsApi.getAll({ customerId, limit: 50 }),
    enabled: !!customerId && !hasEmbedded,
  })

  const { data: vendorPaymentsData, isLoading: vendorPaymentsLoading } = useQuery({
    queryKey: ["customer-vendor-payments", customerId],
    queryFn: () => vendorPaymentsApi.getAll({ customerId, limit: 50 }),
    enabled: !!customerId && !hasEmbedded,
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount?: number, currency = "USD") => {
    const safe = typeof amount === 'number' && isFinite(amount) ? amount : 0
    if (currency === "USD") {
      return `$${safe.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    }
    return `₦${safe.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
  }

  if (customerLoading) {
    return (
      <DashboardLayout allowedRoles={["CLIENT"]}>
        <div className="space-y-6">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-48 bg-muted rounded animate-pulse" />
            <div className="h-48 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!customer) {
    return (
      <DashboardLayout allowedRoles={["CLIENT"]}>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Customer not found</h2>
          <p className="text-muted-foreground mt-2">The customer you're looking for doesn't exist.</p>
          <Button asChild className="mt-4">
            <Link href="/customers">Back to Customers</Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout allowedRoles={["CLIENT"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
            <p className="text-muted-foreground">Customer details and transaction history</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customer.email || "No email provided"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.phone || "No phone provided"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {formatDate(customer.createdAt)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Current Balance</span>
                </div>
                <Badge variant={customer.balanceUSD > 0 ? "default" : "secondary"} className="text-lg px-3 py-1">
                  {formatCurrency(customer.balanceUSD)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" asChild>
                <Link href={`/payments/new?customerId=${customer.id}`}>
                  <Wallet className="mr-2 h-4 w-4" />
                  Add Payment
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                <Link href={`/vendor-payments/new?customerId=${customer.id}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Make Vendor Payment
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse w-32" />
                      <div className="h-3 bg-muted rounded animate-pulse w-48" />
                    </div>
                    <div className="h-6 bg-muted rounded animate-pulse w-20" />
                  </div>
                ))}
              </div>
            ) : (hasEmbedded ? embeddedPayments.length === 0 : (paymentsData?.payments.length === 0)) ? (
              <p className="text-center text-muted-foreground py-8">No payments found</p>
            ) : (
              <div className="space-y-4">
                {(hasEmbedded ? embeddedPayments : paymentsData?.payments || []).map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {formatCurrency(payment.amountNaira, "NGN")} → {formatCurrency(payment.amountUSD)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Rate: ₦{payment.exchangeRate}/USD • {formatDate(payment.transactionDate || payment.createdAt)}
                      </p>
                    </div>
                    <Badge>Completed</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vendor Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {vendorPaymentsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse w-24" />
                      <div className="h-3 bg-muted rounded animate-pulse w-48" />
                    </div>
                    <div className="h-6 bg-muted rounded animate-pulse w-20" />
                  </div>
                ))}
              </div>
            ) : (hasEmbedded ? embeddedVendorPayments.length === 0 : (vendorPaymentsData?.vendorPayments.length === 0)) ? (
              <p className="text-center text-muted-foreground py-8">No vendor payments found</p>
            ) : (
              <div className="space-y-4">
                {(hasEmbedded ? embeddedVendorPayments : vendorPaymentsData?.vendorPayments || []).map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{formatCurrency(payment.amountUSD)}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.description || "No description"} • {formatDate(payment.transactionDate || payment.createdAt)}
                      </p>
                    </div>
                    <Badge>Completed</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
