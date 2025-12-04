"use client"

import { useSearchParams } from "next/navigation"
import CustomerDetailPageClient from "@/components/customers/CustomerDetailPageClient"

export default function CustomerDetailDetailPage() {
  const searchParams = useSearchParams()
  const customerId = searchParams.get("id")

  // If no id is provided, you could redirect or show a simple message.
  if (!customerId) {
    return <div className="p-4">Missing customer id</div>
  }

  return <CustomerDetailPageClient customerId={customerId} />
}
