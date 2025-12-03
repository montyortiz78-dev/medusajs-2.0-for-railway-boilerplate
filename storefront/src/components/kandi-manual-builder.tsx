'use client';

import { useState } from 'react';
import { Trash } from "@medusajs/icons";
import { clx } from "@medusajs/ui";
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor, // Added TouchSensor for better mobile handling
  MouseSensor, // Added MouseSensor
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragEndEvent,
  useDraggable
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { snapCenterToCursor } from '@dnd-kit/modifiers'; // IMPORT THIS

// --- TYPES & CONSTANTS ---
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

export type BeadItem = {
  id: string;
  color: string;
};

type Props = {
  pattern: BeadItem[];
  setPattern: (pattern: BeadItem[]) => void;
};

// --- DRAGGABLE COMPONENTS ---

function PaletteItem({ color, name }: { color: string, name: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${color}`,
    data: { type: 'palette', color }
  });

  return (
    <div className="flex flex-col items-center gap-1">
        {/* Wrap button to isolate drag handle if needed, but direct is fine */}
        <button
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={clx(
            "group relative w-10 h-10 rounded-full border border-ui-border-base shadow-sm transition-all ring-2 ring-transparent hover:ring-ui-fg-interactive touch-none", // touch-none is critical
            isDragging ? "opacity-30" : "hover:scale-110"
        )}
        style={{ backgroundColor: color }}
        aria-label={`Add ${name}`}
        >
        </button>
        <span className="text-[10px] text-ui-fg-muted uppercase tracking-wider hidden sm:block select-none">
            {name}
        </span>
    </div>
  );
}

function SortableBead({ id, color, onRemove }: { id: string, color: string, onRemove: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clx(
        "relative group w-8 h-8 rounded-full shadow-md cursor-grab active:cursor-grabbing border border-black/10 touch-none transition-transform", // Added transition-transform
        isDragging ? "z-0 opacity-30 scale-75" : "hover:scale-105 z-10"
      )}
    >
        <div className="w-full h-full rounded-full" style={{ backgroundColor: color }} />
        
        {/* Remove Button on Hover */}
        <button 
            onClick={(e) => { 
                e.stopPropagation(); // Prevent drag start
                onRemove(); 
            }}
            onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on touch
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 z-20"
            title="Remove"
        >
            ×
        </button>
    </div>
  );
}

// --- MAIN COMPONENT ---

export default function KandiManualBuilder({ pattern, setPattern }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { 
        // Delay allows scrolling on mobile, holding starts drag
        activationConstraint: { delay: 150, tolerance: 5 } 
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addBead = (color: string) => {
    if (pattern.length >= 35) return;
    const newBead = { id: Math.random().toString(36).substr(2, 9), color };
    setPattern([...pattern, newBead]);
  };

  const removeBead = (id: string) => {
    setPattern(pattern.filter((item) => item.id !== id));
  };

  const clearAll = () => {
    if (confirm('Clear your design?')) setPattern([]);
  };

  // --- DND EVENTS ---

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    if (active.data.current?.type === 'palette') {
        setActiveColor(active.data.current.color);
    } else {
        const bead = pattern.find(p => p.id === active.id);
        if (bead) setActiveColor(bead.color);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveColor(null);

    if (!over) return;

    // Case 1: Sorting
    if (active.data.current?.type !== 'palette' && over.id !== 'palette-area') {
        if (active.id !== over.id) {
            const oldIndex = pattern.findIndex((item) => item.id === active.id);
            const newIndex = pattern.findIndex((item) => item.id === over.id);
            setPattern(arrayMove(pattern, oldIndex, newIndex));
        }
    }
    // Case 2: Adding from Palette
    else if (active.data.current?.type === 'palette') {
        addBead(active.data.current.color);
    }
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: { opacity: '0.4' },
      },
    }),
  };

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      // Add this modifier to center the bead on the cursor
      modifiers={[snapCenterToCursor]} 
    >
      <div className="flex flex-col gap-6 w-full">
        
        {/* 1. The String (Sortable Area) */}
        <div 
            className="bg-ui-bg-subtle border border-ui-border-base rounded-xl p-4 min-h-[100px] relative transition-colors"
            // Add droppable zone logic implicitly by having SortableContext
        >
            <div className="absolute top-2 right-3 text-xs text-ui-fg-subtle font-mono">
                {pattern.length} / 35
            </div>

            <SortableContext 
                items={pattern.map(p => p.id)} 
                strategy={rectSortingStrategy}
            >
                <div className="flex flex-wrap gap-2 items-center justify-center min-h-[60px]">
                    {pattern.length === 0 && !activeId && (
                        <div className="text-ui-fg-muted text-sm italic pointer-events-none">
                            Drag colors here or click to add
                        </div>
                    )}
                    
                    {pattern.map((bead) => (
                        <SortableBead 
                            key={bead.id} 
                            id={bead.id} 
                            color={bead.color} 
                            onRemove={() => removeBead(bead.id)}
                        />
                    ))}
                </div>
            </SortableContext>
        </div>

        {/* 2. Controls */}
        <div className="flex justify-between items-center">
            <span className="text-sm text-ui-fg-subtle font-medium">Palette (Drag or Click)</span>
            <button 
            onClick={clearAll} 
            className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors"
            disabled={pattern.length === 0}
            >
            <Trash className="w-3 h-3" /> Clear
            </button>
        </div>

        {/* 3. Palette */}
        <div className="grid grid-cols-5 sm:grid-cols-9 gap-3" id="palette-area">
            {PALETTE.map((p) => (
                <div key={p.hex} onClick={() => addBead(p.hex)} className="cursor-pointer">
                    <PaletteItem color={p.hex} name={p.name} />
                </div>
            ))}
        </div>

        {/* 4. Drag Overlay (The "Ghost" Item) */}
        {/* z-index 100 ensures it sits above everything, including sticky headers */}
        <DragOverlay dropAnimation={dropAnimation} className="z-[100] cursor-grabbing">
            {activeId && activeColor ? (
                <div 
                    className="w-10 h-10 rounded-full shadow-2xl border-2 border-white cursor-grabbing transform scale-110"
                    style={{ backgroundColor: activeColor }}
                />
            ) : null}
        </DragOverlay>

      </div>
    </DndContext>
  );
}