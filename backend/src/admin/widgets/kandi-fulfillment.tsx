import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, StatusBadge, Badge } from "@medusajs/ui"
import { DetailWidgetProps } from "@medusajs/admin-sdk"
import { AdminOrder } from "@medusajs/types"

// Mapping colors to visible CSS styles
const COLOR_MAP: Record<string, string> = {
  "neon-pink": "#FF00CC", "neon-green": "#39FF14", "electric-blue": "#00FFFF",
  "hot-orange": "#FF5E00", "bright-yellow": "#FFFF00", "purple": "#9D00FF",
  "black": "#111111", "white": "#F0F0F0", "glow-in-dark": "#E0FFD1",
  "silver": "#C0C0C0", "gold": "#FFD700"
};

// Mapping shapes to emojis for easy reading
const SHAPE_MAP: Record<string, string> = {
  "pony": "", // Standard bead, no emoji
  "star": "⭐",
  "heart": "❤️",
  "skull": "💀",
  "flower": "🌸"
};

const KandiFulfillmentWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const order = data

  // Filter for items that actually have Kandi data
  const kandiItems = order.items?.filter(
    (item) => item.metadata && item.metadata.pattern_data
  ) || []

  if (kandiItems.length === 0) {
    return null 
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">✨ Kandi Fulfillment Guide</Heading>
        <StatusBadge color="blue">Custom Order</StatusBadge>
      </div>

      {kandiItems.map((item) => {
        const pattern = item.metadata?.pattern_data as any[] || [];
        const vibe = item.metadata?.kandi_vibe as string;
        const name = item.metadata?.kandi_name as string;

        return (
          <div key={item.id} className="px-6 py-4">
            <div className="flex flex-col gap-2 mb-4">
              <Text className="font-bold text-ui-fg-base text-lg">
                {name || "Untitled Kandi"}
              </Text>
              <Text className="text-ui-fg-subtle italic text-sm">
                Vibe: "{vibe}"
              </Text>
              <div className="flex gap-2 mt-1">
                 <Badge size="small">Qty: {item.quantity}</Badge>
                 <Badge size="small">{pattern.length} Beads</Badge>
              </div>
            </div>

            {/* THE VISUAL PATTERN GUIDE */}
            <div className="bg-ui-bg-subtle p-4 rounded-lg border border-ui-border-base overflow-x-auto">
              <div className="flex items-center gap-1 min-w-max">
                <Text className="text-xs uppercase mr-2 text-ui-fg-muted font-bold">START →</Text>
                
                {pattern.map((bead, index) => (
                  <div key={index} className="flex flex-col items-center gap-1">
                    {/* The Visual Bead */}
                    <div 
                      className="w-8 h-8 rounded-full border border-gray-300 shadow-sm flex items-center justify-center text-xs"
                      style={{ 
                        backgroundColor: COLOR_MAP[bead.color] || '#ccc',
                        borderColor: ['white', 'glow-in-dark', 'silver'].includes(bead.color) ? '#999' : 'transparent'
                      }}
                      title={`${bead.color} ${bead.type}`}
                    >
                      {/* Show Emoji if it's a special shape */}
                      <span>{SHAPE_MAP[bead.type] || ""}</span>
                    </div>
                    
                    {/* The Number (every 5 beads to help counting) */}
                    {(index + 1) % 5 === 0 && (
                        <span className="text-[10px] text-gray-400">{index + 1}</span>
                    )}
                  </div>
                ))}

                <Text className="text-xs uppercase ml-2 text-ui-fg-muted font-bold">→ END</Text>
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