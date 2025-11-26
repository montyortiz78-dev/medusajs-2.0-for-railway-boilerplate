import { listCustomerOrders } from "@lib/data/orders"
import { Container, Heading, Text } from "@medusajs/ui"
import Thumbnail from "@modules/products/components/thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { notFound } from "next/navigation"

export default async function StashPage() {
  const orders = await listCustomerOrders()

  if (!orders) {
    notFound()
  }

  // 1. EXTRACT ALL KANDI ITEMS FROM ALL ORDERS
  // We flatten the list so we have one big array of bracelets
  const stashItems = orders.flatMap(order => 
    order.items.filter(item => item.metadata && item.metadata.kandi_name)
      .map(item => ({
        ...item,
        // Helper to grab the original order date/id
        orderDate: order.created_at,
        orderId: order.display_id,
        // Extract Kandi Data
        kandiName: item.metadata?.kandi_name as string,
        kandiVibe: item.metadata?.kandi_vibe as string,
        imageUrl: item.metadata?.image_url as string,
        pattern: item.metadata?.pattern_data
      }))
  );

  return (
    <div className="mb-8 flex flex-col gap-y-4" data-testid="stash-page-wrapper">
      <div className="mb-6">
        <Heading level="h1" className="mb-2">My Stash 💎</Heading>
        <Text className="text-ui-fg-subtle">
          Your collection of Phygital Kandi. These exist on the blockchain and on your wrist.
        </Text>
      </div>

      {stashItems.length === 0 ? (
        <Container className="flex flex-col items-center justify-center p-12 gap-4">
           <Text>You haven't collected any Kandi yet!</Text>
           <LocalizedClientLink href="/create">
             <button className="bg-black text-white px-6 py-2 rounded-full font-bold">
               Create Your First ✨
             </button>
           </LocalizedClientLink>
        </Container>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stashItems.map((item, index) => {
             
             // Build Remix Link logic
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
              <Container key={item.id + index} className="p-0 overflow-hidden flex flex-col group">
                {/* IMAGE AREA */}
                <div className="aspect-square bg-gray-100 relative">
                    <Thumbnail 
                        thumbnail={item.imageUrl} 
                        size="full" 
                        className="object-cover w-full h-full"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <LocalizedClientLink href={remixLink}>
                            <button className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:scale-105 transition-transform">
                                Remix ↺
                            </button>
                        </LocalizedClientLink>
                    </div>
                </div>

                {/* INFO AREA */}
                <div className="p-6 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                        <Heading level="h3" className="text-lg font-bold">
                            {item.kandiName}
                        </Heading>
                        <Text className="text-xs text-ui-fg-muted bg-gray-100 px-2 py-1 rounded">
                            #{item.orderId}
                        </Text>
                    </div>
                    
                    <Text className="text-sm italic text-ui-fg-subtle line-clamp-2">
                        "{item.kandiVibe}"
                    </Text>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                        <Text className="text-xs text-ui-fg-muted">
                            {new Date(item.orderDate).toLocaleDateString()}
                        </Text>
                        
                        {/* Note: To link to the specific NFT on Crossmint, 
                           we would need to store the NFT ID in metadata during minting.
                           For now, we simulate the 'Digital' status.
                        */}
                        <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                            ● Minted
                        </span>
                    </div>
                </div>
              </Container>
             )
          })}
        </div>
      )}
    </div>
  )
}