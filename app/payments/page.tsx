"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PaymentsTable } from "@/components/payments/payments-table"

export default function PaymentsPage() {
  return (
    <DashboardLayout allowedRoles={["CLIENT"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">Track customer payments and currency conversions</p>
        </div>
        <PaymentsTable />
      </div>
    </DashboardLayout>
  )
}
