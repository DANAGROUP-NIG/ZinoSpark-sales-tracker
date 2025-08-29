import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "../types"
import { authService, type AuthTokens } from "../auth"

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, tokens: AuthTokens) => void
  logout: () => void
  refreshToken: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, tokens) => {
        // Use the auth service to handle token storage
        authService.setAuth(tokens, user)
        set({ user, token: tokens.accessToken, isAuthenticated: true })
      },
      logout: () => {
        // Use the auth service to clear tokens
        authService.clearAuth()
        set({ user: null, token: null, isAuthenticated: false })
      },
      refreshToken: async () => {
        try {
          const newToken = await authService.refreshAccessToken()
          const user = authService.getUser()
          if (newToken && user) {
            set({ token: newToken, user, isAuthenticated: true })
          }
        } catch (error) {
          // Refresh failed, logout
          authService.clearAuth()
          set({ user: null, token: null, isAuthenticated: false })
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      // Rehydrate from auth service on load
      onRehydrateStorage: () => (state) => {
        if (state) {
          const user = authService.getUser()
          const token = authService.getAccessToken()
          const isAuthenticated = authService.isAuthenticated()
          
          if (user && token && isAuthenticated) {
            state.user = user
            state.token = token
            state.isAuthenticated = isAuthenticated
          } else {
            state.user = null
            state.token = null
            state.isAuthenticated = false
          }
        }
      },
    },
  ),
)
