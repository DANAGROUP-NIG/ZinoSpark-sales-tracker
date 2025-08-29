"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ExchangesTable } from "@/components/exchanges/exchanges-table"

export default function ExchangesPage() {
  return (
    <DashboardLayout allowedRoles={["CLIENT", "PARTNER"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Currency Exchanges</h1>
          <p className="text-muted-foreground">Manage currency exchanges with vendors</p>
        </div>
        <ExchangesTable />
      </div>
    </DashboardLayout>
  )
}
