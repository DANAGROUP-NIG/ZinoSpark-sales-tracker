import { PaymentOrderForm } from "@/components/payment-orders/payment-order-form"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function NewPaymentOrderPage() {
  return (
    <DashboardLayout allowedRoles={["CLIENT"]}>
      <PaymentOrderForm />
    </DashboardLayout>
  )
}
