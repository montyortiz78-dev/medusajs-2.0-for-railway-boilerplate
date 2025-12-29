"use client"

import React, { createContext, useContext, useState } from "react"

interface DesignConfig {
  rows: number
  stitch: string
}

interface KandiContextType {
  pattern: any[]
  setPattern: (pattern: any[]) => void
  designConfig: DesignConfig
  setDesignConfig: (config: DesignConfig) => void
  isCapturing: boolean
  setIsCapturing: (val: boolean) => void
  // NEW: Add Custom Word to Context
  customWord: string
  setCustomWord: (word: string) => void
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
  const [isCapturing, setIsCapturing] = useState(false)
  const [customWord, setCustomWord] = useState("") // <--- Initialize State
  
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
        setIsCapturing,
        customWord,      // <--- Expose value
        setCustomWord    // <--- Expose setter
      }}
    >
      {children}
    </KandiContext.Provider>
  )
}