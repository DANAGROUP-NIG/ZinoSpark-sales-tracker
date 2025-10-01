import { create } from "zustand"

interface UsdVisibilityState {
  showUsd: boolean
  toggleUsd: () => void
  setUsd: (show: boolean) => void
}

export const useUsdVisibilityStore = create<UsdVisibilityState>((set) => ({
  showUsd: true,
  toggleUsd: () => set((state) => ({ showUsd: !state.showUsd })),
  setUsd: (show) => set({ showUsd: show }),
}))
