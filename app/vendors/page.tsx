"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { VendorsTable } from "@/components/vendors/vendors-table"

export default function VendorsPage() {
  return (
    <DashboardLayout allowedRoles={["CLIENT"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">Manage exchange and payment vendors</p>
        </div>
        <VendorsTable />
      </div>
    </DashboardLayout>
  )
}
