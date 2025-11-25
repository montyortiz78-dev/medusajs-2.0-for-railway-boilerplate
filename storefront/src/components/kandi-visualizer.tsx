'use client';

import dynamic from 'next/dynamic';

const KandiBracelet3D = dynamic(() => import('./kandi-bracelet-3d'), { 
  ssr: false,
  loading: () => <div className="w-full h-[400px]" />
});

// Add captureMode prop here
export default function KandiVisualizer({ pattern, captureMode = false }: { pattern: any[], captureMode?: boolean }) {
  if (!pattern || pattern.length === 0) return null;

  return (
    <div className="w-full overflow-hidden rounded-3xl bg-gradient-to-b from-gray-900 to-black border border-zinc-800 shadow-2xl">
       <KandiBracelet3D 
         key={JSON.stringify(pattern)} 
         pattern={pattern} 
         captureMode={captureMode} // Pass it down
       />
    </div>
  );
}