import { z } from "zod"

export const vendorPaymentSchema = z.object({
  customerId: z.string().min(1, "Please select a customer"),
  vendorId: z.string().min(1, "Please select a vendor"),
  amountUSD: z.number().min(0.01, "Amount must be greater than 0").optional(),
  amountRMB: z.number().min(0.01, "Amount must be greater than 0").optional(),
  description: z.string().optional().or(z.literal("")),
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/,{ message: "Invalid date" })
    .optional(),
}).refine(
  (data) => (data.amountUSD && data.amountUSD > 0) || (data.amountRMB && data.amountRMB > 0),
  { message: "Amount must be greater than 0", path: ["amountUSD"] }
)

export type VendorPaymentFormData = z.infer<typeof vendorPaymentSchema>
