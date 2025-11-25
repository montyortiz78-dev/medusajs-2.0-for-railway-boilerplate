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
      // FORCE structured mode to ensure JSON
      mode: 'json',
      schema: z.object({
        kandiName: z.string().describe("A creative name for this bracelet"),
        vibeStory: z.string().describe("A short backstory about the vibe"),
        pattern: z.array(
          z.object({
            type: z.enum(["pony", "star", "heart", "skull", "flower"]),
            color: z.enum(["neon-pink", "neon-green", "electric-blue", "hot-orange", "bright-yellow", "purple", "black", "white", "glow-in-dark"]),
          })
        ).min(10).max(30).describe("An array of at least 10 bead objects representing the bracelet pattern."),
      }),
      prompt: `
        You are a Kandi bracelet designer.
        Create a unique bracelet design for the vibe: "${vibe}".
        
        CRITICAL JSON RULES:
        1. The 'pattern' field MUST be an array of objects, NOT strings.
        2. Each item in the array must look exactly like this: { "type": "pony", "color": "neon-pink" }
        3. Do NOT use colors outside this list: neon-pink, neon-green, electric-blue, hot-orange, bright-yellow, purple, black, white, glow-in-dark.
        4. Do NOT use types outside this list: pony, star, heart, skull, flower.
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