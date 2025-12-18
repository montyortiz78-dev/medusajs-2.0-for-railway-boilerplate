"use client"

import React, { createContext, useContext, useState } from "react"
import { create } from "zustand"

interface DesignConfig {
  rows: number
  stitch: string
}

interface KandiContextType {
  pattern: any[]
  setPattern: (pattern: any[]) => void
  designConfig: DesignConfig
  setDesignConfig: (config: DesignConfig) => void
  // NEW: Global Capture State
  isCapturing: boolean
  setIsCapturing: (val: boolean) => void
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
  const [pattern, setPattern] = useState<any[]>([])
  const [isCapturing, setIsCapturing] = useState(false) // <--- NEW STATE
  
  const [designConfig, setDesignConfig] = useState<DesignConfig>({
    rows: 1,
    stitch: "ladder"
  })

  return (
    <KandiContext.Provider 
      value={{ 
        pattern, 
        setPattern, 
        designConfig, 
        setDesignConfig,
        isCapturing, 
        setIsCapturing
      }}
    >
      {children}
    </KandiContext.Provider>
  )
}