import { z } from "zod"

export const vendorPaymentSchema = z.object({
  customerId: z.string().min(1, "Please select a customer"),
  vendorId: z.string().min(1, "Please select a vendor"),
  amountUSD: z.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().optional().or(z.literal("")),
})

export type VendorPaymentFormData = z.infer<typeof vendorPaymentSchema>
