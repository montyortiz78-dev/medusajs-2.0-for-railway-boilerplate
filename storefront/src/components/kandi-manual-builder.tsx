'use client';

import { useState } from 'react';
import { Trash } from "@medusajs/icons";
import { clx } from "@medusajs/ui";
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
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
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="group flex flex-col items-center gap-1 touch-none"
    >
      <div 
        className={clx(
            "w-10 h-10 rounded-full border border-ui-border-base shadow-sm transition-all ring-2 ring-transparent group-hover:ring-ui-fg-interactive",
            isDragging ? "opacity-50 scale-90" : "hover:scale-110"
        )}
        style={{ backgroundColor: color }}
      />
      <span className="text-[10px] text-ui-fg-muted uppercase tracking-wider hidden sm:block">
        {name}
      </span>
    </button>
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
        "relative group w-8 h-8 rounded-full shadow-md cursor-grab active:cursor-grabbing border border-black/10 touch-none",
        isDragging ? "z-50 opacity-0" : ""
      )}
    >
        <div className="w-full h-full rounded-full" style={{ backgroundColor: color }} />
        
        {/* Remove Button on Hover */}
        <button 
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
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
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
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
    
    // If dragging from palette, grab color
    if (active.data.current?.type === 'palette') {
        setActiveColor(active.data.current.color);
    } else {
        // If sorting existing bead, find its color
        const bead = pattern.find(p => p.id === active.id);
        if (bead) setActiveColor(bead.color);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveColor(null);

    if (!over) return;

    // Case 1: Reordering existing beads
    if (active.data.current?.type !== 'palette' && over.id !== 'palette-area') {
        if (active.id !== over.id) {
            const oldIndex = pattern.findIndex((item) => item.id === active.id);
            const newIndex = pattern.findIndex((item) => item.id === over.id);
            setPattern(arrayMove(pattern, oldIndex, newIndex));
        }
    }
    // Case 2: Dropping Palette Item onto List
    else if (active.data.current?.type === 'palette') {
        // Only add if dropped inside the sortable area (simplification)
        // dnd-kit handles the "over" detection
        addBead(active.data.current.color);
    }
  };

  // Custom Drop Animation
  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: { opacity: '0.5' },
      },
    }),
  };

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-6 w-full">
        
        {/* 1. The String (Sortable Area) */}
        <div className="bg-ui-bg-subtle border border-ui-border-base rounded-xl p-4 min-h-[100px] relative transition-colors">
            <div className="absolute top-2 right-3 text-xs text-ui-fg-subtle font-mono">
                {pattern.length} / 35
            </div>

            <SortableContext 
                items={pattern.map(p => p.id)} 
                strategy={rectSortingStrategy}
            >
                <div className="flex flex-wrap gap-2 items-center justify-center min-h-[60px]">
                    {pattern.length === 0 && !activeId && (
                        <div className="text-ui-fg-muted text-sm italic">
                            Drag colors here or click below
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

        {/* 3. Palette (Draggable Source) */}
        <div className="grid grid-cols-5 sm:grid-cols-9 gap-3">
            {PALETTE.map((p) => (
                <div key={p.hex} onClick={() => addBead(p.hex)}>
                    <PaletteItem color={p.hex} name={p.name} />
                </div>
            ))}
        </div>

        {/* 4. Drag Overlay (The "Ghost" Item) */}
        <DragOverlay dropAnimation={dropAnimation}>
            {activeId && activeColor ? (
                <div 
                    className="w-10 h-10 rounded-full shadow-2xl border-2 border-white cursor-grabbing"
                    style={{ backgroundColor: activeColor }}
                />
            ) : null}
        </DragOverlay>

      </div>
    </DndContext>
  );
}