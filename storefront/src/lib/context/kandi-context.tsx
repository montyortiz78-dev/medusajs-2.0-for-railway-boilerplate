"use client"

import React, { createContext, useContext, useState } from "react"
import { BeadItem } from "../../components/kandi-manual-builder"

interface KandiContextType {
  pattern: BeadItem[]
  setPattern: (pattern: BeadItem[]) => void
}

const KandiContext = createContext<KandiContextType | null>(null)

export const useKandiContext = () => {
  const context = useContext(KandiContext)
  if (!context) {
    throw new Error("useKandiContext must be used within a KandiProvider")
  }
  return context
}

export const KandiProvider = ({ children }: { children: React.ReactNode }) => {
  const [pattern, setPattern] = useState<BeadItem[]>([])

  return (
    <KandiContext.Provider value={{ pattern, setPattern }}>
      {children}
    </KandiContext.Provider>
  )
}