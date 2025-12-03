'use client';

import { useState, useRef } from 'react';
import { Button, clx } from "@medusajs/ui";
import { Trash } from "@medusajs/icons";

// Standard Kandi Colors
const PALETTE = [
  { name: 'Pink', hex: '#FF00CC' },
  { name: 'Green', hex: '#39FF14' },
  { name: 'Blue', hex: '#00FFFF' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Orange', hex: '#FF5F1F' },
  { name: 'Purple', hex: '#B026FF' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#000000' },
];

type Props = {
  pattern: string[];
  setPattern: (pattern: string[]) => void;
};

export default function KandiManualBuilder({ pattern, setPattern }: Props) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addBead = (color: string) => {
    if (pattern.length >= 35) return;
    // Ensure pattern is always an array
    const currentPattern = Array.isArray(pattern) ? pattern : [];
    setPattern([...currentPattern, color]);
  };

  const removeBead = (index: number) => {
    setPattern(pattern.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    if (confirm('Clear your design?')) {
      setPattern([]);
    }
  };

  // --- Drag and Drop Logic ---
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newPattern = [...pattern];
    const movedItem = newPattern[draggedIndex];
    
    // Remove from old position
    newPattern.splice(draggedIndex, 1);
    // Insert at new position
    newPattern.splice(index, 0, movedItem);

    setPattern(newPattern);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* 1. The String (Work Area) */}
      <div className="bg-ui-bg-subtle border border-ui-border-base rounded-xl p-4 min-h-[100px] relative">
        <div className="absolute top-2 right-3 text-xs text-ui-fg-subtle font-mono">
          {pattern.length} / 35
        </div>
        
        {pattern.length === 0 ? (
          <div className="h-full flex items-center justify-center text-ui-fg-muted text-sm italic py-4">
            Tap colors below to start stringing your Kandi
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 items-center justify-center">
            {pattern.map((color, index) => (
              <div
                key={`${index}-${color}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => removeBead(index)}
                className={clx(
                  "w-8 h-8 rounded-full shadow-md cursor-grab active:cursor-grabbing hover:scale-110 transition-transform border border-black/10",
                  { "opacity-50": draggedIndex === index }
                )}
                style={{ backgroundColor: color }}
                title="Drag to reorder, Click to remove"
              />
            ))}
          </div>
        )}
      </div>

      {/* 2. Controls */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-ui-fg-subtle font-medium">Palette</span>
        <button 
          onClick={clearAll} 
          className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1"
          disabled={pattern.length === 0}
        >
          <Trash className="w-3 h-3" /> Clear
        </button>
      </div>

      {/* 3. Palette */}
      <div className="grid grid-cols-5 sm:grid-cols-9 gap-3">
        {PALETTE.map((p) => (
          <button
            key={p.hex}
            onClick={() => addBead(p.hex)}
            className="group flex flex-col items-center gap-1"
            aria-label={`Add ${p.name} bead`}
          >
            <div 
              className="w-10 h-10 rounded-full border border-ui-border-base shadow-sm group-hover:scale-110 transition-all ring-2 ring-transparent group-hover:ring-ui-fg-interactive"
              style={{ backgroundColor: p.hex }}
            />
            <span className="text-[10px] text-ui-fg-muted uppercase tracking-wider hidden sm:block">
              {p.name}
            </span>
          </button>
        ))}
      </div>

    </div>
  );
}