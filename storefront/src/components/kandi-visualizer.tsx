'use client';

import dynamic from 'next/dynamic';
import { memo } from 'react';
// 1. IMPORT THE CONTEXT
import { useKandiContext } from '@lib/context/kandi-context';

const KandiBracelet3D = dynamic(() => import('./kandi-bracelet-3d'), { 
  ssr: false,
  loading: () => <div className="w-full h-[400px] flex items-center justify-center text-white/50">Loading 3D View...</div>
});

type Props = {
  pattern: ({ color: string; type?: string } | string)[]; 
  captureMode?: boolean;
  rows?: number;
  stitch?: string;
};

function KandiVisualizer({ pattern, captureMode = false, rows = 1, stitch = 'ladder' }: Props) {
  // 2. GET CUSTOM WORD FROM CONTEXT
  const { customWord } = useKandiContext();

  // 3. ALLOW RENDER IF PATTERN *OR* WORD EXISTS
  if ((!Array.isArray(pattern) || pattern.length === 0) && (!customWord || customWord.length === 0)) {
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
         // 4. PASS CUSTOM WORD TO 3D SCENE
         customWord={customWord}
         captureMode={captureMode} 
         rows={rows}
         stitch={stitch}
       />
    </div>
  );
}

export default memo(KandiVisualizer);