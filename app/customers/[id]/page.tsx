"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { customersApi, paymentsApi, vendorPaymentsApi } from "@/lib/api"
import { ArrowLeft, Mail, Phone, Wallet, Calendar, Share2, FileText } from "lucide-react"
import Link from "next/link"
import { useUsdVisibilityStore } from "@/lib/stores/usd-visibility-store"
import { useMarketStore } from "@/lib/stores/market-store"
import { useToast } from "@/components/ui/use-toast";

export default function CustomerDetailPage() {
  const params = useParams()
  const customerId = params.id as string
  const { showUsd } = useUsdVisibilityStore()
  const { currentMarket } = useMarketStore()
  const { toast } = useToast();

  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => customersApi.getById(customerId),
  })

  // Use embedded payments/vendorPayments from customer detail if present; otherwise fallback to list APIs
  const allEmbeddedPayments = customer?.payments || []
  const allEmbeddedVendorPayments = customer?.vendorPayments || []
  
  // Filter embedded transactions by market
  const embeddedPayments = allEmbeddedPayments.filter((payment: any) => payment.market === currentMarket)
  const embeddedVendorPayments = allEmbeddedVendorPayments.filter((payment: any) => payment.market === currentMarket)
  
  const hasEmbedded = embeddedPayments.length > 0 || embeddedVendorPayments.length > 0
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["customer-payments", customerId, currentMarket],
    queryFn: () => paymentsApi.getAll({ customerId, limit: 50 }),
    enabled: !!customerId && !hasEmbedded,
  })

  const { data: vendorPaymentsData, isLoading: vendorPaymentsLoading } = useQuery({
    queryKey: ["customer-vendor-payments", customerId, currentMarket],
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

  const AED_RATE = 3.67
  const RMB_TO_AED = 0.5 // Approximate AED per 1 RMB for China market displays
  const renderUsdWithAed = (usd?: number) => {
    const safe = typeof usd === 'number' && isFinite(usd) ? usd : 0
    const aed = safe * AED_RATE
    return (
      <div className="flex flex-col items-end">
        <span className="font-medium">{showUsd ? `$${safe.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : <span className="tracking-widest">*****</span>}</span>
        <span className="text-xs text-muted-foreground">AED {aed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    )
  }

  const shareToWhatsApp = (text: string) => {
    if (currentMarket === "CHINA") {
      // Prefer native share sheet where available
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        (navigator as any).share({ text }).catch(() => {
          // Fall back to clipboard on cancel or error
        });
        return;
      }

      const copy = async () => {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
          } else {
            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
          }
          toast({
            title: "Copied to clipboard",
            description: "Payment details copied. Share via WeChat or other apps.",
          });
        } catch (e) {
          toast({
            title: "Unable to copy",
            description: "Please long-press and copy manually.",
            variant: "destructive",
          });
        }
      };

      copy();
      return;
    }
    const encoded = encodeURIComponent(text);

    // Try the native Web Share API first when available
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      (navigator as any).share({ text }).catch(() => {
        // Ignore cancellation and fall through to URL method
      });
      return;
    }

    // Detect mobile to choose the deep link vs web URL
    const isMobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const href = isMobile
      ? `whatsapp://send?text=${encoded}`
      : `https://web.whatsapp.com/send?text=${encoded}`;

    const popup = window.open(href, "_blank", "noopener,noreferrer");
    if (!popup) {
      // Fallback to public API endpoint if popup blocked or handler unavailable
      window.location.href = `https://api.whatsapp.com/send?text=${encoded}`;
    }
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
              <div className="space-y-3">
                {currentMarket === 'DUBAI' ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">USD Balance</span>
                    </div>
                    <div className="text-right">
                      <Badge variant={customer.balanceUSD > 0 ? "default" : "secondary"} className="text-lg px-3 py-1">
                        {showUsd ? formatCurrency(customer.balanceUSD) : <span className="tracking-widest">*****</span>}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        AED {(customer.balanceUSD * AED_RATE).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">RMB Balance</span>
                    </div>
                    <div className="text-right">
                      <Badge variant={(customer.balanceRMB || 0) > 0 ? "default" : "secondary"} className="text-lg px-3 py-1">
                        RMB {customer.balanceRMB?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                      </Badge>
                    </div>
                  </div>
                )}
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
              <Button variant="outline" className="w-full justify-start bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" asChild>
                <Link href={`/payment-orders/new?customerId=${customer.id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Create Payment Order
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
                        {formatCurrency(payment.amountNaira, "NGN")} →
                        {currentMarket === 'DUBAI' ? (
                          showUsd ? ` ${formatCurrency(payment.amountUSD)}` : ' '
                        ) : (
                          ` RMB ${(payment.amountNaira / payment.exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Rate: ₦{payment.exchangeRate}/{currentMarket === 'DUBAI' ? 'USD' : 'RMB'} • {formatDate(payment.transactionDate || payment.createdAt)}
                      </p>
                      {currentMarket === 'DUBAI' ? (
                        <p className="text-xs text-muted-foreground">AED {(payment.amountUSD * AED_RATE).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">AED {((payment.amountNaira / payment.exchangeRate) * RMB_TO_AED).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      )}
                      {(payment.balanceBeforeUSD !== undefined || payment.balanceAfterUSD !== undefined) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {currentMarket === 'DUBAI' ? (
                            <>
                              Prev: {showUsd ? formatCurrency(payment.balanceBeforeUSD) : '*****'} • Curr: {showUsd ? formatCurrency(payment.balanceAfterUSD) : '*****'}
                            </>
                          ) : (
                            <>
                              Prev: RMB {payment.balanceBeforeRMB?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} • Curr: RMB {payment.balanceAfterRMB?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            </>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>Completed</Badge>
                      <Button size="icon" variant="ghost" onClick={() => {
                        let lines: string[] = []
                        if (currentMarket === 'DUBAI') {
                          lines = [
                            `Payment: ${formatCurrency(payment.amountNaira, 'NGN')} → ${showUsd ? formatCurrency(payment.amountUSD) : 'USD hidden'} (AED ${(payment.amountUSD * AED_RATE).toFixed(2)})`,
                            `Rate: ₦${payment.exchangeRate}/USD`,
                            `Date: ${formatDate(payment.transactionDate || payment.createdAt)}`,
                          ]
                          if (payment.balanceBeforeUSD !== undefined) lines.push(`Prev: ${showUsd ? formatCurrency(payment.balanceBeforeUSD) : 'hidden'}`)
                          if (payment.balanceAfterUSD !== undefined) lines.push(`Curr: ${showUsd ? formatCurrency(payment.balanceAfterUSD) : 'hidden'}`)
                        } else {
                          const rmb = (payment.amountNaira / payment.exchangeRate)
                          const aed = rmb * RMB_TO_AED
                          lines = [
                            `Payment: ${formatCurrency(payment.amountNaira, 'NGN')} → RMB ${rmb.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (AED ${aed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`,
                            `Rate: ₦${payment.exchangeRate}/RMB`,
                            `Date: ${formatDate(payment.transactionDate || payment.createdAt)}`,
                          ]
                          if (payment.balanceBeforeRMB !== undefined) lines.push(`Prev: RMB ${payment.balanceBeforeRMB.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
                          if (payment.balanceAfterRMB !== undefined) lines.push(`Curr: RMB ${payment.balanceAfterRMB.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
                        }
                        shareToWhatsApp(lines.join("\n"))
                      }}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
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
                      <div className="font-medium">
                        {currentMarket === 'DUBAI' 
                          ? (showUsd ? formatCurrency(payment.amountUSD) : <span className="tracking-widest">*****</span>)
                          : formatCurrency(payment.amountRMB || payment.amountUSD, 'RMB')
                        }
                      </div>
                      {currentMarket === 'DUBAI' && (
                        <p className="text-xs text-muted-foreground">AED {(payment.amountUSD * AED_RATE).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {payment.description || "No description"} • {formatDate(payment.transactionDate || payment.createdAt)}
                      </p>
                      {currentMarket === 'DUBAI' && (payment.balanceBeforeUSD !== undefined || payment.balanceAfterUSD !== undefined) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Prev: {showUsd ? formatCurrency(payment.balanceBeforeUSD) : '*****'} • Curr: {showUsd ? formatCurrency(payment.balanceAfterUSD) : '*****'}
                        </p>
                      )}
                      {currentMarket === 'CHINA' && (payment.balanceBeforeRMB !== undefined || payment.balanceAfterRMB !== undefined) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Prev: ¥{payment.balanceBeforeRMB?.toFixed(2) || '0.00'} • Curr: ¥{payment.balanceAfterRMB?.toFixed(2) || '0.00'}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>Completed</Badge>
                      <Button size="icon" variant="ghost" onClick={() => {
                        const lines = currentMarket === 'DUBAI' 
                          ? [
                              `Vendor Payment: ${showUsd ? formatCurrency(payment.amountUSD) : 'USD hidden'} (AED ${(payment.amountUSD * AED_RATE).toFixed(2)})`,
                              `Date: ${formatDate(payment.transactionDate || payment.createdAt)}`,
                              `Description: ${payment.description || 'N/A'}`,
                            ]
                          : [
                              `Vendor Payment: ¥${(payment.amountRMB || payment.amountUSD).toFixed(2)} RMB`,
                              `Date: ${formatDate(payment.transactionDate || payment.createdAt)}`,
                              `Description: ${payment.description || 'N/A'}`,
                            ]
                        if (currentMarket === 'DUBAI') {
                          if (payment.balanceBeforeUSD !== undefined) lines.push(`Prev: ${showUsd ? formatCurrency(payment.balanceBeforeUSD) : 'hidden'}`)
                          if (payment.balanceAfterUSD !== undefined) lines.push(`Curr: ${showUsd ? formatCurrency(payment.balanceAfterUSD) : 'hidden'}`)
                        } else {
                          if (payment.balanceBeforeRMB !== undefined) lines.push(`Prev: ¥${payment.balanceBeforeRMB.toFixed(2)}`)
                          if (payment.balanceAfterRMB !== undefined) lines.push(`Curr: ¥${payment.balanceAfterRMB.toFixed(2)}`)
                        }
                        shareToWhatsApp(lines.join("\n"))
                      }}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
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
