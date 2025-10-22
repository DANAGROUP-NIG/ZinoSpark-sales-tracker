export interface User {
  id: string
  email: string
  name: string
  role: "CLIENT" | "PARTNER"
}

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  balanceUSD: number
  createdAt: string
  updatedAt: string
}

export interface Vendor {
  id: string
  name: string
  type: "EXCHANGE" | "PAYMENT"
  contactInfo?: string
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  customerId: string
  amountNaira: number
  exchangeRate: number
  amountUSD: number
  createdAt: string
  updatedAt: string
  customer: Customer
}

export interface CurrencyExchange {
  id: string
  vendorId: string
  amountNaira: number
  exchangeRate: number
  amountUSD: number
  amountRMB?: number
  status: "PENDING" | "RECEIVED" | "CANCELLED"
  createdAt: string
  updatedAt: string
  vendor: Vendor
  unclaimedUSD?: number
  unclaimedRMB?: number
}

export interface VendorPayment {
  id: string
  customerId: string
  vendorId: string
  amountUSD: number
  amountRMB?: number
  balanceBeforeUSD?: number
  balanceAfterUSD?: number
  balanceBeforeRMB?: number
  balanceAfterRMB?: number
  description?: string
  createdAt: string
  updatedAt: string
  customer: Customer
  vendor: Vendor
}

export interface Wallet {
  id: string
  totalUSD: number
  updatedAt: string
}

export interface DashboardMetrics {
  totalWalletBalance: number
  activeCustomersCount: number
  pendingExchangesCount: number
  recentTransactionsCount: number
}
