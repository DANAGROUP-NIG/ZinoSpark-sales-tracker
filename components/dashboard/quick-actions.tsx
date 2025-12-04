"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Plus, Users, CreditCard, ArrowLeftRight } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  const { user } = useAuthStore()

  const actions = [
    {
      title: "Add Payment",
      description: "Record new customer payment",
      icon: CreditCard,
      href: "/payments/new",
      roles: ["CLIENT"],
    },
    {
      title: "New Customer",
      description: "Add new customer",
      icon: Users,
      href: "/customers",
      roles: ["CLIENT"],
    },
    {
      title: "Exchange Currency",
      description: "Initiate currency exchange",
      icon: ArrowLeftRight,
      href: "/exchanges/new",
      roles: ["CLIENT"],
    },
  ]

  const filteredActions = actions.filter((action) => action.roles.includes(user?.role || "CLIENT"))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredActions.map((action) => {
            const Icon = action.icon
            return (
              <Button 
                key={action.title} 
                variant="outline" 
                className="h-auto p-4 justify-start bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-800 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 cursor-pointer" 
                asChild
              >
                <Link href={action.href}>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                      <Icon className="h-5 w-5 text-blue-800" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">{action.title}</div>
                      <div className="text-sm text-gray-600">{action.description}</div>
                    </div>
                  </div>
                </Link>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
