'use server';

/**
 * @fileOverview AI-powered tool that suggests the water level in a tank.
 *
 * - suggestWaterLevel - A function that suggests the water level.
 * - SuggestWaterLevelInput - The input type for the suggestWaterLevel function.
 * - SuggestWaterLevelOutput - The return type for the suggestWaterLevel function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestWaterLevelInputSchema = z.object({
  duration: z.number().describe('The duration the pump was on in seconds.'),
  energyConsumed: z.number().describe('The energy consumed in kWh.'),
});
export type SuggestWaterLevelInput = z.infer<typeof SuggestWaterLevelInputSchema>;

const SuggestWaterLevelOutputSchema = z.object({
  predictedLevel: z.number().describe('The predicted water level as a percentage (0-100).'),
  reasoning: z.string().describe('Explanation for the prediction.'),
});
export type SuggestWaterLevelOutput = z.infer<typeof SuggestWaterLevelOutputSchema>;


export async function suggestWaterLevel(input: SuggestWaterLevelInput): Promise<SuggestWaterLevelOutput> {
    return suggestWaterLevelFlow(input);
}


const suggestWaterLevelFlow = ai.defineFlow(
  {
    name: 'suggestWaterLevelFlow',
    inputSchema: SuggestWaterLevelInputSchema,
    outputSchema: SuggestWaterLevelOutputSchema,
  },
  async (input) => {
    // This is a placeholder. A real model would be trained on historical data.
    // For now, we'll use a simple heuristic.
    let predictedLevel = 50; // Default prediction
    if (input.duration > 3600) { // Over an hour
        predictedLevel = 75;
    }
    if (input.duration > 7200) { // Over 2 hours
        predictedLevel = 85;
    }
     if (input.energyConsumed > 5) {
        predictedLevel = Math.min(100, predictedLevel + 10);
     }
    return {
        predictedLevel,
        reasoning: "Prediction is based on a simple heuristic of pump duration and energy usage. This will improve as more data is collected."
    }
  }
);
