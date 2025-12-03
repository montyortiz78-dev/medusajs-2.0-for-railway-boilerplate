import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { vibe } = await req.json();
    console.log(`🤖 Generating Kandi for: "${vibe}"...`);

    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: z.object({
        kandiName: z.string().describe("A creative name for this bracelet"),
        vibeStory: z.string().describe("A short backstory about the vibe"),
        // Simple string array "Color:Type"
        rawPattern: z.array(z.string()).min(3).max(30).describe("List of beads. Format: 'Color:Type'"),
      }),
      prompt: `
        Design a Kandi bracelet pattern based on this vibe: "${vibe}".
        
        RESTRICTIONS:
        1. Use ONLY these colors: Pink, Green, Blue, Yellow, Orange, Purple, Red, White, Black.
        2. Use ONLY "pony" for the bead type. Do NOT use special shapes like stars or skulls.
        
        Ensure the colors create a pleasing, repeating, or thematic pattern.
        RETURN ONLY JSON.
      `,
    });

    // Convert to object format
    const cleanPattern = result.object.rawPattern.map((item) => {
      const [color, type] = item.split(':');
      return { 
        color: color ? color.trim() : "Black", 
        type: "pony" // Force pony type
      };
    });

    console.log("✅ AI Success:", result.object.kandiName);
    
    return Response.json({
      kandiName: result.object.kandiName,
      vibeStory: result.object.vibeStory,
      pattern: cleanPattern
    });

  } catch (error: any) {
    console.error("❌ AI Error:", error);
    return Response.json({ error: "AI Generation Failed", details: error.message }, { status: 500 });
  }
}