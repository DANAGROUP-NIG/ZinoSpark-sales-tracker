"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { vendorsApi } from "@/lib/api"
import { vendorSchema, type VendorFormData } from "@/lib/validations/vendor"
import { Loader2 } from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"
import type { Vendor } from "@/lib/types"

interface VendorFormProps {
  vendor?: Vendor
  onSuccess?: () => void
}

export function VendorForm({ vendor, onSuccess }: VendorFormProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: vendor?.name || "",
      type: vendor?.type ?? (user?.role === "PARTNER" ? "PAYMENT" : "EXCHANGE"),
      contactInfo: vendor?.contactInfo || "",
    },
  })

  const createMutation = useMutation({
    mutationFn: vendorsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] })
      toast({
        title: "Success",
        description: "Vendor created successfully.",
      })
      reset()
      onSuccess?.()
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create vendor.",
        variant: "destructive",
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: VendorFormData) => vendorsApi.update(vendor!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] })
      toast({
        title: "Success",
        description: "Vendor updated successfully.",
      })
      onSuccess?.()
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update vendor.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: VendorFormData) => {
    if (vendor) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Vendor Name *</Label>
        <Input
          id="name"
          placeholder="Enter vendor name"
          {...register("name")}
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Vendor Type *</Label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className={errors.type ? "border-destructive" : ""}>
                <SelectValue placeholder="Select vendor type" />
              </SelectTrigger>
              <SelectContent>
                {user?.role !== "PARTNER" && (
                  <SelectItem value="EXCHANGE">
                    <div>
                      <div className="font-medium">Exchange</div>
                      <div className="text-sm text-muted-foreground">For currency conversion</div>
                    </div>
                  </SelectItem>
                )}
                <SelectItem value="PAYMENT">
                  <div>
                    <div className="font-medium">Payment</div>
                    <div className="text-sm text-muted-foreground">For customer payments</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactInfo">Contact Information</Label>
        <Textarea
          id="contactInfo"
          placeholder="Enter contact details (email, phone, address, etc.)"
          rows={3}
          {...register("contactInfo")}
          className={errors.contactInfo ? "border-destructive" : ""}
        />
        {errors.contactInfo && <p className="text-sm text-destructive">{errors.contactInfo.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {vendor ? "Update Vendor" : "Create Vendor"}
      </Button>
    </form>
  )
}
