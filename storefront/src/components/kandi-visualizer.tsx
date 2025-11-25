'use client';

const COLOR_MAP: Record<string, string> = {
  "neon-pink": "#FF00CC", "neon-green": "#39FF14", "electric-blue": "#00FFFF",
  "hot-orange": "#FF5E00", "bright-yellow": "#FFFF00", "purple": "#9D00FF",
  "black": "#1A1A1A", "white": "#F0F0F0", "glow-in-dark": "#E0FFD1"
};

export default function KandiVisualizer({ pattern }: { pattern: any[] }) {
  if (!pattern) return null;
  return (
    <div className="flex flex-wrap justify-center gap-1 p-8 bg-gray-900 rounded-xl">
      {pattern.map((bead, i) => (
        <div key={i} className="w-8 h-8 rounded-full border border-white/20 shadow-lg"
             style={{ backgroundColor: COLOR_MAP[bead.color] }} title={bead.type} />
      ))}
    </div>
  );
}