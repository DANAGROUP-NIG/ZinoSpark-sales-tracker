"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useQuery } from "@tanstack/react-query"
import { Activity, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react"

// Mock data for recent activity
const mockActivity = [
  {
    id: "1",
    type: "payment",
    description: "Payment received from John Doe",
    amount: "$1,250.00",
    status: "completed",
    timestamp: "2 minutes ago",
  },
  {
    id: "2",
    type: "exchange",
    description: "Currency exchange with Vendor A",
    amount: "₦850,000",
    status: "pending",
    timestamp: "15 minutes ago",
  },
  {
    id: "3",
    type: "vendor_payment",
    description: "Payment to Vendor B for Jane Smith",
    amount: "$500.00",
    status: "completed",
    timestamp: "1 hour ago",
  },
  {
    id: "4",
    type: "payment",
    description: "Payment received from Alice Johnson",
    amount: "$750.00",
    status: "completed",
    timestamp: "2 hours ago",
  },
  {
    id: "5",
    type: "exchange",
    description: "Currency exchange with Vendor C",
    amount: "₦1,200,000",
    status: "received",
    timestamp: "3 hours ago",
  },
]

function getActivityIcon(type: string) {
  switch (type) {
    case "payment":
      return <ArrowDownLeft className="h-4 w-4 text-green-600" />
    case "exchange":
      return <RefreshCw className="h-4 w-4 text-blue-600" />
    case "vendor_payment":
      return <ArrowUpRight className="h-4 w-4 text-orange-600" />
    default:
      return <Activity className="h-4 w-4" />
  }
}

function getStatusBadge(status: string) {
  const variants = {
    completed: { variant: "default" as const, color: "text-green-600", bg: "bg-green-100 hover:bg-green-200" },
    pending: { variant: "default" as const, color: "text-amber-700", bg: "bg-amber-100 hover:bg-amber-200" },
    received: { variant: "default" as const, color: "text-green-600", bg: "bg-green-100 hover:bg-green-200" },
    cancelled: { variant: "destructive" as const, color: "text-red-600", bg: "" },
  }

  const config = variants[status as keyof typeof variants] || { variant: "secondary" as const, color: "", bg: "" }
  
  return (
    <Badge variant={config.variant} className={config.bg}>
      {status}
    </Badge>
  )
}

export function RecentActivity() {
  // In a real app, this would fetch from the API
  const { data: activities = mockActivity, isLoading } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: () => Promise.resolve(mockActivity),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                    {getStatusBadge(activity.status)}
                  </div>
                </div>
                <div className="text-sm font-medium">{activity.amount}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
