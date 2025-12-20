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
      // 1. Higher temperature = More creativity (less "A-B-A-B" patterns)
      temperature: 0.8,
      schema: z.object({
        kandiName: z.string().describe("A creative name for this bracelet"),
        vibeStory: z.string().describe("A short, fun backstory about why these colors match the vibe"),
        // We use a simple string array for the raw pattern to make it easier for the AI to generate
        rawPattern: z.array(z.string()).min(12).max(30).describe("List of beads. Format: 'Color:Type'"),
      }),
      // 2. Refined Prompt for Variety & Complexity
      prompt: `
        You are an expert Kandi artist known for unique, non-boring designs. 
        Design a bracelet pattern based on this user vibe: "${vibe || "Random Surprise"}".

        RESTRICTIONS:
        - COLORS: Pink, Green, Blue, Yellow, Orange, Purple, Red, White, Black, Clear, Gray, Brown.
        - TYPE: Always use "pony".

        DESIGN RULES (To ensure variety):
        1. INTERPRETATION:
           - If the vibe is specific (e.g., "Bumblebee"), use literal colors (Yellow, Black).
           - If the vibe is abstract (e.g., "Rave", "Chill"), use color psychology.
           - If the vibe is "Random", go wild with an eclectic mix.
           - **COLOR PREFERENCE: PRIORITIZE BRIGHT COLORS (Pink, Green, Blue, Yellow, Purple, Orange). Use Black, Gray, or Brown SPARINGLY and ONLY if the vibe explicitly demands it (e.g. "Goth", "Dark", "Space", "Halloween"). Do not use Black as a filler color.**

        2. PATTERN STYLE (Avoid simple A-B-A-B):
           - Use complex repeating units (e.g., A-A-B-C-A-A).
           - Try symmetry (A-B-C-C-B-A).
           - Use color blocking (3 Blue, 3 Pink) or gradients.
           - Create a "feature section" in the middle of the bracelet.

        3. OUTPUT:
           - Generate a pattern length of 18-26 beads.
           - Return the rawPattern as an array of strings like "Red:pony".
      `,
    });

    // 3. Clean up the output for the frontend
    const cleanPattern = result.object.rawPattern.map((item) => {
      // Robust splitting to handle "Red:pony" or just "Red"
      const parts = item.split(':');
      // FIX: Changed default fallback from "Black" to "Pink" to avoid accidental dark beads
      const colorName = parts[0] ? parts[0].trim() : "Pink";
      
      return { 
        color: colorName, 
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