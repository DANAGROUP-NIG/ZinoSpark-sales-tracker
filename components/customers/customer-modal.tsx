"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CustomerForm } from "./customer-form"
import type { Customer } from "@/lib/types"

interface CustomerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer
}

export function CustomerModal({ open, onOpenChange, customer }: CustomerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
        </DialogHeader>
        <CustomerForm customer={customer} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
