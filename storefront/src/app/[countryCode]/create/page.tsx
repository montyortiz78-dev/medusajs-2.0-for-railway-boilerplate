'use client';

import Cookies from 'js-cookie';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation'; // Import this
import KandiVisualizer from '../../../components/kandi-visualizer';

// We need a wrapper component to safely use useSearchParams in Next.js
function KandiGeneratorContent() {
  const [vibe, setVibe] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false); 
  const [data, setData] = useState<any>(null);
  const [captureMode, setCaptureMode] = useState(false);
  
  const searchParams = useSearchParams();

  // 1. LISTEN FOR REMIX DATA ON LOAD
  useEffect(() => {
    const remixData = searchParams.get('remix');
    if (remixData) {
      try {
        // Decode the data from the URL
        const decoded = JSON.parse(decodeURIComponent(atob(remixData)));
        
        setData({
            kandiName: decoded.name,
            vibeStory: decoded.vibe,
            pattern: decoded.pattern
        });
        setVibe(decoded.vibe); // Pre-fill the input
      } catch (e) {
        console.error("Failed to load remix data", e);
      }
    }
  }, [searchParams]);

  // 2. The AI Generator
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

  // 3. The "Add to Stash" Logic
  const handleAddToStash = async () => {
    setIsAdding(true);
    
    // Freeze & Wait for Camera Reset
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
      // Capture Image
      const canvas = document.querySelector('#kandi-canvas canvas') as HTMLCanvasElement;
      let imageBase64 = "https://placehold.co/400"; 

      if (canvas) {
        imageBase64 = canvas.toDataURL("image/png");
      }

      // Cart Logic
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

      // Add to Cart
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black text-white p-8 flex flex-col items-center font-sans">
      <h1 className="text-5xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500 tracking-tighter">
        PHYGITAL MARKET
      </h1>
      
      <div className="w-full max-w-xl bg-zinc-900/80 p-6 rounded-3xl border border-zinc-800 shadow-2xl backdrop-blur-md">
        <form onSubmit={handleGenerate} className="space-y-4">
          <textarea 
            className="w-full bg-black border border-zinc-700 rounded-xl p-4 text-white focus:border-pink-500 outline-none transition-colors"
            placeholder="What's your vibe? (e.g. 90s Cyberpunk)"
            value={vibe} onChange={(e) => setVibe(e.target.value)}
          />
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl font-bold hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Dreaming...' : 'Generate Kandi ✨'}
          </button>
        </form>
      </div>

      {data && (
        <div className="w-full max-w-4xl mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-2">{data.kandiName}</h2>
            <p className="text-zinc-400 italic">"{data.vibeStory}"</p>
          </div>
          
          <div className="bg-gradient-to-b from-zinc-900 to-black rounded-3xl p-8 border border-zinc-800">
            <KandiVisualizer pattern={data.pattern} captureMode={captureMode} />
          </div>

          <div className="flex justify-center gap-4 mt-8">
             <button 
               onClick={handleGenerate}
               className="py-3 px-8 rounded-full bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 font-bold text-sm transition-colors"
             >
               Remix ↺
             </button>
             <button 
               onClick={handleAddToStash}
               disabled={isAdding}
               className="py-3 px-8 rounded-full bg-white text-black hover:bg-gray-200 font-bold text-sm transition-colors shadow-[0_0_20px_rgba(255,255,255,0.4)]"
             >
               {isAdding ? "Adding..." : "Add to Stash ($15.00)"}
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Default export wrapper for Suspense (Required for useSearchParams)
export default function CreatePage() {
  return (
    <Suspense fallback={<div className="text-white text-center p-20">Loading Generator...</div>}>
      <KandiGeneratorContent />
    </Suspense>
  );
}