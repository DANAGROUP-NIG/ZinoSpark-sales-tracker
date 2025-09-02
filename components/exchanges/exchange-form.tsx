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
import { vendorsApi, exchangesApi } from "@/lib/api"
import { exchangeSchema, type ExchangeFormData } from "@/lib/validations/exchange"
import { Loader2, Calculator, ArrowLeftRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"

export function ExchangeForm() {
  const router = useRouter()
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
  } = useForm<ExchangeFormData>({
    resolver: zodResolver(exchangeSchema),
    defaultValues: {
      vendorId: "",
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

  // Load exchange vendors
  const { data: vendorsData, isLoading: loadingVendors } = useQuery({
    queryKey: ["vendors-exchange"],
    queryFn: () => vendorsApi.getAll({ type: "EXCHANGE", limit: 100 }),
  })

  const createExchangeMutation = useMutation({
    mutationFn: (data: ExchangeFormData) =>
      exchangesApi.create({
        vendorId: data.vendorId,
        amountNaira: data.amountNaira,
        exchangeRate: data.exchangeRate,
        transactionDate: data.transactionDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchanges"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] })
      toast({
        title: "Exchange Initiated",
        description: `Successfully initiated exchange for $${calculatedUSD.toFixed(2)} USD`,
      })
      reset()
      router.push("/exchanges")
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate exchange.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: ExchangeFormData) => {
    const isoDate = data.transactionDate ? new Date(data.transactionDate + 'T00:00:00').toISOString() : undefined
    const { vendorId, amountNaira, exchangeRate } = data
    createExchangeMutation.mutate({ vendorId, amountNaira, exchangeRate, transactionDate: isoDate })
  }

  const selectedVendor = vendorsData?.vendors?.find((v) => v.id === watch("vendorId"))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Initiate Currency Exchange
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Vendor Selection */}
            <div className="space-y-2">
              <Label htmlFor="vendorId">Exchange Vendor *</Label>
              <Controller
                name="vendorId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.vendorId ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select an exchange vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingVendors ? (
                        <div className="p-2 text-sm text-muted-foreground">Loading vendors...</div>
                      ) : vendorsData?.vendors?.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No exchange vendors available</div>
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
            <div className="space-y-2">
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
            </div>

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
                disabled={createExchangeMutation.isPending || calculatedUSD === 0}
              >
                {createExchangeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Initiate Exchange
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Exchange Summary */}
      {selectedVendor && calculatedUSD > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Exchange Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendor:</span>
                <span>{selectedVendor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount (NGN):</span>
                <span>₦{amountNaira?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate:</span>
                <span>₦{exchangeRate}/USD</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Expected USD:</span>
                <span className="text-primary">${calculatedUSD.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Status will be PENDING until confirmed by partner</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
