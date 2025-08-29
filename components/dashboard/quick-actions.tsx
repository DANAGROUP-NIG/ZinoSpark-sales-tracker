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
      href: "/customers/new",
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
              <Button key={action.title} variant="outline" className="h-auto p-4 justify-start bg-transparent" asChild>
                <Link href={action.href}>
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 mt-0.5 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-sm text-muted-foreground">{action.description}</div>
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
