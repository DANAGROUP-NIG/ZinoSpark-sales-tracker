"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter } from "lucide-react"

export function WalletTransactions() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [page] = useState(1)
  const [limit] = useState(10)

  const { data } = useQuery({
    queryKey: ["wallet-history", { page, limit }],
    queryFn: () => api.getWalletHistory({ page, limit }),
  })

  const transactions = data?.transactions ?? []

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || transaction.type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Transactions</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="CREDIT">Credit</SelectItem>
              <SelectItem value="DEBIT">Debit</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {transaction.type === 'DEBIT' ? (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">
                          {transaction.type}
                        </Badge>
                      ) : transaction.type === 'CREDIT' ? (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">
                          {transaction.type}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{transaction.type}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className={`font-medium ${transaction.type === 'DEBIT' ? 'text-red-600' : 'text-green-600'}`}>${transaction.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={transaction.status === "COMPLETED" ? "secondary" : "secondary"}
                        className={transaction.status === "COMPLETED" ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200" : ""}
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {filteredTransactions.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No transactions found</p>
          ) : (
            filteredTransactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
                    </div>
                    <p className={`font-medium ${transaction.type === 'DEBIT' ? 'text-red-600' : 'text-green-600'}`}>{transaction.type === 'DEBIT' ? '-' : '+'}${transaction.amount.toLocaleString()}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <Badge
                      variant="secondary"
                      className={
                        transaction.type === 'DEBIT'
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200'
                          : transaction.type === 'CREDIT'
                          ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200'
                          : ''
                      }
                    >
                      {transaction.type}
                    </Badge>
                    <Badge 
                      variant={transaction.status === "COMPLETED" ? "secondary" : "secondary"}
                      className={transaction.status === "COMPLETED" ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200" : ""}
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
