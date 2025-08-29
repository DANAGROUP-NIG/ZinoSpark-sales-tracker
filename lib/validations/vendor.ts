import { z } from "zod"

export const vendorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["EXCHANGE", "PAYMENT"], {
    required_error: "Please select a vendor type",
  }),
  contactInfo: z.string().optional().or(z.literal("")),
})

export type VendorFormData = z.infer<typeof vendorSchema>
