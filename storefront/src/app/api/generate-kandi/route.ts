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
      // 1. Increase temperature (0.0 is boring, 1.0 is chaotic). 0.8 is good for creative variety.
      temperature: 0.8, 
      schema: z.object({
        kandiName: z.string().describe("A creative name for this bracelet"),
        vibeStory: z.string().describe("A short, fun backstory about why these colors match the vibe"),
        rawPattern: z.array(z.string()).min(12).max(30).describe("List of beads. Format: 'Color:Type'"),
      }),
      // 2. Enhanced Prompt for Variety
      prompt: `
        You are an expert Kandi artist known for unique, non-boring designs. 
        Design a bracelet pattern based on this user vibe: "${vibe || "Random Surprise"}".

        RESTRICTIONS:
        - COLORS: Pink, Green, Blue, Yellow, Orange, Purple, Red, White, Black.
        - TYPE: Always use "pony".

        DESIGN RULES (To ensure variety):
        1. INTERPRETATION:
           - If the vibe is a specific object (e.g., "Bumblebee"), use literal colors (Yellow, Black).
           - If the vibe is abstract (e.g., "Rave", "Chill"), use color psychology.
           - If the vibe is "Random", go wild with a colorful, eclectic mix.

        2. PATTERN STYLE (Do not just do A-B-A-B):
           - Mix it up! Use complex repeating units, symmetry (A-B-C-B-A), color blocks (3 Blue, 3 Pink), or gradients.
           - Avoid simple alternating colors unless the vibe specifically calls for it.

        3. OUTPUT:
           - Generate a pattern length of 18-30 beads.
           - Return the rawPattern as an array of strings like "Red:pony".
      `,
    });

    const cleanPattern = result.object.rawPattern.map((item) => {
      const [color] = item.split(':');
      return { 
        color: color ? color.trim() : "Black", 
        type: "pony" 
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