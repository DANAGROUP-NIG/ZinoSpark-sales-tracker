import { z } from "zod"

export const paymentOrderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  vendorId: z.string().min(1, "Vendor is required"),
  // Conditionally require currency amounts based on market
  amountUSD: z.number().optional(),
  amountRMB: z.number().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  market: z.enum(["DUBAI", "CHINA"]).optional(),
}).superRefine((data, ctx) => {
  const market = data.market || "DUBAI"
  if (market === "DUBAI") {
    if (typeof data.amountUSD !== "number" || isNaN(data.amountUSD) || data.amountUSD <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amountUSD"],
        message: "Amount (USD) is required and must be greater than 0",
      })
    }
    // In Dubai, RMB must not be provided
    if (typeof data.amountRMB === "number" && data.amountRMB > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amountRMB"],
        message: "Do not provide RMB amount in Dubai market",
      })
    }
  } else if (market === "CHINA") {
    if (typeof data.amountRMB !== "number" || isNaN(data.amountRMB) || data.amountRMB <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amountRMB"],
        message: "Amount (RMB) is required and must be greater than 0",
      })
    }
    // In China, USD must not be provided
    if (typeof data.amountUSD === "number" && data.amountUSD > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amountUSD"],
        message: "Do not provide USD amount in China market",
      })
    }
  }
})

export const updatePaymentOrderSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().optional(),
})

export type PaymentOrderFormData = z.infer<typeof paymentOrderSchema>
export type UpdatePaymentOrderFormData = z.infer<typeof updatePaymentOrderSchema>
