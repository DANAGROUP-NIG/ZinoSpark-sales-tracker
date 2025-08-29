"use client"

import { MobileSidebar } from "./sidebar"

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4 md:px-6">
        <MobileSidebar />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Currency Exchange</h1>
        </div>
      </div>
    </header>
  )
}
