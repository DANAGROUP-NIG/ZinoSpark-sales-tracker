"use client"

import { useState, useEffect, useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { customersApi, paymentsApi } from "@/lib/api"
import { paymentSchema, type PaymentFormData } from "@/lib/validations/payment"
import { Loader2, Calculator, DollarSign } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import { useMarketStore } from "@/lib/stores/market-store"
import { SearchableSelect } from "@/components/ui/searchable-select"

type CustomerSummary = {
  id: string
  name: string
  balanceUSD: number
  balanceRMB?: number | null
}

export function PaymentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCustomerId = searchParams.get("customerId")
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [calculatedUSD, setCalculatedUSD] = useState<number>(0)
  const { currentMarket } = useMarketStore()

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      customerId: preselectedCustomerId || "",
      amountNaira: 0,
      exchangeRate: 1650, // Default exchange rate
      transactionDate: new Date().toISOString().slice(0, 10),
    },
  })

  // Watch form values for auto-calculation
  const amountNaira = watch("amountNaira")
  const exchangeRate = watch("exchangeRate")

  // Auto-calculate USD amount (Dubai); China flow uses RMB display only
  useEffect(() => {
    if (amountNaira && exchangeRate && currentMarket === 'DUBAI') {
      const usdAmount = amountNaira / exchangeRate
      setCalculatedUSD(usdAmount)
    } else if (currentMarket === 'CHINA') {
      setCalculatedUSD(0)
    } else {
      setCalculatedUSD(0)
    }
  }, [amountNaira, exchangeRate, currentMarket])

  // Load customers for dropdown
  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ["customers-dropdown"],
    queryFn: () => customersApi.getAll({ limit: 100 }),
  })

  const createPaymentMutation = useMutation({
    mutationFn: (data: PaymentFormData) =>
      paymentsApi.create({
        customerId: data.customerId,
        amountNaira: data.amountNaira,
        exchangeRate: data.exchangeRate,
        transactionDate: data.transactionDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] })
      toast({
        title: "Payment Recorded",
        description: currentMarket === 'DUBAI'
          ? `Successfully recorded payment of $${calculatedUSD.toFixed(2)} USD`
          : `Successfully recorded payment in RMB flow`,
      })
      reset()
      router.push("/payments")
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: PaymentFormData) => {
    const isoDate = data.transactionDate ? new Date(data.transactionDate + 'T00:00:00').toISOString() : undefined
    const { customerId, amountNaira, exchangeRate } = data
    createPaymentMutation.mutate({ customerId, amountNaira, exchangeRate, transactionDate: isoDate })
  }

  const customers = useMemo(() => (customersData?.customers ?? []) as CustomerSummary[], [customersData])
  const selectedCustomer = customers.find((customer) => customer.id === watch("customerId"))
  const customerOptions = useMemo(
    () =>
      customers.map((customer) => ({
        value: customer.id,
        label: customer.name,
        description:
          currentMarket === "DUBAI"
            ? `USD balance: $${customer.balanceUSD.toFixed(2)}`
            : `RMB balance: ¥${(customer.balanceRMB || 0).toFixed(2)}`,
        meta: customer,
      })),
    [customers, currentMarket],
  )

  const calculatedRMB = currentMarket === 'CHINA' && amountNaira && exchangeRate
    ? amountNaira / exchangeRate
    : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Record New Payment
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
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={customerOptions}
                    placeholder="Select a customer"
                    searchPlaceholder="Search customers..."
                    emptyMessage="No customers found"
                    loading={loadingCustomers}
                    triggerClassName={errors.customerId ? "border-destructive" : undefined}
                    renderOption={(option) => {
                      const customer = option.meta as CustomerSummary | undefined
                      return (
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium">{option.label}</span>
                          {customer && (
                            <span className="text-sm text-muted-foreground">
                              {currentMarket === "DUBAI"
                                ? `USD: $${customer.balanceUSD.toFixed(2)}`
                                : `RMB: ¥${(customer.balanceRMB || 0).toFixed(2)}`}
                            </span>
                          )}
                        </div>
                      )
                    }}
                  />
                )}
              />
              {errors.customerId && <p className="text-sm text-destructive">{errors.customerId.message}</p>}
              {selectedCustomer && (
                <p className="text-sm text-muted-foreground">
                  Current balance: {currentMarket === 'DUBAI' ? `USD $${selectedCustomer.balanceUSD.toFixed(2)}` : `RMB ¥${(selectedCustomer.balanceRMB || 0).toFixed(2)}`}
                </p>
              )}
            </div>

            {/* Amount in Naira */}
            <div className="space-y-2">
              <Label htmlFor="amountNaira">Amount (Naira) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₦</span>
                <Input
                  id="amountNaira"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className={`pl-8 ${errors.amountNaira ? "border-destructive" : ""}`}
                  {...register("amountNaira", { valueAsNumber: true })}
                />
              </div>
              {errors.amountNaira && <p className="text-sm text-destructive">{errors.amountNaira.message}</p>}
            </div>

            {/* Exchange Rate */}
            <div className="space-y-2">
              <Label htmlFor="exchangeRate">
                {currentMarket === 'DUBAI' ? 'Exchange Rate (NGN/USD) *' : 'Exchange Rate (NGN/RMB) *'}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₦</span>
                <Input
                  id="exchangeRate"
                  type="number"
                  step="0.01"
                  placeholder="1650.00"
                  className={`pl-8 ${errors.exchangeRate ? "border-destructive" : ""}`}
                  {...register("exchangeRate", { valueAsNumber: true })}
                />
              </div>
              {errors.exchangeRate && <p className="text-sm text-destructive">{errors.exchangeRate.message}</p>}
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

            {/* Calculated Amount Summary */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {currentMarket === 'DUBAI' ? 'USD Equivalent' : 'RMB Equivalent'}
                    </span>
                  </div>
                  <div className="text-right">
                    {currentMarket === 'DUBAI' ? (
                      <>
                        <div className="text-2xl font-bold text-primary">
                          ${calculatedUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </div>
                        {amountNaira && exchangeRate && (
                          <div className="text-sm text-muted-foreground">
                            ₦{amountNaira.toLocaleString()} ÷ {exchangeRate} = ${calculatedUSD.toFixed(2)}
                          </div>
                        )}
                      </>
                    ) : (
                      amountNaira && exchangeRate ? (
                        <>
                          <div className="text-2xl font-bold text-primary">
                            ¥{(amountNaira / exchangeRate).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ₦{amountNaira.toLocaleString()} ÷ {exchangeRate} = ¥{(amountNaira / exchangeRate).toFixed(2)}
                          </div>
                        </>
                      ) : (
                        <div className="text-2xl font-bold text-primary">¥0.00</div>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                disabled={
                  createPaymentMutation.isPending ||
                  (currentMarket === "DUBAI" && calculatedUSD === 0) ||
                  (currentMarket === "CHINA" && calculatedRMB === 0)
                }
              >
                {createPaymentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Payment
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* New Balance Preview (Dubai only) */}
      {selectedCustomer && calculatedUSD > 0 && currentMarket === 'DUBAI' && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">New Customer Balance</span>
              <span className="text-lg font-bold text-primary">
                ${(selectedCustomer.balanceUSD + calculatedUSD).toFixed(2)} USD
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Current: ${selectedCustomer.balanceUSD.toFixed(2)} + Payment: ${calculatedUSD.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
