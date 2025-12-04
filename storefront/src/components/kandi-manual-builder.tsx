'use client';

import { useState } from 'react';
import { Trash } from "@medusajs/icons";
import { clx } from "@medusajs/ui";
import {
  DndContext, 
  closestCenter,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDraggable,
  useDroppable
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
  AnimateLayoutChanges,
  defaultAnimateLayoutChanges 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { snapCenterToCursor } from '@dnd-kit/modifiers';

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
  isGhost?: boolean;
};

type Props = {
  pattern: BeadItem[];
  setPattern: (pattern: BeadItem[]) => void;
};

const animateLayoutChanges: AnimateLayoutChanges = (args) => 
  defaultAnimateLayoutChanges({ ...args, wasDragging: true });

// --- COMPONENTS ---

function PaletteItem({ color, name }: { color: string, name: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${color}`,
    data: { type: 'palette', color }
  });

  return (
    <div className="flex flex-col items-center gap-1">
        <button
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={clx(
                "group relative w-10 h-10 rounded-full border border-ui-border-base shadow-sm transition-all ring-2 ring-transparent hover:ring-ui-fg-interactive touch-none cursor-grab active:cursor-grabbing",
                isDragging ? "opacity-30" : "hover:scale-110"
            )}
            style={{ backgroundColor: color }}
            aria-label={`Add ${name}`}
        />
        <span className="text-[10px] text-ui-fg-muted uppercase tracking-wider hidden sm:block select-none">
            {name}
        </span>
    </div>
  );
}

function SortableBead({ id, color, onRemove, isGhost }: { id: string, color: string, onRemove: () => void, isGhost?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
      id,
      animateLayoutChanges 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isGhost) {
      return (
        <div
          ref={setNodeRef}
          style={style}
          className="w-8 h-8 rounded-full bg-ui-fg-interactive/30 border-2 border-dashed border-ui-fg-interactive animate-pulse opacity-70"
        />
      );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clx(
        "relative group w-8 h-8 rounded-full shadow-md cursor-grab active:cursor-grabbing border border-black/10 touch-none transition-transform",
        isDragging ? "z-0 opacity-30" : "hover:scale-105 z-10"
      )}
    >
        <div className="w-full h-full rounded-full" style={{ backgroundColor: color }} />
        
        <button 
            onClick={(e) => { 
                e.stopPropagation();
                onRemove(); 
            }}
            onPointerDown={(e) => e.stopPropagation()}
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

  const { setNodeRef: setWorkAreaRef, isOver } = useDroppable({
    id: 'work-area',
  });

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addBead = (color: string) => {
    if (pattern.length >= 35) return;
    const newBead = { id: Math.random().toString(36).substr(2, 9), color };
    // Ensure no ghosts remain
    const cleanPattern = pattern.filter(p => !p.isGhost);
    setPattern([...cleanPattern, newBead]);
  };

  const removeBead = (id: string) => {
    setPattern(pattern.filter((item) => item.id !== id));
  };

  const clearAll = () => {
    if (confirm('Clear your design?')) setPattern([]);
  };

  // --- DND HANDLERS ---

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

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.data.current?.type !== 'palette') return;

    // If empty, dropping ANYWHERE in the box adds it
    const isOverWorkArea = over.id === 'work-area';
    const isOverBead = pattern.some(p => p.id === over.id);

    if (isOverWorkArea || isOverBead) {
        const ghostId = 'ghost-bead';
        const hasGhost = pattern.some(p => p.id === ghostId);
        
        let insertIndex = pattern.length;
        if (isOverBead) {
             const overIndex = pattern.findIndex(p => p.id === over.id);
             if (overIndex !== -1) insertIndex = overIndex;
        } else if (pattern.length === 0) {
            // Force insert at 0 if empty
            insertIndex = 0;
        }

        if (!hasGhost) {
            if (pattern.length >= 35) return;
            const newGhost = { id: ghostId, color: active.data.current.color, isGhost: true };
            const newPattern = [...pattern];
            newPattern.splice(insertIndex, 0, newGhost);
            setPattern(newPattern);
        } else {
            const ghostIndex = pattern.findIndex(p => p.id === ghostId);
            if (ghostIndex !== insertIndex && insertIndex !== -1) {
                setPattern(arrayMove(pattern, ghostIndex, insertIndex));
            }
        }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveColor(null);

    const patternWithoutGhost = pattern.filter(p => !p.isGhost);

    if (!over) {
        setPattern(patternWithoutGhost);
        return;
    }

    if (active.data.current?.type !== 'palette') {
        // Sorting
        if (active.id !== over.id) {
            const oldIndex = pattern.findIndex((item) => item.id === active.id);
            const newIndex = pattern.findIndex((item) => item.id === over.id);
            setPattern(arrayMove(pattern, oldIndex, newIndex));
        }
    } else {
        // Adding from Palette
        // Allow drop if over 'work-area' OR over any bead OR over the ghost
        const isGhost = pattern.some(p => p.id === over.id && p.isGhost);
        
        if (over.id === 'work-area' || pattern.some(p => p.id === over.id) || isGhost) {
            const ghostIndex = pattern.findIndex(p => p.isGhost);
            const finalIndex = ghostIndex !== -1 ? ghostIndex : pattern.length;
            
            const newBead = { id: Math.random().toString(36).substr(2, 9), color: active.data.current.color };
            const newPattern = [...patternWithoutGhost];
            newPattern.splice(finalIndex, 0, newBead);
            
            if (newPattern.length <= 35) {
                setPattern(newPattern);
            } else {
                setPattern(patternWithoutGhost);
            }
        } else {
            setPattern(patternWithoutGhost);
        }
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
      collisionDetection={rectIntersection} 
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      modifiers={[snapCenterToCursor]} 
    >
      <div className="flex flex-col gap-6 w-full">
        
        {/* 1. WORK AREA */}
        <div 
            ref={setWorkAreaRef} 
            className={clx(
                "bg-ui-bg-subtle border border-ui-border-base rounded-xl p-4 min-h-[120px] relative transition-all duration-200",
                isOver ? "bg-ui-bg-base border-ui-fg-interactive ring-2 ring-ui-fg-interactive ring-opacity-20 scale-[1.02]" : ""
            )}
        >
            <div className="absolute top-2 right-3 text-xs text-ui-fg-subtle font-mono">
                {pattern.filter(p => !p.isGhost).length} / 35
            </div>

            <SortableContext 
                items={pattern.map(p => p.id)} 
                strategy={rectSortingStrategy}
            >
                <div className="flex flex-wrap gap-3 items-center justify-center min-h-[80px] content-center">
                    
                    {/* INSTRUCTIONS - Show when empty */}
                    {pattern.length === 0 && !activeId && (
                        <div className="text-ui-fg-muted text-sm text-center pointer-events-none select-none flex flex-col items-center gap-2 animate-in fade-in">
                            <span className="font-medium text-ui-fg-base">Tap colors to start</span>
                            <span className="text-xs opacity-70">or drag beads here</span>
                        </div>
                    )}
                    
                    {pattern.map((bead) => (
                        <SortableBead 
                            key={bead.id} 
                            id={bead.id} 
                            color={bead.color} 
                            isGhost={bead.isGhost}
                            onRemove={() => removeBead(bead.id)}
                        />
                    ))}
                </div>
            </SortableContext>
        </div>

        {/* 2. CONTROLS */}
        <div className="flex justify-between items-center">
            <span className="text-sm text-ui-fg-subtle font-medium">Palette</span>
            <button 
                onClick={clearAll} 
                className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                disabled={pattern.length === 0}
            >
                <Trash className="w-3 h-3" /> Clear
            </button>
        </div>

        {/* 3. PALETTE */}
        <div className="grid grid-cols-5 sm:grid-cols-9 gap-3" id="palette-area">
            {PALETTE.map((p) => (
                <div key={p.hex} onClick={() => addBead(p.hex)} className="cursor-pointer">
                    <PaletteItem color={p.hex} name={p.name} />
                </div>
            ))}
        </div>

        {/* 4. OVERLAY */}
        <DragOverlay dropAnimation={dropAnimation} className="z-[100] pointer-events-none">
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