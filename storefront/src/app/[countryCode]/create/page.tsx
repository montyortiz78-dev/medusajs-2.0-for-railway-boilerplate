'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { Input, Label, clx } from "@medusajs/ui";
import { Sparkles, Adjustments, CheckCircle, ExclamationCircle, InformationCircle, ArrowDownCircle } from "@medusajs/icons";
import KandiVisualizer from '@components/kandi-visualizer';
import KandiManualBuilder, { BeadItem } from '@components/kandi-manual-builder';
import { addToCart } from '@lib/data/cart';
import { getCustomKandiProduct } from './actions';
import { HttpTypes } from "@medusajs/types";
import KandiGuide from '@components/kandi-guide';
import HeroCanvas from '@components/hero-canvas';
import { useKandiContext } from "@lib/context/kandi-context"
import { isEqual } from "lodash"

// Map AI Color Names to Manual Builder Hex Codes
const AI_COLOR_MAP: Record<string, string> = {
  'Pink': '#FF00CC', 'Green': '#39FF14', 'Blue': '#00FFFF',
  'Yellow': '#FFFF00', 'Orange': '#FF5F1F', 'Purple': '#B026FF',
  'Red': '#FF0000', 'White': '#FFFFFF', 'Black': '#000000',
  'pink': '#FF00CC', 'green': '#39FF14', 'blue': '#00FFFF',
  'yellow': '#FFFF00', 'orange': '#FF5F1F', 'purple': '#B026FF',
  'red': '#FF0000', 'white': '#FFFFFF', 'black': '#000000',
};

// 1. CONFIG: Option Parsing Mappings
const STITCH_MAPPING: Record<string, string> = {
  "Ladder": "ladder", 
  "Flat": "flat", 
  "Multi (Peyote)": "peyote",
  "Peyote": "peyote", 
  "Brick": "brick", 
  "Flower": "flower",
  "X-base": "x-base", 
  "Single": "single", 
}

// Priority keys: Earlier index = Higher priority match
const ROWS_KEYS = ["rows", "row", "tiers", "layers", "row count", "height"];
const STITCH_KEYS = ["stitch", "pattern", "weave", "style", "design", "cuff type", "type"];

function KandiGeneratorContent() {
  // --- STATE ---
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [vibe, setVibe] = useState('');
  const [kandiName, setKandiName] = useState('My Custom Kandi');
  const [vibeStory, setVibeStory] = useState('Custom Design');
  
  const [product, setProduct] = useState<HttpTypes.StoreProduct | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [options, setOptions] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<HttpTypes.StoreProductVariant | undefined>(undefined);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false); 
  const [captureMode, setCaptureMode] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const params = useParams();
  const router = useRouter();

  // Use Global Context for Pattern & Visualizer Config
  const { pattern, setPattern, designConfig, setDesignConfig } = useKandiContext();

  // --- INITIALIZATION ---
  useEffect(() => {
    const fetchProduct = async () => {
      const handle = process.env.NEXT_PUBLIC_CUSTOM_KANDI_HANDLE || 'custom-ai-kandi';
      try {
        const fetchedProduct = await getCustomKandiProduct(handle);
        if (fetchedProduct) {
          setProduct(fetchedProduct);
          
          if (fetchedProduct.variants && fetchedProduct.variants.length > 0) {
             // Try to find default "Small" / "Single" / "1 Row" options first
             const PREFERRED_DEFAULTS: Record<string, string> = {
                "Size": "Small", "Type": "Single Bracelet",
                "Rows": "1", "Stitch": "Ladder"
             };
             
             const defaultOpts: Record<string, string> = {};
             fetchedProduct.options?.forEach(opt => {
                 const pref = PREFERRED_DEFAULTS[opt.title || ""];
                 const found = opt.values?.find(v => pref && v.value.includes(pref));
                 if (found) {
                     defaultOpts[opt.id] = found.value;
                 } else if (opt.values && opt.values.length > 0) {
                     defaultOpts[opt.id] = opt.values[0].value;
                 }
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

  // --- RESOLVE VARIANT ---
  useEffect(() => {
    if (!product || !product.variants) return;
    
    // Find variant where every selected option matches the variant's options
    const variant = product.variants.find((v) => 
        v.options?.every((opt) => opt.option_id && options[opt.option_id] === opt.value)
    );
    setSelectedVariant(variant);
  }, [product, options]);

  // --- OPTION PARSING: UPDATE 3D VISUALIZER ---
  useEffect(() => {
    if (!product || !product.options) return;

    // Helper: Map Option ID back to Title
    const getOptionTitle = (optId: string) => product.options?.find(o => o.id === optId)?.title || "";

    // Helper: Find value by matching Title against allowed keys (Priority-based)
    const getOptionValue = (allowedKeys: string[]) => {
        const matches = Object.entries(options).map(([optId, value]) => {
            const title = getOptionTitle(optId).toLowerCase();
            const priorityIndex = allowedKeys.findIndex(k => title.includes(k));
            return priorityIndex !== -1 ? { value, priorityIndex } : null;
        }).filter((m): m is { value: string, priorityIndex: number } => m !== null);

        // Sort by priority (lowest index = higher priority)
        matches.sort((a, b) => a.priorityIndex - b.priorityIndex);
        
        return matches.length > 0 ? matches[0].value : null;
    };

    let rows = 1;
    let stitch = "ladder";

    // Helper to resolve stitch string to code
    const resolveStitch = (val: string) => {
        const valLower = val.toLowerCase();
        // Check direct mapping
        const mapKey = Object.keys(STITCH_MAPPING).find(k => k.toLowerCase() === valLower);
        if (mapKey) return STITCH_MAPPING[mapKey];
        // Check keywords
        if (valLower.includes("x-base")) return "x-base";
        if (valLower.includes("peyote") || valLower.includes("multi")) return "peyote";
        if (valLower.includes("flat") || valLower.includes("brick")) return "flat"; // or brick/peyote logic
        if (valLower.includes("flower")) return "flower";
        return null;
    }

    // A. Parse Rows
    const selectedRowsVal = getOptionValue(ROWS_KEYS);
    if (selectedRowsVal) {
      const valStr = selectedRowsVal.toString().toLowerCase();
      
      // Check if Row option actually implies a stitch type (e.g. "Double X-base")
      const stitchFromRows = resolveStitch(selectedRowsVal);
      if (stitchFromRows) stitch = stitchFromRows;

      const match = valStr.match(/\d+/);
      if (match) {
        rows = parseInt(match[0], 10);
      } else if (valStr.includes("double")) rows = 2;
      else if (valStr.includes("triple")) rows = 3;
      else if (valStr.includes("quad")) rows = 4;
    }

    // B. Parse Stitch (Overrides rows derivation if present)
    const selectedStitchVal = getOptionValue(STITCH_KEYS);
    if (selectedStitchVal) {
        const resolved = resolveStitch(selectedStitchVal);
        if (resolved) {
            stitch = resolved;
        } else {
            // Fallback for direct value pass
            stitch = selectedStitchVal.toLowerCase();
        }
    }

    // C. Variant Metadata Override
    if (selectedVariant?.metadata) {
        if (selectedVariant.metadata.kandi_rows) rows = Number(selectedVariant.metadata.kandi_rows);
        if (selectedVariant.metadata.kandi_stitch) stitch = String(selectedVariant.metadata.kandi_stitch);
    }

    // D. Update Global Context
    // console.log("Visualizer Update:", { rows, stitch });
    setDesignConfig({
      rows: Math.max(1, rows),
      stitch: stitch,
    });

  }, [options, product, selectedVariant, setDesignConfig]);


  // --- HANDLER: SMART SWITCHING ---
  const handleOptionChange = (optionId: string, value: string) => {
    const newOptions = { ...options, [optionId]: value };

    // Check if a variant exists for this exact combination
    const exactMatch = product?.variants?.some(v => 
        v.options?.every(opt => opt.option_id && newOptions[opt.option_id] === opt.value)
    );

    if (exactMatch) {
        setOptions(newOptions);
    } else {
        // If not, find the closest valid variant that has the NEW option value
        const validVariant = product?.variants?.find(v => 
            v.options?.some(opt => opt.option_id === optionId && opt.value === value)
        );

        if (validVariant && validVariant.options) {
            const autoFixedOptions: Record<string, string> = {};
            validVariant.options.forEach(opt => {
                if (opt.option_id) autoFixedOptions[opt.option_id] = opt.value;
            });
            setOptions(autoFixedOptions);
        }
    }
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

  // [ADD THIS BLOCK] ---------------------------------------------------------
  // Prepare pattern for Visualizer: Remove ghost beads and IDs to match Product Page format
  const visualizerPattern = pattern
    .filter((p) => !p.isGhost)
    .map((p) => ({ color: p.color }));
  // --------------------------------------------------------------------------

  return (
    <div className="min-h-screen text-ui-fg-base font-sans transition-colors duration-300">
      
      {/* 1. BACKGROUND LAYER */}
      <HeroCanvas />

      {/* 2. HERO SECTION (Intro) */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[65vh] px-4 text-center animate-in fade-in slide-in-from-top-8 duration-1000">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 tracking-tighter drop-shadow-sm">
                THE PHYGITAL LAB
            </h1>
            <p className="text-xl md:text-2xl text-ui-fg-base font-medium leading-relaxed max-w-2xl mx-auto">
                Design custom Kandi. We ship the <span className="text-pink-500 font-bold">Physical</span> bracelet. <br className="hidden md:block"/>
                We mint the <span className="text-blue-500 font-bold">Digital</span> collectible.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm font-bold uppercase tracking-wide pt-4">
                <span className="flex items-center gap-2 bg-white/80 dark:bg-black/50 border border-ui-border-base px-4 py-2 rounded-full backdrop-blur-sm shadow-sm">
                    <Sparkles className="text-pink-500"/> Dream with AI
                </span>
                <span className="flex items-center gap-2 bg-white/80 dark:bg-black/50 border border-ui-border-base px-4 py-2 rounded-full backdrop-blur-sm shadow-sm">
                    <Adjustments className="text-blue-500"/> Build by Hand
                </span>
            </div>
          </div>

          {/* Scroll Hint */}
          <div className="absolute bottom-10 animate-bounce opacity-50">
             <ArrowDownCircle className="w-8 h-8 text-ui-fg-muted" />
          </div>
      </section>
      
      {/* 3. CREATE SECTION (Tool) */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 pb-24 flex flex-col items-center">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
            {/* LEFT COLUMN: CONTROLS */}
            <div className="flex flex-col gap-6">
                {/* Mode Switcher */}
                <div className="flex bg-ui-bg-subtle p-1 rounded-full border border-ui-border-base self-center lg:self-start shadow-md backdrop-blur-md">
                    <button onClick={() => setMode('ai')} className={clx("px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all", mode === 'ai' ? "bg-ui-bg-base shadow-sm text-ui-fg-base" : "text-ui-fg-subtle hover:text-ui-fg-base")}>
                        <Sparkles className={mode === 'ai' ? "text-pink-500" : ""} /> Vibe with AI
                    </button>
                    <button onClick={() => setMode('manual')} className={clx("px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all", mode === 'manual' ? "bg-ui-bg-base shadow-sm text-ui-fg-base" : "text-ui-fg-subtle hover:text-ui-fg-base")}>
                        <Adjustments className={mode === 'manual' ? "text-blue-500" : ""} /> Builder
                    </button>
                </div>

                <div className="bg-white/60 dark:bg-zinc-900/60 p-6 rounded-3xl border border-ui-border-base shadow-xl backdrop-blur-md">
                    {mode === 'ai' && (
                        <form onSubmit={handleAiGenerate} className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                            <div className="space-y-2">
                                <Label className="text-ui-fg-base font-bold">Describe your vibe</Label>
                                <textarea className="w-full bg-ui-bg-field border border-ui-border-base rounded-xl p-4 text-ui-fg-base focus:border-pink-500 outline-none transition-colors placeholder:text-ui-fg-muted min-h-[120px]" placeholder="e.g. 90s Cyberpunk Rave in Tokyo, neon lights, glitch aesthetic..." value={vibe} onChange={(e) => setVibe(e.target.value)} />
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
                <div className="bg-white/60 dark:bg-zinc-900/60 p-6 rounded-3xl border border-ui-border-base shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                
                                const existsInProduct = product.variants?.some(v => 
                                    v.options?.some(opt => opt.option_id === option.id && opt.value === val.value)
                                );

                                return (
                                <button
                                    key={val.value}
                                    onClick={() => handleOptionChange(option.id, val.value)}
                                    disabled={!existsInProduct}
                                    className={clx(
                                    "px-4 py-2 rounded-lg border text-sm transition-all",
                                    isSelected 
                                        ? "border-pink-500 bg-pink-500/10 text-pink-600 font-bold shadow-sm" 
                                        : existsInProduct
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

                <KandiGuide />
            </div>

            {/* RIGHT COLUMN: VISUALIZER */}
            <div className="flex flex-col gap-6 sticky top-24">
                <div className="text-center lg:text-left backdrop-blur-sm p-4 rounded-2xl border border-transparent hover:border-ui-border-base transition-colors">
                    <h2 className="text-4xl font-bold text-ui-fg-base mb-2">{kandiName}</h2>
                    <p className="text-ui-fg-subtle italic">"{mode === 'ai' ? vibeStory : 'Custom Design'}"</p>
                </div>
                
                <div className="bg-gradient-to-b from-gray-100 to-white dark:from-zinc-900 dark:to-black rounded-3xl p-8 border border-ui-border-base min-h-[400px] flex items-center justify-center relative shadow-inner">
                    {pattern.length > 0 ? (
                        <KandiVisualizer 
                            pattern={visualizerPattern}
                            captureMode={captureMode}
                            // DYNAMIC PROPS
                            rows={designConfig.rows} 
                            stitch={designConfig.stitch}
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
                        <button onClick={handleAiGenerate} className="py-3 px-6 rounded-full bg-ui-bg-component border border-ui-border-base hover:bg-ui-bg-component-hover font-bold text-sm transition-colors text-ui-fg-base shadow-sm">
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

        {/* Disclaimer Footer */}
        <div className="max-w-3xl mx-auto mt-20 p-6 border-t border-ui-border-base flex gap-4 text-ui-fg-muted opacity-80 hover:opacity-100 transition-opacity bg-white/50 dark:bg-black/20 rounded-2xl backdrop-blur-sm">
            <InformationCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
                <strong>Disclaimer:</strong> The digital 3D preview is for visualization purposes only and is not an exact replica of the physical product. 
                Our artists will replicate your pattern and colors as closely as possible, but due to the varying number of beads required for different 
                styles (e.g., Cuffs vs. Singles) and sizes, we may need to creatively adapt the design to ensure structural integrity and fit. 
                By purchasing, you agree to these minor artistic variations.
            </p>
        </div>

      </section>
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