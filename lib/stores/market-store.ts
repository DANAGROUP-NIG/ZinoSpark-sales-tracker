import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Market = "DUBAI" | "CHINA"

interface MarketState {
	currentMarket: Market
	setMarket: (market: Market) => void
}

export const useMarketStore = create<MarketState>()(
	persist(
		(set) => ({
			currentMarket: "DUBAI",
			setMarket: (market) => set({ currentMarket: market }),
		}),
		{
			name: "market-storage",
			partialize: (state) => ({ currentMarket: state.currentMarket }),
		},
	),
)

// Helper to read current market outside React (e.g., in API layer)
export function getCurrentMarket(): Market {
	try {
		return useMarketStore.getState().currentMarket
	} catch {
		return "DUBAI"
	}
}


