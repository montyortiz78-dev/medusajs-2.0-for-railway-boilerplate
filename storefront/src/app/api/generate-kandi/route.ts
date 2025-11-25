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
      // Define a simpler schema that LLMs find easier to follow
      schema: z.object({
        kandiName: z.string().describe("A creative name for this bracelet"),
        vibeStory: z.string().describe("A short backstory about the vibe"),
        // We ask for simple strings like "neon-pink:pony" to reduce JSON complexity errors
        rawPattern: z.array(z.string()).min(3).max(35).describe("List of beads in format 'COLOR:TYPE'. Example: ['neon-pink:pony', 'black:skull']"),
      }),
      prompt: `
        Design a Kandi bracelet for the vibe: "${vibe}".
        
        Valid Colors: neon-pink, neon-green, electric-blue, hot-orange, bright-yellow, purple, black, white, glow-in-dark, silver, gold.
        Valid Types: pony, star, heart, skull, flower.

        RETURN ONLY JSON.
      `,
    });

    // Manually convert the simple string array back to objects for your frontend
    const cleanPattern = result.object.rawPattern.map((item) => {
      const [color, type] = item.split(':');
      return { 
        color: color ? color.trim() : "black", 
        type: type ? type.trim() : "pony" 
      };
    });

    console.log("✅ AI Success:", result.object.kandiName);
    
    // Send the formatted object back to the frontend
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