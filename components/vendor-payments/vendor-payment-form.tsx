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
import { customersApi, vendorsApi, vendorPaymentsApi, walletApi } from "@/lib/api"
import { vendorPaymentSchema, type VendorPaymentFormData } from "@/lib/validations/vendor-payment"
import { Loader2, Send, AlertTriangle, Wallet } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMarketStore } from "@/lib/stores/market-store"

export function VendorPaymentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCustomerId = searchParams.get("customerId")
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { currentMarket } = useMarketStore()

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
      transactionDate: new Date().toISOString().slice(0, 10),
    },
  })

  const selectedCustomerId = watch("customerId")
  const amountUSD = watch("amountUSD")

  // Load customers for dropdown
  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ["customers-dropdown"],
    queryFn: () => customersApi.getAll({ limit: 100 }),
  })

  // Load payment vendors
  const { data: vendorsData, isLoading: loadingVendors } = useQuery({
    queryKey: ["vendors-payment"],
    queryFn: () => vendorsApi.getAll({ type: "PAYMENT", limit: 100 }),
  })

  // Fetch wallet balance
  const { data: walletData, isLoading: loadingWallet } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: () => walletApi.getData(),
  })
  const walletBalance = walletData?.balance ?? 0

  const createPaymentMutation = useMutation({
    mutationFn: vendorPaymentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      queryClient.invalidateQueries({ queryKey: ["vendor-payments"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] })
      toast({
        title: "Payment Sent",
        description: `Successfully sent ${currentMarket === 'DUBAI' ? `$${amountUSD.toFixed(2)} USD` : `¥${amountUSD.toFixed(2)} RMB`} to vendor`,
      })
      reset()
      router.push("/vendor-payments")
    },
    onError: (error: any) => {
      let errorMessage = error?.message || "Failed to process payment."
      if (error?.details?.response?.message) {
        errorMessage = error.details.response.message
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: VendorPaymentFormData) => {
    const isoDate = data.transactionDate ? new Date(data.transactionDate + 'T00:00:00').toISOString() : undefined
    createPaymentMutation.mutate({ ...data, transactionDate: isoDate as any })
  }

  const selectedCustomer = customersData?.customers?.find((c) => c.id === selectedCustomerId)
  const selectedVendor = vendorsData?.vendors?.find((v) => v.id === watch("vendorId"))
  const hasInsufficientCustomerBalance = selectedCustomer && amountUSD > (currentMarket === 'DUBAI' ? selectedCustomer.balanceUSD : (selectedCustomer.balanceRMB || 0))
  const hasInsufficientWalletBalance = amountUSD > walletBalance
  const newBalance = selectedCustomer ? (currentMarket === 'DUBAI' ? selectedCustomer.balanceUSD - amountUSD : (selectedCustomer.balanceRMB || 0) - amountUSD) : 0

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
                      ) : customersData?.customers?.length === 0 ? (
                        <SelectItem value="no-customers" disabled>
                          No customers available
                        </SelectItem>
                      ) : (
                        customersData?.customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex justify-between items-center w-full">
                              <span>{customer.name}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                {currentMarket === 'DUBAI' ? `USD: $${customer.balanceUSD.toFixed(2)}` : `RMB: ¥${(customer.balanceRMB || 0).toFixed(2)}`}
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
                  Available balance: {currentMarket === 'DUBAI' ? `USD $${selectedCustomer.balanceUSD.toFixed(2)}` : `RMB ¥${(selectedCustomer.balanceRMB || 0).toFixed(2)}`}
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
                      ) : vendorsData?.vendors?.length === 0 ? (
                        <SelectItem value="no-vendors" disabled>
                          No payment vendors available
                        </SelectItem>
                      ) : (
                        vendorsData?.vendors?.map((vendor) => (
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

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amountUSD">Amount ({currentMarket === 'DUBAI' ? 'USD' : 'RMB'}) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  {currentMarket === 'DUBAI' ? '$' : '¥'}
                </span>
                <Input
                  id="amountUSD"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className={`pl-8 ${errors.amountUSD || hasInsufficientCustomerBalance || hasInsufficientWalletBalance ? "border-destructive" : ""}`}
                  {...register("amountUSD", { valueAsNumber: true })}
                />
              </div>
              {errors.amountUSD && <p className="text-sm text-destructive">{errors.amountUSD.message}</p>}
              {hasInsufficientCustomerBalance && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Insufficient customer balance. Customer has {currentMarket === 'DUBAI' ? `$${selectedCustomer.balanceUSD.toFixed(2)} USD` : `¥${(selectedCustomer.balanceRMB || 0).toFixed(2)} RMB`} available.
                  </AlertDescription>
                </Alert>
              )}
              {hasInsufficientWalletBalance && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Insufficient wallet balance. Wallet has {currentMarket === 'DUBAI' ? `$${walletBalance.toFixed(2)} USD` : `¥${walletBalance.toFixed(2)} RMB`} available.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Transaction Date Picker */}
            {/* <div className="space-y-2">
              <Label htmlFor="transactionDate">Transaction Date *</Label>
              <Controller
                name="transactionDate"
                control={control}
                render={({ field }) => (
                  <Input
                    id="transactionDate"
                    type="date"
                    value={field.value ? field.value.slice(0, 10) : ""}
                    onChange={e => field.onChange(e.target.value)}
                    className={errors.transactionDate ? "border-destructive" : ""}
                  />
                )}
              />
              {errors.transactionDate && <p className="text-sm text-destructive">{errors.transactionDate.message}</p>}
            </div> */}

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
                disabled={createPaymentMutation.isPending || hasInsufficientCustomerBalance || hasInsufficientWalletBalance || amountUSD === 0}
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
      {selectedCustomer && selectedVendor && amountUSD > 0 && !hasInsufficientCustomerBalance && !hasInsufficientWalletBalance && (
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
                <span className="font-medium">{currentMarket === 'DUBAI' ? `$${amountUSD.toFixed(2)} USD` : `¥${amountUSD.toFixed(2)} RMB`}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Balance:</span>
                  <span>{currentMarket === 'DUBAI' ? `$${selectedCustomer.balanceUSD.toFixed(2)}` : `¥${(selectedCustomer.balanceRMB || 0).toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>New Balance:</span>
                  <span className="text-primary">{currentMarket === 'DUBAI' ? `$${newBalance.toFixed(2)}` : `¥${newBalance.toFixed(2)}`}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
