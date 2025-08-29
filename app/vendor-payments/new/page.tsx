"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { VendorPaymentForm } from "@/components/vendor-payments/vendor-payment-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewVendorPaymentPage() {
  return (
    <DashboardLayout allowedRoles={["CLIENT", "PARTNER"]}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/vendor-payments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Make Vendor Payment</h1>
            <p className="text-muted-foreground">Process a payment from customer to vendor</p>
          </div>
        </div>
        <VendorPaymentForm />
      </div>
    </DashboardLayout>
  )
}
