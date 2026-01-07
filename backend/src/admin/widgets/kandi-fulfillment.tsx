import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, StatusBadge, Badge } from "@medusajs/ui"
import { AdminOrder } from "@medusajs/types"

// 1. Expanded Color Map (Case Insensitive keys for safety)
const COLOR_MAP: Record<string, string> = {
  "neon-pink": "#FF00CC", "neon-green": "#39FF14", "electric-blue": "#00FFFF",
  "hot-orange": "#FF5F1F", "bright-purple": "#B026FF", "red": "#FF0000",
  "white": "#FFFFFF", "black": "#000000", "yellow": "#FFFF00",
  "pink": "#FF00CC", "green": "#39FF14", "blue": "#00FFFF",
  "orange": "#FF5F1F", "purple": "#B026FF"
}

// 2. Helper to resolve color
const resolveColor = (bead: any): string => {
    if (!bead) return "#eeeeee" // Default empty gray

    // Handle Object format (e.g. { color: "#..." })
    if (typeof bead === 'object') {
        return resolveColor(bead.color || bead.value || bead.hex)
    }

    const val = String(bead).trim()

    // A. Is it a Hex Code? (starts with #) -> Use directly
    if (val.startsWith("#")) {
        return val
    }

    // B. Is it in our map? (Try Lowercase)
    const lowerKey = val.toLowerCase()
    if (COLOR_MAP[lowerKey]) {
        return COLOR_MAP[lowerKey]
    }

    // C. Fallback: Assume it's a valid CSS name (e.g. "red") or return gray if failing
    return val
}

// FIXED: Removed incorrect 'DetailWidgetProps' import and typed props inline
const KandiFulfillmentWidget = ({ 
  data: order 
}: { data: AdminOrder }) => {
  
  // Filter for Kandi Items
  const kandiItems = order.items.filter(item => 
    item.metadata?.kandi_name || item.metadata?.pattern_data
  )

  if (kandiItems.length === 0) {
    return null
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">🔮 Kandi Fulfillment Guide</Heading>
        <StatusBadge color="blue">Custom Order</StatusBadge>
      </div>

      {kandiItems.map((item) => {
        const pattern = (item.metadata?.pattern_data as any[]) || []
        const name = (item.metadata?.kandi_name as string) || item.title
        const vibe = (item.metadata?.kandi_vibe as string) || "No vibe provided"
        const rows = (item.metadata?.rows as number) || 1
        const stitch = (item.metadata?.stitch as string) || "Ladder"

        return (
            <div key={item.id} className="px-6 py-4 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div>
                        <Text weight="plus" size="large">{name}</Text>
                        <Text className="text-ui-fg-subtle text-sm italic">"{vibe}"</Text>
                        <div className="flex gap-2 mt-2">
                            <Badge size="small">{rows} Row(s)</Badge>
                            <Badge size="small" color="purple">{stitch} Stitch</Badge>
                            <Badge size="small" color="green">{pattern.length} Beads</Badge>
                        </div>
                    </div>
                    {item.thumbnail && (
                        <img 
                            src={item.metadata?.image_url as string || item.thumbnail} 
                            alt="Preview" 
                            className="w-16 h-16 rounded-lg border border-gray-200 object-cover"
                        />
                    )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <Text className="text-xs text-ui-fg-muted mb-2 uppercase font-semibold tracking-wider">
                        Bead Pattern Sequence (Left to Right)
                    </Text>
                    
                    {/* Bead Grid */}
                    <div className="flex flex-wrap gap-2">
                        {pattern.map((bead, i) => {
                            const beadColor = resolveColor(bead)
                            return (
                                <div 
                                    key={i}
                                    className="group relative w-8 h-8 rounded-full border border-gray-300 shadow-sm flex-shrink-0 transition-transform hover:scale-110"
                                    style={{ backgroundColor: beadColor }}
                                    title={`Bead ${i + 1}: ${beadColor}`}
                                >
                                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] bg-black text-white px-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                                        {i + 1}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
      })}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.after",
})

export default KandiFulfillmentWidget