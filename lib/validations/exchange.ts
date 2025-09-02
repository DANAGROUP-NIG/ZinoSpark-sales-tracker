import { z } from "zod"

export const exchangeSchema = z.object({
  vendorId: z.string().min(1, "Please select a vendor"),
  amountNaira: z.number().min(0.01, "Amount must be greater than 0"),
  exchangeRate: z.number().min(0.01, "Exchange rate must be greater than 0"),
  // Accept YYYY-MM-DD from the date input
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/,{ message: "Invalid date" })
    .optional(),
})

export type ExchangeFormData = z.infer<typeof exchangeSchema>

export const updateExchangeStatusSchema = z.object({
  status: z.enum(["PENDING", "RECEIVED", "CANCELLED"], {
    required_error: "Please select a status",
  }),
})

export type UpdateExchangeStatusData = z.infer<typeof updateExchangeStatusSchema>
