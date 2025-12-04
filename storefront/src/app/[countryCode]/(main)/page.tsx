import { Metadata } from "next"
import Link from "next/link"

// Components
import Hero from "@modules/home/components/hero" // Ensure this path matches your project structure
import FeaturedProducts from "@modules/home/components/featured-products"
import FeaturedCategories from "@modules/home/components/featured-categories"

// Data
import { getCollectionsList } from "@lib/data/collections"
import { getCategoriesList } from "@lib/data/categories"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Phygital Kandi Market",
  description: "The world's first AI-powered Kandi store.",
}

export default async function Home({
  params: { countryCode },
}: {
  params: { countryCode: string }
}) {
  // 1. Fetch Data
  const { collections } = await getCollectionsList(0, 3)
  const { product_categories } = await getCategoriesList(0, 20)
  const region = await getRegion(countryCode)

  if (!collections || !region) {
    return null
  }

  // Filter for top-level categories (those without a parent)
  const parents = product_categories.filter(c => !c.parent_category_id).slice(0, 6)

  return (
    <div className="relative w-full overflow-hidden text-white">
      
      {/* --- HERO SECTION (Restored) --- */}
      
      {/* 1. The 3D Background (Fixed, floats behind everything) */}
      <HeroCanvas />

      {/* 2. The Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4 pt-20 pointer-events-none border-b border-white/10">
        
        <div className="pointer-events-auto space-y-8 backdrop-blur-sm bg-black/40 p-8 md:p-12 rounded-3xl border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-1000">
          
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter bg-gradient-to-r from-pink-500 via-green-400 to-blue-500 text-transparent bg-clip-text animate-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            PLUR <br/> FUTURE
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-200 max-w-lg mx-auto font-light">
            The World's First Phygital Kandi Market.
            <br/>
            <span className="text-xs md:text-sm uppercase tracking-widest text-pink-500 font-bold mt-2 block">
              AI Generated • Hand Strung • Blockchain Minted
            </span>
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center pt-6">
            {/* Restored Link to /create */}
            <Link 
              href={`/${countryCode}/create`}
              className="px-10 py-4 bg-white text-black rounded-full font-black text-lg hover:scale-110 hover:bg-pink-100 transition-all shadow-[0_0_30px_rgba(255,255,255,0.4)]"
            >
              Create Your Vibe ✨
            </Link>
            <Link 
              href={`/${countryCode}/store`}
              className="px-10 py-4 bg-black/50 border border-white/30 rounded-full font-bold text-lg text-white hover:bg-white/20 hover:border-white transition-all backdrop-blur-md"
            >
              Shop Collections
            </Link>
          </div>

        </div>
      </div>

      {/* --- SHOPPING SECTIONS --- */}
      
      {/* Note: We add a dark background here to ensure legibility over the fixed 3D canvas as you scroll down */}
      <div className="relative z-10 bg-black/80 backdrop-blur-xl border-t border-white/10">
        
        {/* Categories Grid */}
        <FeaturedCategories categories={parents} />

        {/* Collections / Featured Products */}
        <div className="py-12 pb-24">
          <ul className="flex flex-col gap-x-6">
            <FeaturedProducts collections={collections} region={region} />
          </ul>
        </div>

      </div>

    </div>
  )
}