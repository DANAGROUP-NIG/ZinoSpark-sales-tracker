import { z } from "zod"

export const paymentSchema = z.object({
  customerId: z.string().min(1, "Please select a customer"),
  amountNaira: z.number().min(0.01, "Amount must be greater than 0"),
  exchangeRate: z.number().min(0.01, "Exchange rate must be greater than 0"),
})

export type PaymentFormData = z.infer<typeof paymentSchema>
