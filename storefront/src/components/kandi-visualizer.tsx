'use client';

import dynamic from 'next/dynamic';
import { memo } from 'react';

const KandiBracelet3D = dynamic(() => import('./kandi-bracelet-3d'), { 
  ssr: false,
  loading: () => <div className="w-full h-[400px] flex items-center justify-center text-white/50">Loading 3D View...</div>
});

type Props = {
  pattern: string[];
  captureMode?: boolean;
};

function KandiVisualizer({ pattern, captureMode = false }: Props) {
  // Defensive check: ensure pattern is an array before rendering
  if (!Array.isArray(pattern) || pattern.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center text-ui-fg-muted">
        Add beads to see preview
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-3xl bg-gradient-to-b from-gray-100 to-white dark:from-zinc-900 dark:to-black border border-ui-border-base shadow-2xl h-[400px] relative">
       <KandiBracelet3D 
         pattern={pattern} 
         captureMode={captureMode} 
       />
    </div>
  );
}

export default memo(KandiVisualizer);