import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

// Allow the AI up to 60 seconds to think
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { vibe } = await req.json();
    console.log(`🤖 OpenAI generating Kandi for: "${vibe}"...`);

    const result = await generateObject({
      model: openai('gpt-4o'),
      mode: 'json',
      schema: z.object({
        kandiName: z.string().describe("A creative name for this bracelet"),
        vibeStory: z.string().describe("A short backstory about the vibe"),
        pattern: z.array(
          z.object({
            type: z.enum(["pony", "star", "heart", "skull", "flower"]),
            color: z.enum(["neon-pink", "neon-green", "electric-blue", "hot-orange", "bright-yellow", "purple", "black", "white", "glow-in-dark"]),
          })
        )
        // CRITICAL FIX: Lower the minimum to 5 so the app doesn't crash
        // if the AI creates a short bracelet (e.g. 9 beads).
        .min(5).max(35).describe("An array of beads representing the bracelet pattern."),
      }),
      prompt: `
        You are a Kandi bracelet designer.
        Create a unique bracelet design for the vibe: "${vibe}".
        
        CRITICAL INSTRUCTIONS:
        1. You MUST generate a 'pattern' array with AT LEAST 20 beads.
        2. Use a variety of colors from the allowed list.
        3. Do NOT return an empty pattern.
      `,
    });

    console.log("✅ AI Success:", result.object.kandiName);
    return Response.json(result.object);

  } catch (error: any) {
    console.error("❌ AI Error:", error);
    return Response.json({ 
      error: "AI Generation Failed", 
      details: error.message 
    }, { status: 500 });
  }
}