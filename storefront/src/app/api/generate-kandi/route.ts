import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { vibe } = await req.json();
    console.log(`🤖 Generating Kandi for: "${vibe}"...`);

    const result = await generateObject({
      model: openai('gpt-4o'), // 'gpt-4o-mini' is also a great, faster option here
      schema: z.object({
        kandiName: z.string().describe("A creative name for this bracelet"),
        vibeStory: z.string().describe("A short backstory about the vibe (max 1 sentence)"),
        designStrategy: z.enum(['alternating', 'striped', 'mirrored', 'random', 'solid']).describe("The structural pattern of the beads"),
        palette: z.array(z.string()).min(2).max(4).describe("The strict color palette used (2-4 colors max)"),
        // We use a structured object array instead of raw strings for better type safety
        beads: z.array(
          z.object({
            color: z.enum(['Pink', 'Green', 'Blue', 'Yellow', 'Orange', 'Purple', 'Red', 'White', 'Black', 'Cyan', 'Magenta', 'Lime']),
            type: z.literal('pony')
          })
        ).min(24).max(30).describe("The exact sequence of beads. Standard wrist size is ~26-28 beads."),
      }),
      prompt: `
        You are an expert Kandi (rave bracelet) designer. Design a bracelet based on this vibe: "${vibe}".
        
        ### DESIGN RULES:
        1. **Palette:** Select 2-4 distinct colors that match the vibe. (e.g., "Ocean" -> Blue, Cyan, White).
        2. **Structure:** Choose a pattern strategy:
           - *Alternating:* A-B-A-B or A-B-C-A-B-C
           - *Striped:* A-A-B-B or A-A-A-B-B-B
           - *Mirrored:* A-B-C-C-B-A (centered design)
           - *Solid:* Mostly one color with rare accents.
        3. **Length:** Generate exactly 26 to 28 beads for a standard fit.
        
        ### RESTRICTIONS:
        - Use ONLY standard opaque colors: Pink, Green, Blue, Yellow, Orange, Purple, Red, White, Black.
        - (Bonus) You may use Cyan, Magenta, or Lime if the vibe is "Neon" or "Cyber".
        - Use ONLY "pony" for the bead type.
        
        Ensure the pattern loops seamlessly if possible (the end connects to the start).
      `,
    });

    console.log(`✅ AI Generated: ${result.object.kandiName} (${result.object.designStrategy})`);
    
    return Response.json({
      kandiName: result.object.kandiName,
      vibeStory: result.object.vibeStory,
      // Pass the fully structured pattern to the frontend
      pattern: result.object.beads 
    });

  } catch (error: any) {
    console.error("❌ AI Error:", error);
    return Response.json({ error: "AI Generation Failed", details: error.message }, { status: 500 });
  }
}