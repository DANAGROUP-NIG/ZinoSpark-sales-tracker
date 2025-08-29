"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CustomersTable } from "@/components/customers/customers-table"

export default function CustomersPage() {
  return (
    <DashboardLayout allowedRoles={["CLIENT"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Manage your customer accounts and balances</p>
        </div>
        <CustomersTable />
      </div>
    </DashboardLayout>
  )
}
