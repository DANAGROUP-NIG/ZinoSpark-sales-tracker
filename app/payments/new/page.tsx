"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PaymentForm } from "@/components/payments/payment-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewPaymentPage() {
  return (
    <DashboardLayout allowedRoles={["CLIENT"]}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/payments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Record Payment</h1>
            <p className="text-muted-foreground">Add a new customer payment and currency conversion</p>
          </div>
        </div>
        <PaymentForm />
      </div>
    </DashboardLayout>
  )
}
