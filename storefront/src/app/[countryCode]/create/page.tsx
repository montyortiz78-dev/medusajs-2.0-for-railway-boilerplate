'use client';

import Cookies from 'js-cookie';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Input, Label, clx } from "@medusajs/ui";
import { Sparkles, Adjustments } from "@medusajs/icons";
import KandiVisualizer from '../../../components/kandi-visualizer';
import KandiManualBuilder from '../../../components/kandi-manual-builder';

function KandiGeneratorContent() {
  // --- STATE ---
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  
  // Data State
  const [vibe, setVibe] = useState('');
  const [kandiName, setKandiName] = useState('My Custom Kandi');
  const [vibeStory, setVibeStory] = useState('Custom Design');
  const [pattern, setPattern] = useState<string[]>([]);
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false); 
  const [captureMode, setCaptureMode] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const searchParams = useSearchParams();

  // --- INITIALIZATION ---
  useEffect(() => {
    const remixData = searchParams.get('remix');
    if (remixData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(remixData)));
        setKandiName(decoded.name || 'Remixed Kandi');
        setVibeStory(decoded.vibe || 'Remixed Vibe');
        setPattern(decoded.pattern || []);
        setVibe(decoded.vibe || '');
        setHasGenerated(true);
      } catch (e) {
        console.error("Failed to load remix data", e);
      }
    }
  }, [searchParams]);

  // --- HANDLERS ---

  // 1. AI Generation
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
      setPattern(result.pattern);
      setHasGenerated(true);
    } catch (e) {
      console.error("Generator Error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Add To Stash (Checkout)
  const handleAddToStash = async () => {
    if (pattern.length === 0) {
        alert("Please add some beads first!");
        return;
    }

    setIsAdding(true);
    setCaptureMode(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const variantId = process.env.NEXT_PUBLIC_CUSTOM_KANDI_VARIANT_ID;
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

    if (!variantId) {
      alert("Error: Custom Product ID not found.");
      setIsAdding(false);
      setCaptureMode(false);
      return;
    }

    try {
      const canvas = document.querySelector('#kandi-canvas canvas') as HTMLCanvasElement;
      let imageBase64 = "https://placehold.co/400"; 

      if (canvas) {
        imageBase64 = canvas.toDataURL("image/png");
      }

      let cartId = Cookies.get("_medusa_cart_id");
      const headers = {
        "Content-Type": "application/json",
        "x-publishable-api-key": publishableKey || "",
      };

      if (!cartId) {
        const regionRes = await fetch(`${backendUrl}/store/regions`, { headers });
        const regionData = await regionRes.json();
        const usRegion = regionData.regions.find((r: any) => r.countries.some((c: any) => c.iso_2 === 'us'));
        
        if (!usRegion) {
            alert("Error: No US Region found.");
            setIsAdding(false);
            setCaptureMode(false);
            return;
        }

        const createRes = await fetch(`${backendUrl}/store/carts`, {
          method: "POST",
          headers,
          body: JSON.stringify({ region_id: usRegion.id }) 
        });
        const createData = await createRes.json();
        cartId = createData.cart.id;
        Cookies.set("_medusa_cart_id", cartId!, { expires: 7 });
      }

      const addRes = await fetch(`${backendUrl}/store/carts/${cartId}/line-items`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          variant_id: variantId,
          quantity: 1,
          metadata: {
            kandi_name: kandiName,
            kandi_vibe: vibeStory,
            pattern_data: pattern,
            image_url: imageBase64 
          }
        }),
      });

      if (addRes.ok) {
        window.location.href = "/us/cart"; 
      } else {
        console.error(await addRes.json());
        alert("Failed to add line item.");
      }

    } catch (e) {
      console.error("Cart Error:", e);
      alert("System Error adding to cart.");
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
                    <form onSubmit={handleAiGenerate} className="space-y-4">
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
                     <div className="space-y-4 animate-in fade-in duration-300">
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
                            <Label className="text-ui-fg-base font-bold">Design Pattern</Label>
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
                    <KandiVisualizer pattern={pattern} captureMode={captureMode} />
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