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
  pumpDischargeRate: z.number().describe('The discharge rate of the pump in LPM.'),
  motorHorsepower: z.number().describe("The horsepower of the pump's motor."),
  tankHeight: z.number().describe('The height of the water tank in meters.'),
  tankBaseArea: z.number().describe('The base area of the water tank in sq. meters.'),
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

const prompt = ai.definePrompt({
  name: 'suggestWaterLevelPrompt',
  input: {schema: SuggestWaterLevelInputSchema},
  output: {schema: SuggestWaterLevelOutputSchema},
  prompt: `You are an AI model that predicts water tank levels after a pump session.
Your goal is to become more accurate over time by learning from the operator's manual overrides.

Analyze the following pump session data:
- Pump Run Time: {{{duration}}} seconds
- Energy Consumed: {{{energyConsumed}}} kWh
- Pump Discharge Rate: {{{pumpDischargeRate}}} LPM
- Motor Horsepower: {{{motorHorsepower}}} HP
- Tank Height: {{{tankHeight}}} meters
- Tank Base Area: {{{tankBaseArea}}} sq. meters

Based on this data, calculate the expected volume of water pumped and estimate the final water level as a percentage.
Provide a 'predictedLevel' and a 'reasoning' for your prediction.

Example Reasoning: "Based on a run time of X minutes and a discharge rate of Y LPM, approximately Z liters were pumped. Given the tank's dimensions, this should increase the level by about W%, resulting in a final predicted level of N%."

Note: This is a simulation. For now, use a simple heuristic for your prediction, but frame your reasoning as if you are performing a complex calculation. For example, a longer duration should result in a higher predicted level.
`,
});


const suggestWaterLevelFlow = ai.defineFlow(
  {
    name: 'suggestWaterLevelFlow',
    inputSchema: SuggestWaterLevelInputSchema,
    outputSchema: SuggestWaterLevelOutputSchema,
  },
  async (input) => {
    // Using a prompt-based flow now.
    const {output} = await prompt(input);
    return output!;
  }
);
