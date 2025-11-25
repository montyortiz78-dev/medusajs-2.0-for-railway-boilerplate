'use client';

import dynamic from 'next/dynamic';

// Dynamically import the 3D component so it doesn't break server-side rendering
// (Canvas only works in the browser)
const KandiBracelet3D = dynamic(() => import('./kandi-bracelet-3d'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] flex items-center justify-center text-zinc-500 animate-pulse">
      Stringing beads...
    </div>
  )
});

export default function KandiVisualizer({ pattern }: { pattern: any[] }) {
  if (!pattern || pattern.length === 0) return null;

  return (
    <div className="w-full overflow-hidden rounded-3xl bg-gradient-to-b from-gray-900 to-black border border-zinc-800 shadow-2xl">
       {/* Pass pattern to the 3D Scene.
         The 'key' prop forces a full re-render when pattern changes 
         so the beads animate in again.
       */}
       <KandiBracelet3D key={JSON.stringify(pattern)} pattern={pattern} />
    </div>
  );
}