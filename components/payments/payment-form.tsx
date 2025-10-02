"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { customersApi, paymentsApi } from "@/lib/api"
import { paymentSchema, type PaymentFormData } from "@/lib/validations/payment"
import { Loader2, Calculator, DollarSign } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"

export function PaymentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCustomerId = searchParams.get("customerId")
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [calculatedUSD, setCalculatedUSD] = useState<number>(0)

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

  // Auto-calculate USD amount
  useEffect(() => {
    if (amountNaira && exchangeRate) {
      const usdAmount = amountNaira / exchangeRate
      setCalculatedUSD(usdAmount)
    } else {
      setCalculatedUSD(0)
    }
  }, [amountNaira, exchangeRate])

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
        description: `Successfully recorded payment of $${calculatedUSD.toFixed(2)} USD`,
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

  const selectedCustomer = customersData?.customers?.find((c) => c.id === watch("customerId"))

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
                  Current balance: ${selectedCustomer.balanceUSD.toFixed(2)} USD
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
              <Label htmlFor="exchangeRate">Exchange Rate (NGN/USD) *</Label>
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

            {/* Calculated USD Amount */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">USD Equivalent</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      ${calculatedUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                    {amountNaira && exchangeRate && (
                      <div className="text-sm text-muted-foreground">
                        ₦{amountNaira.toLocaleString()} ÷ {exchangeRate} = ${calculatedUSD.toFixed(2)}
                      </div>
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
                disabled={createPaymentMutation.isPending || calculatedUSD === 0}
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

      {/* New Balance Preview */}
      {selectedCustomer && calculatedUSD > 0 && (
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
