"use client"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { customersApi, vendorsApi, vendorPaymentsApi } from "@/lib/api"
import { vendorPaymentSchema, type VendorPaymentFormData } from "@/lib/validations/vendor-payment"
import { Loader2, Send, AlertTriangle, Wallet } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export function VendorPaymentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCustomerId = searchParams.get("customerId")
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
  } = useForm<VendorPaymentFormData>({
    resolver: zodResolver(vendorPaymentSchema),
    defaultValues: {
      customerId: preselectedCustomerId || "",
      vendorId: "",
      amountUSD: 0,
      description: "",
    },
  })

  const selectedCustomerId = watch("customerId")
  const amountUSD = watch("amountUSD")

  // Load customers for dropdown
  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ["customers-dropdown"],
    // Use mock data for development
    queryFn: () =>
      Promise.resolve({
        customers: [
          { id: "1", name: "John Doe", balanceUSD: 1250.5 },
          { id: "2", name: "Jane Smith", balanceUSD: 750.25 },
          { id: "3", name: "Alice Johnson", balanceUSD: 2100.75 },
          { id: "4", name: "Bob Wilson", balanceUSD: 0 },
        ],
      }),
    select: (data) => data.customers || data,
  })

  // Load payment vendors
  const { data: vendors = [], isLoading: loadingVendors } = useQuery({
    queryKey: ["vendors-payment"],
    // Use mock data for development
    queryFn: () =>
      Promise.resolve({
        vendors: [
          { id: "2", name: "Payment Vendor B", type: "PAYMENT" },
          { id: "4", name: "Payment Vendor D", type: "PAYMENT" },
        ],
      }),
    select: (data) => data.vendors || data,
  })

  const createPaymentMutation = useMutation({
    mutationFn: vendorPaymentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      queryClient.invalidateQueries({ queryKey: ["vendor-payments"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] })
      toast({
        title: "Payment Sent",
        description: `Successfully sent $${amountUSD.toFixed(2)} USD to vendor`,
      })
      reset()
      router.push("/vendor-payments")
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process payment.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: VendorPaymentFormData) => {
    createPaymentMutation.mutate(data)
  }

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)
  const selectedVendor = vendors.find((v) => v.id === watch("vendorId"))
  const hasInsufficientBalance = selectedCustomer && amountUSD > selectedCustomer.balanceUSD
  const newBalance = selectedCustomer ? selectedCustomer.balanceUSD - amountUSD : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Make Vendor Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Selection */}
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer *</Label>
              <Controller
                name="customerId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.customerId ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingCustomers ? (
                        <SelectItem value="loading" disabled>
                          Loading customers...
                        </SelectItem>
                      ) : (
                        customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex justify-between items-center w-full">
                              <span>{customer.name}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                ${customer.balanceUSD.toFixed(2)}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.customerId && <p className="text-sm text-destructive">{errors.customerId.message}</p>}
              {selectedCustomer && (
                <p className="text-sm text-muted-foreground">
                  Available balance: ${selectedCustomer.balanceUSD.toFixed(2)} USD
                </p>
              )}
            </div>

            {/* Vendor Selection */}
            <div className="space-y-2">
              <Label htmlFor="vendorId">Payment Vendor *</Label>
              <Controller
                name="vendorId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.vendorId ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select a payment vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingVendors ? (
                        <SelectItem value="loading" disabled>
                          Loading vendors...
                        </SelectItem>
                      ) : vendors.length === 0 ? (
                        <SelectItem value="no-vendors" disabled>
                          No payment vendors available
                        </SelectItem>
                      ) : (
                        vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.vendorId && <p className="text-sm text-destructive">{errors.vendorId.message}</p>}
            </div>

            {/* Amount in USD */}
            <div className="space-y-2">
              <Label htmlFor="amountUSD">Amount (USD) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amountUSD"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className={`pl-8 ${errors.amountUSD || hasInsufficientBalance ? "border-destructive" : ""}`}
                  {...register("amountUSD", { valueAsNumber: true })}
                />
              </div>
              {errors.amountUSD && <p className="text-sm text-destructive">{errors.amountUSD.message}</p>}
              {hasInsufficientBalance && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Insufficient balance. Customer has ${selectedCustomer.balanceUSD.toFixed(2)} USD available.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter payment description (optional)"
                rows={3}
                {...register("description")}
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                disabled={createPaymentMutation.isPending || hasInsufficientBalance || amountUSD === 0}
              >
                {createPaymentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Payment
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      {selectedCustomer && selectedVendor && amountUSD > 0 && !hasInsufficientBalance && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Payment Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">From:</span>
                <span>{selectedCustomer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">To:</span>
                <span>{selectedVendor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">${amountUSD.toFixed(2)} USD</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Balance:</span>
                  <span>${selectedCustomer.balanceUSD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>New Balance:</span>
                  <span className="text-primary">${newBalance.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
