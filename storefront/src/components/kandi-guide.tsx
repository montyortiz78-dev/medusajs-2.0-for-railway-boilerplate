'use client';

import { useState } from 'react';
import { clx } from "@medusajs/ui";
// FIXED IMPORTS: Replaced Ruler/TableCells with Tag/Adjustments
import { InformationCircle, Tag, Adjustments } from "@medusajs/icons"; 

// --- DATA DEFINITIONS ---
type StitchType = 'Single' | 'Ladder' | 'Flat' | 'Multi' | 'Flower' | 'X-base';

interface StitchInfo {
  id: StitchType;
  label: string;
  desc: string;
  rows: string;
  sizes: { type: 'Wrist' | 'Neck', values: string };
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
}

const STITCH_DATA: Record<StitchType, StitchInfo> = {
  'Single': {
    id: 'Single',
    label: 'Single / Necklace',
    desc: 'The classic! One single strand of beads. Perfect for trading or wearing many at once.',
    rows: '1 Row (Standard)',
    sizes: { type: 'Wrist', values: 'Wrist (5-7") or Neck (16-20")' },
    difficulty: 'Easy'
  },
  'Ladder': {
    id: 'Ladder',
    label: 'Ladder Cuff',
    desc: 'Beads stacked directly on top of each other. Sturdy and thick.',
    rows: '2, 3, or 4 Rows',
    sizes: { type: 'Wrist', values: 'Wrist Sizes (5", 6", 7")' },
    difficulty: 'Medium'
  },
  'Flat': {
    id: 'Flat',
    label: 'Flat Stitch',
    desc: 'A smooth, flat sheet of beads. Great for pixel art designs.',
    rows: '4, 6, or 8 Rows',
    sizes: { type: 'Wrist', values: 'Wrist Sizes (5", 6", 7")' },
    difficulty: 'Medium'
  },
  'Multi': {
    id: 'Multi',
    label: 'Multi / Peyote',
    desc: 'Offset beads that lock together like bricks. Best for complex patterns.',
    rows: '5 to 10 Rows',
    sizes: { type: 'Wrist', values: 'Wrist Sizes (5", 6", 7")' },
    difficulty: 'Hard'
  },
  'Flower': {
    id: 'Flower',
    label: 'Flower Cuff',
    desc: 'Linked flower shapes. Gives a chunky, 3D texture.',
    rows: '1 Flower Row (Wide)',
    sizes: { type: 'Wrist', values: 'Wrist Sizes (5", 6", 7")' },
    difficulty: 'Hard'
  },
  'X-base': {
    id: 'X-base',
    label: 'X-Base Cuff',
    desc: 'An open, airy pattern that forms "X" shapes. Flexible and light.',
    rows: '1, 3, or 5 Rows',
    sizes: { type: 'Wrist', values: 'Wrist Sizes (5", 6", 7")' },
    difficulty: 'Expert'
  }
};

// --- CSS BEAD DIAGRAMS ---
const Bead = ({ color = "bg-pink-500", offset = false }: { color?: string, offset?: boolean }) => (
  <div className={clx("w-3 h-3 rounded-full border border-black/10 shadow-sm shrink-0", color, offset && "mt-2")} />
);

const Diagrams = ({ type }: { type: StitchType }) => {
  switch (type) {
    case 'Single':
      return (
        <div className="flex gap-1 items-center justify-center h-24 bg-gray-50 rounded-lg dark:bg-white/5">
          {[...Array(8)].map((_, i) => <Bead key={i} color={i % 2 ? "bg-blue-400" : "bg-pink-500"} />)}
        </div>
      );
    case 'Ladder':
      return (
        <div className="flex gap-1 items-center justify-center h-24 bg-gray-50 rounded-lg dark:bg-white/5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col gap-1">
               <Bead color="bg-pink-500" />
               <Bead color="bg-purple-500" />
               <Bead color="bg-blue-500" />
            </div>
          ))}
        </div>
      );
    case 'Flat':
    case 'Multi': // Peyote style (offset)
      return (
        <div className="flex gap-0.5 items-center justify-center h-24 bg-gray-50 rounded-lg dark:bg-white/5">
           {[...Array(6)].map((_, col) => (
            <div key={col} className={clx("flex flex-col gap-1", col % 2 !== 0 ? "pt-2" : "")}>
               <Bead color="bg-green-400" />
               <Bead color="bg-yellow-400" />
               <Bead color="bg-orange-400" />
            </div>
          ))}
        </div>
      );
    case 'Flower':
      return (
        <div className="flex items-center justify-center h-24 bg-gray-50 rounded-lg dark:bg-white/5">
           <div className="relative w-12 h-12">
              <div className="absolute top-0 left-4"><Bead color="bg-pink-500"/></div>
              <div className="absolute top-4 left-0"><Bead color="bg-pink-500"/></div>
              <div className="absolute top-4 left-8"><Bead color="bg-pink-500"/></div>
              <div className="absolute top-8 left-4"><Bead color="bg-pink-500"/></div>
              <div className="absolute top-4 left-4"><Bead color="bg-yellow-400"/></div>
           </div>
           <div className="relative w-12 h-12 -ml-2">
              <div className="absolute top-0 left-4"><Bead color="bg-blue-500"/></div>
              <div className="absolute top-4 left-0"><Bead color="bg-blue-500"/></div>
              <div className="absolute top-4 left-8"><Bead color="bg-blue-500"/></div>
              <div className="absolute top-8 left-4"><Bead color="bg-blue-500"/></div>
              <div className="absolute top-4 left-4"><Bead color="bg-yellow-400"/></div>
           </div>
        </div>
      );
    case 'X-base':
      return (
        <div className="flex items-center justify-center h-24 bg-gray-50 rounded-lg dark:bg-white/5 gap-4">
            <div className="flex flex-col items-center gap-1">
                <div className="flex gap-4">
                    <Bead color="bg-black" /> <Bead color="bg-black" />
                </div>
                <Bead color="bg-red-500" />
                <div className="flex gap-4">
                    <Bead color="bg-black" /> <Bead color="bg-black" />
                </div>
            </div>
             <div className="flex flex-col items-center gap-1">
                <div className="flex gap-4">
                    <Bead color="bg-black" /> <Bead color="bg-black" />
                </div>
                <Bead color="bg-red-500" />
                <div className="flex gap-4">
                    <Bead color="bg-black" /> <Bead color="bg-black" />
                </div>
            </div>
        </div>
      );
  }
};

export default function KandiGuide() {
  const [active, setActive] = useState<StitchType>('Single');
  const info = STITCH_DATA[active];

  return (
    <div className="w-full mt-8 border border-ui-border-base rounded-2xl overflow-hidden bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER */}
      <div className="bg-ui-bg-subtle p-4 border-b border-ui-border-base flex items-center gap-2">
        <InformationCircle className="text-blue-500" />
        <h3 className="font-bold text-ui-fg-base text-sm uppercase tracking-wider">Style Guide</h3>
      </div>

      <div className="flex flex-col md:flex-row">
        
        {/* LEFT: SELECTOR */}
        <div className="flex md:flex-col overflow-x-auto md:w-1/3 border-b md:border-b-0 md:border-r border-ui-border-base bg-ui-bg-field">
          {(Object.keys(STITCH_DATA) as StitchType[]).map((type) => (
            <button
              key={type}
              onClick={() => setActive(type)}
              className={clx(
                "p-3 text-sm font-medium text-left transition-colors whitespace-nowrap md:whitespace-normal",
                active === type 
                  ? "bg-white dark:bg-zinc-800 text-pink-500 border-l-4 border-pink-500 shadow-sm" 
                  : "text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle border-l-4 border-transparent"
              )}
            >
              {STITCH_DATA[type].label}
            </button>
          ))}
        </div>

        {/* RIGHT: CONTENT */}
        <div className="flex-1 p-6 flex flex-col gap-4">
            
            {/* 1. VISUALIZER */}
            <Diagrams type={active} />

            {/* 2. DESCRIPTION */}
            <div>
                <h4 className="text-xl font-bold text-ui-fg-base mb-1">{info.label}</h4>
                <p className="text-sm text-ui-fg-subtle">{info.desc}</p>
            </div>

            {/* 3. STATS GRID */}
            <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-ui-bg-subtle p-3 rounded-lg border border-ui-border-base">
                    <div className="flex items-center gap-2 mb-1 text-purple-500">
                        {/* FIXED ICON: Adjustments instead of TableCells */}
                        <Adjustments className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Height (Rows)</span>
                    </div>
                    <p className="text-sm font-medium text-ui-fg-base">{info.rows}</p>
                </div>

                <div className="bg-ui-bg-subtle p-3 rounded-lg border border-ui-border-base">
                    <div className="flex items-center gap-2 mb-1 text-green-500">
                        {/* FIXED ICON: Tag instead of Ruler */}
                        <Tag className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Circumference</span>
                    </div>
                    <p className="text-sm font-medium text-ui-fg-base">{info.sizes.values}</p>
                </div>
            </div>

            {/* SIZE CHEAT SHEET (Only shows if relevant) */}
            <div className="mt-2 pt-4 border-t border-ui-border-base">
                <p className="text-xs text-ui-fg-muted uppercase font-bold mb-2">Size Reference</p>
                <div className="flex justify-between text-xs text-ui-fg-subtle">
                    {info.sizes.type === 'Wrist' ? (
                        <>
                            <span><strong>S:</strong> ~5" (Child/Small)</span>
                            <span><strong>M:</strong> ~6" (Standard)</span>
                            <span><strong>L:</strong> ~7" (Large/Loose)</span>
                        </>
                    ) : (
                        <>
                            <span><strong>S:</strong> ~16" (Choker)</span>
                            <span><strong>M:</strong> ~18" (Standard)</span>
                            <span><strong>L:</strong> ~20" (Long)</span>
                        </>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}