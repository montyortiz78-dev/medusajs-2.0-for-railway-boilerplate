import { Metadata } from "next"
import Link from "next/link"

// Components
import HeroCanvas from "@components/hero-canvas"
import FeaturedProducts from "@modules/home/components/featured-products"
import FeaturedCategories from "@modules/home/components/featured-categories"

// Data
import { getCollectionsList } from "@lib/data/collections"
import { getCategoriesList } from "@lib/data/categories"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Kandi Creations | Custom Kandi Bracelets, Cuffs & Accessories",
  description: "Spread Peace, Love, Unity, and Respect with premium Kandi beads and charms. Create your own custom tradeable bracelets or shop our curated festival collections.",
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
            DESIGN. TRADE. CONNECT.
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-200 max-w-lg mx-auto font-light">
            From 3D cuffs to singles: create the ultimate festival tradeables with our interactive builder.
            <br/>
            <span className="text-xs md:text-sm uppercase tracking-widest text-pink-500 font-bold mt-2 block">
              The Future of Hand Strung Kandi
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
      </div>{/* 3. About Section */}
      <section className="relative z-10 bg-black/90 backdrop-blur-xl border-t border-white/10 py-24 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500 drop-shadow-sm">
            WHAT IS PHYGITAL KANDI?
          </h2>
          <div className="h-1 w-24 bg-gradient-to-r from-pink-500 to-blue-500 mx-auto rounded-full" />
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed font-light">
            Kandi culture is about connection—trading a piece of yourself with a new friend. We take that tradition to the next level. Every bracelet you design isn't just hand-strung with premium pony beads; it's minted on the blockchain as a digital collectible. Whether you're looking for elaborate <strong className="text-white font-bold">3D Cuffs</strong>, simple <strong className="text-white font-bold">Singles</strong>, or rare <strong className="text-white font-bold">Perler</strong> charms, we bridge the gap between the rave and the digital world.
          </p>
        </div>
      </section>

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