'use client';

import Cookies from 'js-cookie';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import KandiVisualizer from '../../../components/kandi-visualizer';

function KandiGeneratorContent() {
  const [vibe, setVibe] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false); 
  const [data, setData] = useState<any>(null);
  const [captureMode, setCaptureMode] = useState(false);
  
  const searchParams = useSearchParams();

  useEffect(() => {
    const remixData = searchParams.get('remix');
    if (remixData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(remixData)));
        setData({
            kandiName: decoded.name,
            vibeStory: decoded.vibe,
            pattern: decoded.pattern
        });
        setVibe(decoded.vibe);
      } catch (e) {
        console.error("Failed to load remix data", e);
      }
    }
  }, [searchParams]);

  const handleGenerate = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-kandi', {
        method: 'POST',
        body: JSON.stringify({ vibe }),
      });
      const result = await response.json();
      setData(result);
    } catch (e) {
      console.error("Generator Error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToStash = async () => {
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
            kandi_name: data.kandiName,
            kandi_vibe: data.vibeStory,
            pattern_data: data.pattern,
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
    // Use dynamic backgrounds for light/dark modes
    <div className="min-h-screen bg-white dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-gray-900 dark:via-black dark:to-black text-ui-fg-base p-8 flex flex-col items-center font-sans transition-colors duration-300">
      <h1 className="text-5xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500 tracking-tighter">
        PHYGITAL MARKET
      </h1>
      
      <div className="w-full max-w-xl bg-white/50 dark:bg-zinc-900/80 p-6 rounded-3xl border border-ui-border-base shadow-2xl backdrop-blur-md">
        <form onSubmit={handleGenerate} className="space-y-4">
          <textarea 
            className="w-full bg-white dark:bg-black border border-ui-border-base rounded-xl p-4 text-ui-fg-base focus:border-pink-500 outline-none transition-colors placeholder:text-ui-fg-muted"
            placeholder="What's your vibe? (e.g. 90s Cyberpunk)"
            value={vibe} onChange={(e) => setVibe(e.target.value)}
          />
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl font-bold hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed text-white"
          >
            {isLoading ? 'Dreaming...' : 'Generate Kandi ✨'}
          </button>
        </form>
      </div>

      {data && (
        <div className="w-full max-w-4xl mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-ui-fg-base mb-2">{data.kandiName}</h2>
            <p className="text-ui-fg-subtle italic">"{data.vibeStory}"</p>
          </div>
          
          {/* Visualizer container adapts to light/dark */}
          <div className="bg-gradient-to-b from-gray-100 to-white dark:from-zinc-900 dark:to-black rounded-3xl p-8 border border-ui-border-base">
            <KandiVisualizer pattern={data.pattern} captureMode={captureMode} />
          </div>

          <div className="flex justify-center gap-4 mt-8">
             <button 
               onClick={handleGenerate}
               className="py-3 px-8 rounded-full bg-ui-bg-component border border-ui-border-base hover:bg-ui-bg-component-hover font-bold text-sm transition-colors text-ui-fg-base"
             >
               Remix ↺
             </button>
             <button 
               onClick={handleAddToStash}
               disabled={isAdding}
               className="py-3 px-8 rounded-full bg-ui-fg-base text-ui-bg-base hover:opacity-90 font-bold text-sm transition-colors shadow-lg"
             >
               {isAdding ? "Adding..." : "Add to Stash ($15.00)"}
             </button>
          </div>
        </div>
      )}
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