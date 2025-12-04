"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { paymentOrderSchema, type PaymentOrderFormData } from "@/lib/validations/payment-order"
import { paymentOrdersApi, customersApi, vendorsApi } from "@/lib/api"
import { useMarketStore } from "@/lib/stores/market-store"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, DollarSign, Users, Building2 } from "lucide-react"
import { SearchableSelect } from "@/components/ui/searchable-select"

type CustomerSummary = {
  id: string
  name: string
  balanceUSD: number
  balanceRMB?: number | null
  email?: string | null
}

type VendorSummary = {
  id: string
  name: string
  type?: string
  contactInfo?: string | null
}

export function PaymentOrderForm() {
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
    setValue,
    formState: { errors },
    reset,
  } = useForm<PaymentOrderFormData>({
    resolver: zodResolver(paymentOrderSchema),
    defaultValues: {
      customerId: preselectedCustomerId || "",
      vendorId: "",
      amountUSD: 0,
      amountRMB: 0,
      description: "",
      notes: "",
      market: currentMarket,
    },
  })
  // Keep the hidden market field in sync with the selected market
  useEffect(() => {
    setValue("market", currentMarket as any, { shouldValidate: true })
  }, [currentMarket, setValue])


  const selectedCustomerId = watch("customerId")
  const amountUSD = watch("amountUSD")
  const amountRMB = watch("amountRMB")

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

  const createPaymentOrderMutation = useMutation({
    mutationFn: paymentOrdersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      queryClient.invalidateQueries({ queryKey: ["payment-orders"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] })
      const isChina = currentMarket === 'CHINA'
      const amountText = isChina
        ? `¥${(amountRMB || 0).toFixed(2)} RMB`
        : `$${(amountUSD || 0).toFixed(2)} USD`
      toast({
        title: "Payment Order Created",
        description: `Successfully created payment order for ${amountText}`,
      })
      reset()
      router.push("/payment-orders")
    },
    onError: (error: any) => {
      let errorMessage = error?.message || "Failed to create payment order."
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

  const onSubmit = (data: PaymentOrderFormData) => {
    const payload: any = { ...data, market: currentMarket }
    if (currentMarket === 'CHINA') {
      // RMB only
      payload.amountUSD = undefined
    } else {
      // Dubai: USD only
      payload.amountRMB = undefined
    }
    createPaymentOrderMutation.mutate(payload)
  }

  const customers = useMemo(() => (customersData?.customers ?? []) as CustomerSummary[], [customersData])
  const vendors = useMemo(() => (vendorsData?.vendors ?? []) as VendorSummary[], [vendorsData])

  const customerOptions = useMemo(
    () =>
      customers.map((customer) => ({
        value: customer.id,
        label: customer.name,
        description: customer.email || "No email",
        meta: customer,
        searchKeywords: `${customer.name} ${customer.email ?? ""}`,
      })),
    [customers],
  )

  const vendorOptions = useMemo(
    () =>
      vendors.map((vendor) => ({
        value: vendor.id,
        label: vendor.name,
        description: vendor.type ? `Type: ${vendor.type}` : undefined,
        meta: vendor,
        searchKeywords: `${vendor.name} ${vendor.type ?? ""} ${vendor.contactInfo ?? ""}`,
      })),
    [vendors],
  )

  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId)
  const selectedVendor = vendors.find((vendor) => vendor.id === watch("vendorId"))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Payment Order</h1>
          <p className="text-muted-foreground">
            Create a payment order for a customer to pay a vendor
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Order Details</CardTitle>
          <CardDescription>
            Create a payment order that will be processed by a partner
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Hidden market field to drive schema validation */}
            <input type="hidden" {...register("market")} value={currentMarket} readOnly />
            {/* Customer Selection */}
            <div className="space-y-2">
              <Label htmlFor="customerId" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Customer *
              </Label>
              <Controller
                name="customerId"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={customerOptions}
                    placeholder="Select customer"
                    searchPlaceholder="Search customers..."
                    emptyMessage="No customers found"
                    loading={loadingCustomers}
                    triggerClassName={errors.customerId ? "border-destructive" : undefined}
                    renderOption={(option) => {
                      const customer = option.meta as CustomerSummary | undefined
                      return (
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-sm text-muted-foreground">
                            {customer?.email || "No email"}
                          </span>
                        </div>
                      )
                    }}
                  />
                )}
              />
              {errors.customerId && (
                <p className="text-sm text-red-500">{errors.customerId.message}</p>
              )}
            </div>

            {/* Vendor Selection */}
            <div className="space-y-2">
              <Label htmlFor="vendorId" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Vendor *
              </Label>
              <Controller
                name="vendorId"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={vendorOptions}
                    placeholder="Select vendor"
                    searchPlaceholder="Search vendors..."
                    emptyMessage="No vendors found"
                    loading={loadingVendors}
                    triggerClassName={errors.vendorId ? "border-destructive" : undefined}
                    renderOption={(option) => {
                      const vendor = option.meta as VendorSummary | undefined
                      return (
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          {vendor?.type && (
                            <span className="text-sm uppercase text-muted-foreground">{vendor.type}</span>
                          )}
                        </div>
                      )
                    }}
                  />
                )}
              />
              {errors.vendorId && (
                <p className="text-sm text-red-500">{errors.vendorId.message}</p>
              )}
            </div>

            {/* Amount USD (Dubai only) */}
            {currentMarket === 'DUBAI' && (
              <div className="space-y-2">
                <Label htmlFor="amountUSD" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Amount (USD) *
                </Label>
                <Input
                  id="amountUSD"
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register("amountUSD", { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.amountUSD && (
                  <p className="text-sm text-red-500">{errors.amountUSD.message}</p>
                )}
              </div>
            )}

            {/* Amount RMB (China only) */}
            {currentMarket === 'CHINA' && (
              <div className="space-y-2">
                <Label htmlFor="amountRMB">Amount (RMB) *</Label>
                <Input
                  id="amountRMB"
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register("amountRMB", { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.amountRMB && (
                  <p className="text-sm text-red-500">{errors.amountRMB.message}</p>
                )}
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                {...register("description")}
                placeholder="Payment description (optional)"
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Additional notes for the partner (optional)"
                rows={3}
              />
              {errors.notes && (
                <p className="text-sm text-red-500">{errors.notes.message}</p>
              )}
            </div>

            {/* Customer Balance Info */}
            {selectedCustomer && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Customer Balance</h4>
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">{currentMarket === 'DUBAI' ? 'USD Balance:' : 'RMB Balance:'}</span>
                    <span className="font-medium">
                      {currentMarket === 'DUBAI' ? `$${selectedCustomer.balanceUSD.toFixed(2)}` : `¥${(selectedCustomer.balanceRMB || 0).toFixed(2)}`}
                    </span>
                  </div>
                </div>
                {(currentMarket === 'DUBAI' ? amountUSD : amountRMB) > (currentMarket === 'DUBAI' ? selectedCustomer.balanceUSD : (selectedCustomer.balanceRMB || 0)) && (
                  <p className="text-red-600 text-sm mt-2">
                    Warning: Customer has insufficient {currentMarket === 'DUBAI' ? 'USD' : 'RMB'} balance
                  </p>
                )}
              </div>
            )}

            {/* Vendor Info */}
            {selectedVendor && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Vendor Information</h4>
                <div className="text-sm">
                  <p><span className="text-green-700">Name:</span> {selectedVendor.name}</p>
                  <p><span className="text-green-700">Type:</span> {selectedVendor.type}</p>
                  {selectedVendor.contactInfo && (
                    <p><span className="text-green-700">Contact:</span> {selectedVendor.contactInfo}</p>
                  )}
                </div>
              </div>
            )}

            {/* Error Messages (safe render) */}
            {Object.keys(errors).length > 0 && (
              <div style={{ color: 'red', fontSize: 12 }}>
                <b>Form Errors:</b>
                <ul>
                  {Object.entries(errors).map(([field, err]) => (
                    <li key={field}>
                      {field}: {(err as any)?.message || "Invalid value"}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createPaymentOrderMutation.isPending}
                className="flex-1"
              >
                {createPaymentOrderMutation.isPending ? "Creating..." : "Create Payment Order"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
