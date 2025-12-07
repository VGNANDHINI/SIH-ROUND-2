
'use server';
/**
 * @fileOverview An AI-powered tool to predict the location of a water leak from a photo.
 *
 * - predictLeakLocation - A function that analyzes an image to predict a location.
 * - PredictLeakLocationInput - The input type for the function.
 * - PredictLeakLocationOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const PredictLeakLocationInputSchema = z.object({
  photoDataUri: z.string().describe(
    "A photo of a potential water leak, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type PredictLeakLocationInput = z.infer<typeof PredictLeakLocationInputSchema>;

const PredictLeakLocationOutputSchema = z.object({
  predictedLocation: z.string().describe(
    'The predicted location of the leak, including any identifiable landmarks, street names, or asset tags visible in the photo.'
  ),
  confidence: z.enum(['High', 'Medium', 'Low']).describe(
      'The confidence level of the prediction.'
  ),
  reasoning: z.string().describe(
    'A brief explanation of how the location was determined from the visual evidence.'
  ),
});
export type PredictLeakLocationOutput = z.infer<typeof PredictLeakLocationOutputSchema>;

export async function predictLeakLocation(
  input: PredictLeakLocationInput
): Promise<PredictLeakLocationOutput> {
  const prompt = ai.definePrompt({
    name: 'predictLeakLocationPrompt',
    input: { schema: PredictLeakLocationInputSchema },
    output: { schema: PredictLeakLocationOutputSchema },
    prompt: `You are an expert location analyst for a rural water supply system. Your task is to identify the location of a water leak based on a photo provided by a village resident.

Analyze the image provided and identify any landmarks, street signs, house numbers, unique buildings, specific types of trees, or any other visual cues that can help pinpoint the location within a rural Indian village context.

- Examine the background for any text on walls, shop signs, or vehicle number plates.
- Look for distinct architectural features or known public assets (e.g., a specific temple, a school building, a community hall).
- Use the visual information to provide a textual description of the most likely location.
- State your confidence in the prediction (High, Medium, or Low).
- Provide brief reasoning based on the visual evidence.

Example Output:
{
  "predictedLocation": "Outside house number 42, near the old Banyan tree on Station Road.",
  "confidence": "High",
  "reasoning": "The house number '42' is clearly visible on the gate pillar, and the distinctive Banyan tree is a known landmark on Station Road in this village."
}

Photo to analyze: {{media url=photoDataUri}}
`,
  });

  const flow = ai.defineFlow(
    {
      name: 'predictLeakLocationFlow',
      inputSchema: PredictLeakLocationInputSchema,
      outputSchema: PredictLeakLocationOutputSchema,
    },
    async (input) => {
      const { output } = await prompt(input);
      return output!;
    }
  );

  return flow(input);
}
