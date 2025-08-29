"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { authApi } from "@/lib/api"
import { useAuthStore } from "@/lib/stores/auth-store"
import { loginSchema, type LoginFormData } from "@/lib/validations/auth"
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react"
import { useState } from "react"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: LoginFormData) => authApi.login(email, password),
    onSuccess: (data) => {
      if (data.data?.user && data.data?.access_token && data.data?.refresh_token) {
        login(data.data.user, {
          accessToken: data.data.access_token,
          refreshToken: data.data.refresh_token,
        })
        toast({
          title: "Welcome back!",
          description: "You have been successfully logged in.",
        })
        router.push("/dashboard")
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-2 sm:p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4 pt-6">
            {/* Logo */}
            <div className="flex justify-center mb-2">
              <img 
                src="https://res.cloudinary.com/dny7tqd0d/image/upload/v1755503447/business-logos/kzlzjquorjuzmklredpu.png" 
                alt="Zino Spark Logo" 
                className="w-28 h-28 object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600">Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent className="px-6 sm:px-8 pb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="superadmin@example.com"
                    {...register("email")}
                    className={`pl-10 h-12 bg-gray-50/50 border-gray-200 focus:border-primary focus:ring-primary rounded-xl transition-all duration-200 ${
                      errors.email ? "border-destructive focus:border-destructive" : ""
                    }`}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    className={`pl-10 pr-10 h-12 bg-gray-50/50 border-gray-200 focus:border-primary focus:ring-primary rounded-xl transition-all duration-200 ${
                      errors.password ? "border-destructive focus:border-destructive" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>

              {/* Forgot Password Link */}
              {/* <div className="text-right">
                <button type="button" className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                  Forgot password?
                </button>
              </div> */}

              {/* Sign In Button */}
              <Button 
                type="submit" 
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-base"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          © {new Date().getFullYear()} Zino Spark. All rights reserved.
        </div>
      </div>
    </div>
  )
}
