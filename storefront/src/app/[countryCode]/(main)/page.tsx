import { Metadata } from "next"
import Link from "next/link"

// Components
import HeroCanvas from "@components/hero-canvas"
// REPLACE: Store Template instead of Featured components
import StoreTemplate from "@modules/store/templates" 

// Data
import { listCategories } from "@lib/data/categories"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

// 1. FORCE DYNAMIC RENDERING
// This ensures deleted categories disappear immediately on refresh.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Kandi Creations | Custom Kandi Bracelets, Cuffs & Accessories",
  description: "Spread Peace, Love, Unity, and Respect with premium Kandi beads and charms. Create your own custom tradeable bracelets or shop our curated festival collections.",
}

type Params = {
  searchParams: {
    sortBy?: SortOptions
    page?: string
    category?: string
  }
  params: {
    countryCode: string
  }
}

export default async function Home({ params, searchParams }: Params) {
  const { countryCode } = params
  const { sortBy, page, category } = searchParams

  // 1. Fetch Data for the Store Interface
  // We need the full list of categories for the sidebar filter
  const categories = await listCategories()

  // 2. Resolve Category ID if a filter is active
  // The URL uses the handle (e.g. ?category=bracelets), but the API needs the ID.
  const activeCategoryData = categories.find(c => c.handle === category)
  const categoryId = activeCategoryData?.id

  return (
    <div className="relative w-full overflow-hidden transition-colors duration-300">
      
      {/* 1. The 3D Background (Fixed, floats behind everything) */}
      <HeroCanvas />

      {/* 2. The Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4 pt-20 pointer-events-none border-b border-ui-border-base">
        
        <div className="pointer-events-auto space-y-8 glass p-8 md:p-12 rounded-3xl max-w-3xl mx-auto animate-in fade-in zoom-in duration-1000">
          
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter bg-gradient-to-r from-pink-500 via-green-400 to-blue-500 text-transparent bg-clip-text animate-pulse drop-shadow-sm">
            DESIGN. TRADE. CONNECT.
          </h1>
          
          <p className="text-xl md:text-2xl text-ui-fg-subtle max-w-lg mx-auto font-light">
            From 3D cuffs to singles: create the ultimate festival tradeables with our interactive builder.
            <br/>
            <span className="text-xs md:text-sm uppercase tracking-widest text-pink-500 font-bold mt-2 block">
              The Future of Hand Strung Kandi
            </span>
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center pt-6">
            <Link 
              href={`/${countryCode}/create`}
              className="px-10 py-4 bg-ui-fg-base text-ui-bg-base rounded-full font-black text-lg hover:scale-105 hover:bg-pink-500 hover:text-white transition-all shadow-lg"
            >
              Create Your Vibe ✨
            </Link>
            {/* Scroll down to shop anchor */}
            <a 
              href="#shop"
              className="px-10 py-4 bg-ui-bg-component border border-ui-border-base rounded-full font-bold text-lg text-ui-fg-base hover:bg-ui-bg-subtle-hover transition-all"
            >
              Shop Collections
            </a>
          </div>

        </div>
      </div>

      {/* 3. About Section */}
      <section className="relative z-10 bg-ui-bg-subtle/90 backdrop-blur-xl border-t border-ui-border-base py-24 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500 drop-shadow-sm">
            WHAT IS PHYGITAL KANDI?
          </h2>
          <div className="h-1 w-24 bg-gradient-to-r from-pink-500 to-blue-500 mx-auto rounded-full" />
          <p className="text-lg md:text-xl text-ui-fg-muted leading-relaxed font-light">
            Kandi culture is about connection—trading a piece of yourself with a new friend. We take that tradition to the next level. Every piece you design isn't just hand-strung with premium pony beads; it's minted on the blockchain as a digital collectible. Whether you're looking for elaborate <strong className="text-ui-fg-base font-bold">3D Cuffs</strong>, <strong className="text-ui-fg-base font-bold">classic single bracelets</strong>, or <strong className="text-ui-fg-base font-bold">statement necklaces</strong>, we bridge the gap between the rave and the digital world.
          </p>
        </div>
      </section>

      {/* --- SHOPPING SECTION (Replaced with Store Template) --- */}
      <div id="shop" className="relative z-10 bg-ui-bg-base/80 backdrop-blur-xl border-t border-ui-border-base min-h-screen">
        <StoreTemplate
          sortBy={sortBy}
          page={page}
          countryCode={countryCode}
          categories={categories}
          categoryId={categoryId}
          activeCategory={category}
        />
      </div>

    </div>
  )
}