"use client"

import React, { createContext, useContext, useState } from "react"
import { BeadItem } from "../../components/kandi-manual-builder"

// Added 'stitch' to the config
interface DesignConfig {
  rows: number
  stitch: string // e.g., 'ladder', 'peyote'
}

interface KandiContextType {
  pattern: BeadItem[]
  setPattern: (pattern: BeadItem[]) => void
  designConfig: DesignConfig
  setDesignConfig: (config: DesignConfig) => void
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
  // Default to 1 row, ladder stitch (standard grid)
  const [designConfig, setDesignConfig] = useState<DesignConfig>({ 
    rows: 1, 
    stitch: 'ladder' 
  })

  return (
    <KandiContext.Provider value={{ pattern, setPattern, designConfig, setDesignConfig }}>
      {children}
    </KandiContext.Provider>
  )
}