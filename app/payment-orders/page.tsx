import { PaymentOrdersTable } from "@/components/payment-orders/payment-orders-table"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function PaymentOrdersPage() {
  return (
    <DashboardLayout allowedRoles={["CLIENT", "PARTNER"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Payment Orders</h1>
          <p className="text-muted-foreground">
            Manage payment orders created by clients and processed by partners
          </p>
        </div>
        <PaymentOrdersTable />
      </div>
    </DashboardLayout>
  )
}
