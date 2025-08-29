"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { vendorsApi } from "@/lib/api"
import { VendorModal } from "./vendor-modal"
import { Search, MoreHorizontal, Edit, Trash2, Plus, Filter, Building2, ArrowLeftRight } from "lucide-react"
import type { Vendor } from "@/lib/types"

// Mock vendors data
const mockVendors = [
  {
    id: "1",
    name: "Exchange Vendor A",
    type: "EXCHANGE" as const,
    contactInfo: "contact@vendora.com\n+1234567890\n123 Exchange St, Lagos",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-20T14:45:00Z",
  },
  {
    id: "2",
    name: "Payment Vendor B",
    type: "PAYMENT" as const,
    contactInfo: "support@vendorb.com\n+1987654321",
    createdAt: "2024-01-10T09:15:00Z",
    updatedAt: "2024-01-18T16:20:00Z",
  },
  {
    id: "3",
    name: "Exchange Vendor C",
    type: "EXCHANGE" as const,
    contactInfo: "info@vendorc.com",
    createdAt: "2024-01-05T11:00:00Z",
    updatedAt: "2024-01-22T13:30:00Z",
  },
  {
    id: "4",
    name: "Payment Vendor D",
    type: "PAYMENT" as const,
    contactInfo: "",
    createdAt: "2024-01-12T08:45:00Z",
    updatedAt: "2024-01-19T10:15:00Z",
  },
]

export function VendorsTable() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | undefined>()
  const [modalOpen, setModalOpen] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["vendors", { page, search, type: typeFilter }],
    // Use mock data for development
    queryFn: () =>
      Promise.resolve({
        vendors: mockVendors.filter(
          (v) =>
            (typeFilter === "all" || v.type === typeFilter) &&
            (search === "" || v.name.toLowerCase().includes(search.toLowerCase())),
        ),
        total: mockVendors.length,
        page,
        totalPages: 1,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: vendorsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] })
      toast({
        title: "Success",
        description: "Vendor deleted successfully.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete vendor.",
        variant: "destructive",
      })
    },
  })

  const handleEdit = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setModalOpen(true)
  }

  const handleAdd = () => {
    setSelectedVendor(undefined)
    setModalOpen(true)
  }

  const handleDelete = (vendor: Vendor) => {
    if (confirm(`Are you sure you want to delete ${vendor.name}?`)) {
      deleteMutation.mutate(vendor.id)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getTypeIcon = (type: string) => {
    return type === "EXCHANGE" ? <ArrowLeftRight className="h-4 w-4" /> : <Building2 className="h-4 w-4" />
  }

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant={type === "EXCHANGE" ? "default" : "secondary"} className="flex items-center gap-1">
        {getTypeIcon(type)}
        {type === "EXCHANGE" ? "Exchange" : "Payment"}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="EXCHANGE">Exchange vendors</SelectItem>
              <SelectItem value="PAYMENT">Payment vendors</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : data?.vendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No vendors found
                </TableCell>
              </TableRow>
            ) : (
              data?.vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>{getTypeBadge(vendor.type)}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {vendor.contactInfo ? (
                        <div className="text-sm text-muted-foreground whitespace-pre-line line-clamp-2">
                          {vendor.contactInfo}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No contact info</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(vendor.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(vendor)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(vendor)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : data?.vendors.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">No vendors found</CardContent>
          </Card>
        ) : (
          data?.vendors.map((vendor) => (
            <Card key={vendor.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium">{vendor.name}</h3>
                    <div className="mt-1">{getTypeBadge(vendor.type)}</div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(vendor)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(vendor)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {vendor.contactInfo && (
                  <div className="text-sm text-muted-foreground whitespace-pre-line mb-2 line-clamp-3">
                    {vendor.contactInfo}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">Created {formatDate(vendor.createdAt)}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <VendorModal open={modalOpen} onOpenChange={setModalOpen} vendor={selectedVendor} />
    </div>
  )
}
