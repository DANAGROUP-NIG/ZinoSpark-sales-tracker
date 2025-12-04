"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { customersApi } from "@/lib/api"
import { CustomerModal } from "./customer-modal"
import { useUsdVisibilityStore } from "@/lib/stores/usd-visibility-store"
import { Search, MoreHorizontal, Edit, Trash2, Eye, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { useMarketStore } from "@/lib/stores/market-store"
import Link from "next/link"
import type { Customer } from "@/lib/types"

export function CustomersTable() {
  const { showUsd } = useUsdVisibilityStore()
  const { currentMarket } = useMarketStore()
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>()
  const [modalOpen, setModalOpen] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)

    return () => clearTimeout(handler)
  }, [search])

  const { data, isLoading } = useQuery({
    queryKey: ["customers", { page, limit, search: debouncedSearch }],
    queryFn: () => customersApi.getAll({ page, limit, search: debouncedSearch || undefined }),
    keepPreviousData: true,
  })

  const deleteMutation = useMutation({
    mutationFn: customersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      toast({
        title: "Success",
        description: "Customer deleted successfully.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer.",
        variant: "destructive",
      })
    },
  })

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer)
    setModalOpen(true)
  }

  const handleAdd = () => {
    setSelectedCustomer(undefined)
    setModalOpen(true)
  }

  const handleDelete = (customer: Customer) => {
    if (confirm(`Are you sure you want to delete ${customer.name}?`)) {
      deleteMutation.mutate(customer.id)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
  }

  const customers = data?.customers || []

  const totalPages = data?.totalPages || 1
  const totalCustomers = data?.total || 0

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10"
          />
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(limit)].map((_, i) => (
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
                  <TableCell>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {search ? "No customers match your search" : "No customers found"}
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.email || "-"}</TableCell>
                  <TableCell>{customer.phone || "-"}</TableCell>
                  <TableCell>
                    {currentMarket === 'DUBAI' ? (
                      <Badge variant={customer.balanceUSD > 0 ? "default" : "secondary"}>
                        {showUsd ? `$${customer.balanceUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : <span className="tracking-widest">*****</span>}
                      </Badge>
                    ) : (
                      <Badge variant={(customer.balanceRMB || 0) > 0 ? "default" : "secondary"}>
                        ¥{(customer.balanceRMB || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(customer.updatedAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/customers/detail?id=${customer.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(customer)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(customer)} className="text-destructive">
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
          [...Array(limit)].map((_, i) => (
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
        ) : customers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {search ? "No customers match your search" : "No customers found"}
            </CardContent>
          </Card>
        ) : (
          customers.map((customer) => (
            <Card key={customer.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium">{customer.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {customer.email || customer.phone || "No contact info"}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/customers/detail?id=${customer.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(customer)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(customer)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    {currentMarket === 'DUBAI' ? (
                      <Badge variant={customer.balanceUSD > 0 ? "default" : "secondary"} className="text-xs">
                        {showUsd ? `$${customer.balanceUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : <span className="tracking-widest">*****</span>}
                      </Badge>
                    ) : (
                      <Badge variant={(customer.balanceRMB || 0) > 0 ? "default" : "secondary"} className="text-xs">
                        ¥{(customer.balanceRMB || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">Updated {formatDate(customer.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalCustomers)} of {totalCustomers} customers
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={page === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <CustomerModal open={modalOpen} onOpenChange={setModalOpen} customer={selectedCustomer} />
    </div>
  )
}
