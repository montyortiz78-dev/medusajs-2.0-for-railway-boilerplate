'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { Input, Label, clx } from "@medusajs/ui";
import { Sparkles, Adjustments, CheckCircle, ExclamationCircle } from "@medusajs/icons";
import KandiVisualizer from '../../../components/kandi-visualizer';
import KandiManualBuilder, { BeadItem } from '../../../components/kandi-manual-builder';
import { addToCart } from '../../../lib/data/cart';
import { getCustomKandiProduct } from './actions';
import { HttpTypes } from "@medusajs/types";

// Map AI Color Names to Manual Builder Hex Codes
const AI_COLOR_MAP: Record<string, string> = {
  'Pink': '#FF00CC', 'Green': '#39FF14', 'Blue': '#00FFFF',
  'Yellow': '#FFFF00', 'Orange': '#FF5F1F', 'Purple': '#B026FF',
  'Red': '#FF0000', 'White': '#FFFFFF', 'Black': '#000000',
  'pink': '#FF00CC', 'green': '#39FF14', 'blue': '#00FFFF',
  'yellow': '#FFFF00', 'orange': '#FF5F1F', 'purple': '#B026FF',
  'red': '#FF0000', 'white': '#FFFFFF', 'black': '#000000',
};

function KandiGeneratorContent() {
  // --- STATE ---
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [vibe, setVibe] = useState('');
  const [kandiName, setKandiName] = useState('My Custom Kandi');
  const [vibeStory, setVibeStory] = useState('Custom Design');
  const [pattern, setPattern] = useState<BeadItem[]>([]);
  
  const [product, setProduct] = useState<HttpTypes.StoreProduct | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [options, setOptions] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<HttpTypes.StoreProductVariant | undefined>(undefined);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false); 
  const [captureMode, setCaptureMode] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();

  // --- INITIALIZATION ---
  useEffect(() => {
    const fetchProduct = async () => {
      const handle = process.env.NEXT_PUBLIC_CUSTOM_KANDI_HANDLE || 'custom-ai-kandi';
      try {
        const fetchedProduct = await getCustomKandiProduct(handle);
        if (fetchedProduct) {
          setProduct(fetchedProduct);
          
          // Smart Defaults: Find the first valid variant and pre-select its options
          if (fetchedProduct.variants && fetchedProduct.variants.length > 0) {
             const firstVariant = fetchedProduct.variants[0];
             const defaultOpts: Record<string, string> = {};
             firstVariant.options?.forEach(opt => {
                 if (opt.option_id) defaultOpts[opt.option_id] = opt.value;
             });
             setOptions(defaultOpts);
          }
        } else {
            setProductError(`Product not found. Handle: ${handle}`);
        }
      } catch (err) {
          setProductError("System error loading product.");
      }
    };
    fetchProduct();
  }, []);

  // --- LOGIC: RESOLVE VARIANT ---
  useEffect(() => {
    if (!product || !product.variants) return;
    
    const variant = product.variants.find((v) => 
        v.options?.every((opt) => {
            // FIX 1: Safely handle null/undefined option_id
            if (!opt.option_id) return false;
            return options[opt.option_id] === opt.value;
        })
    );
    setSelectedVariant(variant);
  }, [product, options]);

  // --- LOGIC: CHECK AVAILABILITY ---
  const isOptionAvailable = (optionId: string, value: string) => {
    if (!product?.variants) return false;

    // 1. Create a hypothetical selection
    const hypotheticalOptions = { ...options, [optionId]: value };

    // 2. Check if ANY variant exists that matches this hypothesis
    return product.variants.some((variant) => {
      return variant.options?.every((opt) => {
        // FIX 2: Safely handle null/undefined option_id
        if (!opt.option_id) return true; // Skip malformed options

        const currentSelectedValue = hypotheticalOptions[opt.option_id];
        return currentSelectedValue === undefined || opt.value === currentSelectedValue;
      });
    });
  };

  const handleOptionChange = (optionId: string, value: string) => {
    setOptions(prev => ({ ...prev, [optionId]: value }));
  };

  const handleAiGenerate = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-kandi', { method: 'POST', body: JSON.stringify({ vibe }) });
      const result = await response.json();
      setKandiName(result.kandiName);
      setVibeStory(result.vibeStory);
      const standardizedPattern = result.pattern.map((bead: { color: string }) => {
         const hexColor = AI_COLOR_MAP[bead.color] || AI_COLOR_MAP[bead.color.toLowerCase()] || '#000000';
         return { id: Math.random().toString(36).substr(2, 9), color: hexColor };
      });
      setPattern(standardizedPattern);
      setHasGenerated(true);
    } catch (e) {
      alert("AI Generation failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToStash = async () => {
    if (pattern.length === 0) return alert("Add beads first!");
    if (!selectedVariant?.id) return alert("Select valid options first.");

    setIsAdding(true);
    setCaptureMode(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const canvas = document.querySelector('#kandi-canvas canvas') as HTMLCanvasElement;
      let imageBase64 = "https://placehold.co/400"; 
      if (canvas) imageBase64 = canvas.toDataURL("image/jpeg", 0.6);

      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode: params.countryCode as string,
        metadata: {
            kandi_name: kandiName,
            kandi_vibe: vibeStory,
            pattern_data: pattern.map(p => p.color), 
            image_url: imageBase64 
        }
      });
      router.push(`/${params.countryCode}/cart`);
    } catch (e: any) {
      alert(e.message || "Error adding to cart.");
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
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6">
            <div className="flex bg-ui-bg-subtle p-1 rounded-full border border-ui-border-base self-center lg:self-start">
                <button onClick={() => setMode('ai')} className={clx("px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all", mode === 'ai' ? "bg-ui-bg-base shadow-sm text-ui-fg-base" : "text-ui-fg-subtle hover:text-ui-fg-base")}>
                    <Sparkles className={mode === 'ai' ? "text-pink-500" : ""} /> Vibe with AI
                </button>
                <button onClick={() => setMode('manual')} className={clx("px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all", mode === 'manual' ? "bg-ui-bg-base shadow-sm text-ui-fg-base" : "text-ui-fg-subtle hover:text-ui-fg-base")}>
                    <Adjustments className={mode === 'manual' ? "text-blue-500" : ""} /> Builder
                </button>
            </div>

            <div className="bg-white/50 dark:bg-zinc-900/80 p-6 rounded-3xl border border-ui-border-base shadow-xl backdrop-blur-md">
                {mode === 'ai' && (
                    <form onSubmit={handleAiGenerate} className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                        <div className="space-y-2">
                            <Label className="text-ui-fg-base font-bold">Describe your vibe</Label>
                            <textarea className="w-full bg-ui-bg-field border border-ui-border-base rounded-xl p-4 text-ui-fg-base focus:border-pink-500 outline-none transition-colors placeholder:text-ui-fg-muted min-h-[120px]" placeholder="e.g. 90s Cyberpunk Rave in Tokyo..." value={vibe} onChange={(e) => setVibe(e.target.value)} />
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl font-bold hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-pink-500/20">
                            {isLoading ? 'Dreaming...' : 'Generate Kandi ✨'}
                        </button>
                    </form>
                )}
                {mode === 'manual' && (
                     <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                        <div className="space-y-2">
                            <Label className="text-ui-fg-base font-bold">Name your creation</Label>
                            <Input placeholder="Kandi Name" value={kandiName} onChange={(e) => setKandiName(e.target.value)} className="bg-ui-bg-field" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-ui-fg-base font-bold">Design Pattern</Label>
                            <KandiManualBuilder pattern={pattern} setPattern={setPattern} />
                        </div>
                     </div>
                )}
            </div>

            {productError && (
               <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 text-red-600 dark:text-red-400 flex items-center gap-2">
                  <ExclamationCircle /> <span className="text-sm font-medium">{productError}</span>
               </div>
            )}

            {product && product.options && product.options.length > 0 && (
              <div className="bg-white/50 dark:bg-zinc-900/80 p-6 rounded-3xl border border-ui-border-base shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <CheckCircle className="text-green-500"/> Finalize
                  </h3>
                  <div className="space-y-4">
                    {product.options.map((option) => (
                      <div key={option.id} className="space-y-2">
                        <Label className="text-sm font-medium text-ui-fg-subtle uppercase">{option.title}</Label>
                        <div className="flex flex-wrap gap-2">
                          {option.values?.map((val) => {
                             const isSelected = options[option.id] === val.value;
                             const isAvailable = isOptionAvailable(option.id, val.value);

                             return (
                               <button
                                 key={val.value}
                                 onClick={() => isAvailable && handleOptionChange(option.id, val.value)}
                                 disabled={!isAvailable}
                                 className={clx(
                                   "px-4 py-2 rounded-lg border text-sm transition-all",
                                   isSelected 
                                     ? "border-pink-500 bg-pink-500/10 text-pink-600 font-bold shadow-sm" 
                                     : isAvailable 
                                        ? "border-ui-border-base bg-ui-bg-subtle hover:border-ui-fg-muted text-ui-fg-base"
                                        : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed decoration-slice line-through"
                                 )}
                               >
                                 {val.value}
                               </button>
                             )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
            )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6 sticky top-24">
             <div className="text-center lg:text-left">
                <h2 className="text-4xl font-bold text-ui-fg-base mb-2">{kandiName}</h2>
                <p className="text-ui-fg-subtle italic">"{mode === 'ai' ? vibeStory : 'Custom Design'}"</p>
              </div>
              
              <div className="bg-gradient-to-b from-gray-100 to-white dark:from-zinc-900 dark:to-black rounded-3xl p-8 border border-ui-border-base min-h-[400px] flex items-center justify-center relative shadow-inner">
                {pattern.length > 0 ? (
                    <KandiVisualizer pattern={pattern.map(p => p.color)} captureMode={captureMode} />
                ) : (
                    <div className="text-ui-fg-muted text-center flex flex-col items-center">
                        <span className="text-4xl mb-2">📿</span>
                        <p>Add beads to see preview</p>
                    </div>
                )}
              </div>

              <div className="flex justify-center lg:justify-end gap-4">
                {mode === 'ai' && hasGenerated && (
                     <button onClick={handleAiGenerate} className="py-3 px-6 rounded-full bg-ui-bg-component border border-ui-border-base hover:bg-ui-bg-component-hover font-bold text-sm transition-colors text-ui-fg-base">
                     Remix ↺
                   </button>
                )}
                 <button 
                   onClick={handleAddToStash}
                   disabled={isAdding || pattern.length === 0 || !selectedVariant}
                   className="py-3 px-8 rounded-full bg-ui-fg-base text-ui-bg-base hover:opacity-90 font-bold text-sm transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed w-full lg:w-auto"
                 >
                   {isAdding ? "Adding..." : (
                     selectedVariant?.calculated_price?.calculated_amount 
                       ? `Add to Stash (${selectedVariant.calculated_price.calculated_amount} ${selectedVariant.calculated_price.currency_code})`
                       : "Select Options"
                   )}
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