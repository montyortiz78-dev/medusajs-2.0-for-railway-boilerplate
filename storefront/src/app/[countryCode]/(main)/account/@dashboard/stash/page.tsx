import { listOrders } from "@lib/data/orders"
import { Container, Heading, Text } from "@medusajs/ui"
import Thumbnail from "@modules/products/components/thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { notFound } from "next/navigation"

export const metadata = {
  title: "My Stash",
  description: "Your collection of Phygital Kandi.",
}

export default async function StashPage() {
  const orders = await listOrders()

  if (!orders) {
    notFound()
  }

  // 1. Flatten Orders to find Kandi Items
  const stashItems = orders.flatMap((order: any) => 
    order.items.filter((item: any) => item.metadata && item.metadata.kandi_name)
      .map((item: any) => ({
        ...item,
        orderDate: order.created_at,
        orderId: order.display_id,
        kandiName: item.metadata?.kandi_name as string,
        kandiVibe: item.metadata?.kandi_vibe as string,
        imageUrl: item.metadata?.image_url as string,
        pattern: item.metadata?.pattern_data
      }))
  );

  return (
    <div className="w-full" data-testid="stash-page-wrapper">
      <div className="mb-8 border-b border-white/10 pb-4">
        <Heading level="h1" className="text-2xl font-bold text-white mb-2">My Stash 💎</Heading>
        <Text className="text-gray-400">
          Your digital Kandi collection. Minted on the blockchain, worn on your wrist.
        </Text>
      </div>

      {stashItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 gap-4 glass rounded-xl border-dashed border-white/20">
           <div className="text-4xl">🕸️</div>
           <Text className="text-gray-300">Your stash is empty!</Text>
           <LocalizedClientLink href="/create">
             <button className="bg-white text-black px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform">
               Create Your First ✨
             </button>
           </LocalizedClientLink>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stashItems.map((item: any, index: number) => {
             
             // Build Remix Link
             let remixLink = "#";
             if (item.pattern) {
                const payload = JSON.stringify({
                    name: item.kandiName,
                    vibe: item.kandiVibe,
                    pattern: item.pattern
                });
                const encoded = btoa(encodeURIComponent(payload));
                remixLink = `/create?remix=${encoded}`;
             }

             return (
              <div key={item.id + index} className="glass rounded-xl overflow-hidden group hover:border-pink-500/50 transition-colors">
                {/* IMAGE AREA */}
                <div className="aspect-square bg-black/40 relative">
                    <Thumbnail 
                        thumbnail={item.imageUrl} 
                        size="full" 
                        className="object-cover w-full h-full"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                        <LocalizedClientLink href={remixLink}>
                            <button className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:scale-105 transition-transform flex items-center gap-1">
                                ↺ Remix Vibe
                            </button>
                        </LocalizedClientLink>
                    </div>
                </div>

                {/* INFO AREA */}
                <div className="p-5 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-white leading-tight">
                            {item.kandiName}
                        </h3>
                        <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/5">
                            #{item.orderId}
                        </span>
                    </div>
                    
                    <p className="text-sm italic text-gray-400 line-clamp-2">
                        "{item.kandiVibe}"
                    </p>

                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                            {new Date(item.orderDate).toLocaleDateString()}
                        </span>
                        
                        <div className="flex gap-2">
                           {/* Blockchain Badge */}
                           <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-full border border-cyan-500/20">
                              ● On-Chain
                           </span>
                        </div>
                    </div>
                </div>
              </div>
             )
          })}
        </div>
      )}
    </div>
  )
}