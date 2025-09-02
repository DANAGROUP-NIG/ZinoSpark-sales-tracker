"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { VendorForm } from "./vendor-form"
import type { Vendor } from "@/lib/types"

interface VendorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendor?: Vendor
}

export function VendorModal({ open, onOpenChange, vendor }: VendorModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{vendor ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
          <DialogDescription>
            {vendor ? "Update the vendor details below." : "Fill in the details to create a new vendor."}
          </DialogDescription>
        </DialogHeader>
        <VendorForm vendor={vendor} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
