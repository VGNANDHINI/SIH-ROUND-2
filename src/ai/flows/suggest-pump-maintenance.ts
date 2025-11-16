'use server';

/**
 * @fileOverview AI-powered tool that suggests optimal maintenance schedules for water pumps.
 *
 * - suggestPumpMaintenance - A function that suggests maintenance schedules for water pumps.
 * - SuggestPumpMaintenanceInput - The input type for the suggestPumpMaintenance function.
 * - SuggestPumpMaintenanceOutput - The return type for the suggestPumpMaintenance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPumpMaintenanceInputSchema = z.object({
  lastServiceDate: z
    .string()
    .describe('The date when the pump was last serviced (YYYY-MM-DD).'),
  failureRate: z
    .number()
    .describe(
      'The failure rate of the pump, expressed as a number between 0 and 1.'
    ),
  operatingHours: z
    .number()
    .describe('The number of hours the pump operates per day.'),
  pumpType: z.string().describe('The type of water pump.'),
  location: z.string().describe('The location of the water pump.'),
});
export type SuggestPumpMaintenanceInput = z.infer<typeof SuggestPumpMaintenanceInputSchema>;

const SuggestPumpMaintenanceOutputSchema = z.object({
  suggestedMaintenanceSchedule: z.string().describe(
    'A suggested maintenance schedule for the water pump, including specific tasks and their recommended frequency.'
  ),
  reasoning: z
    .string()
    .describe(
      'Explanation for the suggested maintenance schedule, including how the input factors influenced the recommendation.'
    ),
});
export type SuggestPumpMaintenanceOutput = z.infer<typeof SuggestPumpMaintenanceOutputSchema>;

export async function suggestPumpMaintenance(
  input: SuggestPumpMaintenanceInput
): Promise<SuggestPumpMaintenanceOutput> {
  return suggestPumpMaintenanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPumpMaintenancePrompt',
  input: {schema: SuggestPumpMaintenanceInputSchema},
  output: {schema: SuggestPumpMaintenanceOutputSchema},
  prompt: `You are an expert in water pump maintenance.

Based on the last service date, failure rate, operating hours, pump type, and location, suggest an optimal maintenance schedule for the water pump.

Last Service Date: {{{lastServiceDate}}}
Failure Rate: {{{failureRate}}}
Operating Hours: {{{operatingHours}}}
Pump Type: {{{pumpType}}}
Location: {{{location}}}

Consider all these factors when determining the maintenance schedule. Include specific tasks and their recommended frequency. Also, explain the reasoning behind the schedule. Focus on preventative maintenance to avoid pump failures.
`,
});

const suggestPumpMaintenanceFlow = ai.defineFlow(
  {
    name: 'suggestPumpMaintenanceFlow',
    inputSchema: SuggestPumpMaintenanceInputSchema,
    outputSchema: SuggestPumpMaintenanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
