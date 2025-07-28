"use client"

import type React from "react"

import { useEffect, useState } from "react"

export function FontLoader({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>
  }

  return <>{children}</>
}
