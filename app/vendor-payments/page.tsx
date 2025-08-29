"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { VendorPaymentsTable } from "@/components/vendor-payments/vendor-payments-table"

export default function VendorPaymentsPage() {
  return (
    <DashboardLayout allowedRoles={["CLIENT", "PARTNER"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Payments</h1>
          <p className="text-muted-foreground">Process customer payments to vendors</p>
        </div>
        <VendorPaymentsTable />
      </div>
    </DashboardLayout>
  )
}
