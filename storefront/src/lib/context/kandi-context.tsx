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
  customWord: string
  setCustomWord: (word: string) => void
  // NEW: Add clear function
  clearDesign: () => void
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
  const [customWord, setCustomWord] = useState("") 
  
  const initialConfig = {
    rows: 1,
    stitch: "ladder"
  }

  const [designConfig, setDesignConfig] = useState<DesignConfig>(initialConfig)

  // --- NEW: Reset all state ---
  const clearDesign = () => {
    setPattern([])
    setCustomWord("")
    setDesignConfig(initialConfig)
  }
  // ---------------------------

  return (
    <KandiContext.Provider 
      value={{ 
        pattern, 
        setPattern, 
        designConfig, 
        setDesignConfig,
        isCapturing, 
        setIsCapturing,
        customWord,      
        setCustomWord,
        clearDesign // <--- Expose function
      }}
    >
      {children}
    </KandiContext.Provider>
  )
}