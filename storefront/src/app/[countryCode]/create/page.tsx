'use client';

import Cookies from 'js-cookie'; // Note: Used for other things if needed, but addToCart handles cookies server-side
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { Input, Label, clx } from "@medusajs/ui";
import { Sparkles, Adjustments } from "@medusajs/icons";
import KandiVisualizer from '../../../components/kandi-visualizer';
import KandiManualBuilder, { BeadItem } from '../../../components/kandi-manual-builder';
import { addToCart } from '../../../lib/data/cart';

// Map AI Color Names to Manual Builder Hex Codes
const AI_COLOR_MAP: Record<string, string> = {
  'Pink': '#FF00CC',
  'Green': '#39FF14',
  'Blue': '#00FFFF',
  'Yellow': '#FFFF00',
  'Orange': '#FF5F1F',
  'Purple': '#B026FF',
  'Red': '#FF0000',
  'White': '#FFFFFF',
  'Black': '#000000',
  // Catch-alls for casing differences
  'pink': '#FF00CC',
  'green': '#39FF14',
  'blue': '#00FFFF',
  'yellow': '#FFFF00',
  'orange': '#FF5F1F',
  'purple': '#B026FF',
  'red': '#FF0000',
  'white': '#FFFFFF',
  'black': '#000000',
};

function KandiGeneratorContent() {
  // --- STATE ---
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  
  const [vibe, setVibe] = useState('');
  const [kandiName, setKandiName] = useState('My Custom Kandi');
  const [vibeStory, setVibeStory] = useState('Custom Design');
  
  // Pattern state: Array of { id, color }
  const [pattern, setPattern] = useState<BeadItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false); 
  const [captureMode, setCaptureMode] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();

  // --- INITIALIZATION ---
  useEffect(() => {
    const remixData = searchParams.get('remix');
    if (remixData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(remixData)));
        setKandiName(decoded.name || 'Remixed Kandi');
        setVibeStory(decoded.vibe || 'Remixed Vibe');
        setVibe(decoded.vibe || '');
        
        // Restore pattern with IDs if needed
        if (decoded.pattern) {
            // Check if it's a simple color array (old save) or object array
            const safePattern = decoded.pattern.map((p: any) => {
                if (typeof p === 'string') return { id: Math.random().toString(36).substr(2, 9), color: p };
                return p; // Assume it has { id, color }
            });
            setPattern(safePattern);
        }
        setHasGenerated(true);
      } catch (e) {
        console.error("Failed to load remix data", e);
      }
    }
  }, [searchParams]);

  // --- HANDLERS ---

  const handleAiGenerate = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-kandi', {
        method: 'POST',
        body: JSON.stringify({ vibe }),
      });
      const result = await response.json();
      
      setKandiName(result.kandiName);
      setVibeStory(result.vibeStory);
      
      // CONVERT AI COLORS TO HEX FOR MANUAL BUILDER
      // The API returns { color: "Pink", type: "pony" }
      const standardizedPattern = result.pattern.map((bead: { color: string }) => {
         // Try exact match or fallback to black
         const hexColor = AI_COLOR_MAP[bead.color] || AI_COLOR_MAP[bead.color.toLowerCase()] || '#000000';
         return {
             id: Math.random().toString(36).substr(2, 9),
             color: hexColor
         };
      });
      
      setPattern(standardizedPattern);
      setHasGenerated(true);
    } catch (e) {
      console.error("Generator Error:", e);
      alert("AI Generation failed. Try again!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToStash = async () => {
    if (pattern.length === 0) {
        alert("Please add some beads first!");
        return;
    }

    setIsAdding(true);
    setCaptureMode(true);
    // Allow visualizer to render clean state for capture
    await new Promise(resolve => setTimeout(resolve, 500));

    const variantId = process.env.NEXT_PUBLIC_CUSTOM_KANDI_VARIANT_ID;

    if (!variantId) {
      alert("Error: Custom Product ID not found.");
      setIsAdding(false);
      setCaptureMode(false);
      return;
    }

    try {
      const canvas = document.querySelector('#kandi-canvas canvas') as HTMLCanvasElement;
      let imageBase64 = "https://placehold.co/400"; 
      if (canvas) imageBase64 = canvas.toDataURL("image/png");

      // Use the Server Action to add to cart.
      // medusaError throws on failure, so we just await here.
      await addToCart({
        variantId: variantId,
        quantity: 1,
        countryCode: params.countryCode as string,
        metadata: {
            kandi_name: kandiName,
            kandi_vibe: vibeStory,
            // Only save colors to DB, ignore IDs
            pattern_data: pattern.map(p => p.color), 
            image_url: imageBase64 
        }
      });

      // If we reach here, it succeeded
      router.push(`/${params.countryCode}/cart`);

    } catch (e: any) {
      console.error("Cart Error:", e);
      // medusaError throws an Error with a friendly message
      alert(e.message || "System Error adding to cart.");
    } finally {
      setCaptureMode(false);
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-gray-900 dark:via-black dark:to-black text-ui-fg-base p-4 md:p-8 flex flex-col items-center font-sans transition-colors duration-300">
      <h1 className="text-4xl md:text-6xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500 tracking-tighter text-center">
        PHYGITAL MARKET
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-7xl">
        
        {/* LEFT COLUMN: CONTROLS */}
        <div className="flex flex-col gap-6">
            {/* Mode Switcher */}
            <div className="flex bg-ui-bg-subtle p-1 rounded-full border border-ui-border-base self-center lg:self-start">
                <button
                    onClick={() => setMode('ai')}
                    className={clx(
                        "px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all",
                        mode === 'ai' ? "bg-ui-bg-base shadow-sm text-ui-fg-base" : "text-ui-fg-subtle hover:text-ui-fg-base"
                    )}
                >
                    <Sparkles className={mode === 'ai' ? "text-pink-500" : ""} />
                    Vibe with AI
                </button>
                <button
                    onClick={() => setMode('manual')}
                    className={clx(
                        "px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all",
                        mode === 'manual' ? "bg-ui-bg-base shadow-sm text-ui-fg-base" : "text-ui-fg-subtle hover:text-ui-fg-base"
                    )}
                >
                    <Adjustments className={mode === 'manual' ? "text-blue-500" : ""} />
                    Builder
                </button>
            </div>

            {/* Control Card */}
            <div className="bg-white/50 dark:bg-zinc-900/80 p-6 rounded-3xl border border-ui-border-base shadow-xl backdrop-blur-md">
                
                {/* AI MODE */}
                {mode === 'ai' && (
                    <form onSubmit={handleAiGenerate} className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                        <div className="space-y-2">
                            <Label className="text-ui-fg-base font-bold">Describe your vibe</Label>
                            <textarea 
                                className="w-full bg-ui-bg-field border border-ui-border-base rounded-xl p-4 text-ui-fg-base focus:border-pink-500 outline-none transition-colors placeholder:text-ui-fg-muted min-h-[120px]"
                                placeholder="e.g. 90s Cyberpunk Rave in Tokyo, neon lights, glitch aesthetic..."
                                value={vibe} 
                                onChange={(e) => setVibe(e.target.value)}
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl font-bold hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-pink-500/20"
                        >
                            {isLoading ? 'Dreaming...' : 'Generate Kandi ✨'}
                        </button>
                    </form>
                )}

                {/* MANUAL MODE */}
                {mode === 'manual' && (
                     <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                        <div className="space-y-2">
                            <Label className="text-ui-fg-base font-bold">Name your creation</Label>
                            <Input 
                                placeholder="Kandi Name" 
                                value={kandiName}
                                onChange={(e) => setKandiName(e.target.value)}
                                className="bg-ui-bg-field"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-ui-fg-base font-bold">Design Pattern (Drag to Sort)</Label>
                            <KandiManualBuilder pattern={pattern} setPattern={setPattern} />
                        </div>
                     </div>
                )}
            </div>
        </div>

        {/* RIGHT COLUMN: VISUALIZER */}
        <div className="flex flex-col gap-6 sticky top-24">
             <div className="text-center lg:text-left">
                <h2 className="text-4xl font-bold text-ui-fg-base mb-2 transition-all">
                    {kandiName}
                </h2>
                <p className="text-ui-fg-subtle italic">
                    "{mode === 'ai' ? vibeStory : 'Custom Hand-picked Design'}"
                </p>
              </div>
              
              {/* 3D Canvas Container */}
              <div className="bg-gradient-to-b from-gray-100 to-white dark:from-zinc-900 dark:to-black rounded-3xl p-8 border border-ui-border-base min-h-[400px] flex items-center justify-center relative shadow-inner">
                {pattern.length > 0 ? (
                    <KandiVisualizer 
                        pattern={pattern.map(p => p.color)} 
                        captureMode={captureMode} 
                    />
                ) : (
                    <div className="text-ui-fg-muted text-center flex flex-col items-center">
                        <span className="text-4xl mb-2">📿</span>
                        <p>Add beads to see preview</p>
                    </div>
                )}
              </div>

              <div className="flex justify-center lg:justify-end gap-4">
                {mode === 'ai' && hasGenerated && (
                     <button 
                     onClick={handleAiGenerate}
                     className="py-3 px-6 rounded-full bg-ui-bg-component border border-ui-border-base hover:bg-ui-bg-component-hover font-bold text-sm transition-colors text-ui-fg-base"
                   >
                     Remix ↺
                   </button>
                )}
                 <button 
                   onClick={handleAddToStash}
                   disabled={isAdding || pattern.length === 0}
                   className="py-3 px-8 rounded-full bg-ui-fg-base text-ui-bg-base hover:opacity-90 font-bold text-sm transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed w-full lg:w-auto"
                 >
                   {isAdding ? "Adding..." : "Add to Stash ($15.00)"}
                 </button>
              </div>
        </div>

      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="text-ui-fg-base text-center p-20">Loading Generator...</div>}>
      <KandiGeneratorContent />
    </Suspense>
  );
}