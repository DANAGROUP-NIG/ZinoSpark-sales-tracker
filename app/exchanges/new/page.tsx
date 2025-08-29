"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ExchangeForm } from "@/components/exchanges/exchange-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewExchangePage() {
  return (
    <DashboardLayout allowedRoles={["CLIENT"]}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/exchanges">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Initiate Exchange</h1>
            <p className="text-muted-foreground">Start a new currency exchange with a vendor</p>
          </div>
        </div>
        <ExchangeForm />
      </div>
    </DashboardLayout>
  )
}
