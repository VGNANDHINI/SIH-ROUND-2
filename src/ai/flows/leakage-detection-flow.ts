
'use server';

/**
 * @fileOverview An AI-powered diagnostic system for detecting leakages in rural water networks.
 *
 * - detectLeakage - A function that analyzes water network data to detect leakages.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const LeakageDetectionInputSchema = z.object({
  pressure_value: z.number().describe('Current pressure value in PSI.'),
  pressure_baseline: z.number().describe('Nominal/baseline pressure value in PSI.'),
  flow_rate: z.number().describe('Current flow rate in LPM.'),
  flow_baseline: z.number().describe('Baseline flow rate in LPM.'),
  reservoir_drop_rate: z.number().describe('Reservoir drop rate in liters/hour.'),
  expected_drop_rate: z.number().describe('Expected reservoir drop rate in liters/hour.'),
  complaints_count: z.number().int().describe('Number of complaints in the area in the last 24h.'),
  past_leak_history: z.boolean().describe('Whether there is a history of leaks in the area.'),
  tail_end_pressure: z.number().describe('Pressure at the tail-end of the network in bar.'),
  is_critical_zone: z.boolean().describe('Whether the affected zone is a critical supply area (hospital, school).'),
});
export type LeakageDetectionInput = z.infer<typeof LeakageDetectionInputSchema>;

export const LeakageDetectionOutputSchema = z.object({
  leak_score: z.number().describe('A score from 0 to 1 indicating the likelihood of a leak.'),
  leakage_status: z.enum(['LOW', 'MEDIUM', 'HIGH']).describe('The determined status of the leakage.'),
  triggered_rules: z.array(z.string()).describe('A list of rules that were triggered to determine the score.'),
  reasoning: z.string().describe('Simple reasoning for the diagnosis.'),
  recommended_actions: z.string().describe('Simple recommended actions for the operator.'),
});
export type LeakageDetectionOutput = z.infer<typeof LeakageDetectionOutputSchema>;


export async function detectLeakage(
  input: LeakageDetectionInput
): Promise<LeakageDetectionOutput> {
  return leakageDetectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'leakageDetectionPrompt',
  input: { schema: LeakageDetectionInputSchema },
  output: { schema: LeakageDetectionOutputSchema },
  prompt: `You are an expert system designed to implement an intelligent Leakage Detection Feature for rural piped-water systems. 
Your job is to analyze incoming telemetry data, operator inputs, and complaint trends to determine whether a leakage is present.
You must strictly evaluate only the provided values and never invent data.

Analyze the following data:
- Current Pressure: {{{pressure_value}}} PSI (Baseline: {{{pressure_baseline}}} PSI)
- Current Flow: {{{flow_rate}}} LPM (Baseline: {{{flow_baseline}}} LPM)
- Reservoir Drop Rate: {{{reservoir_drop_rate}}} L/hr (Expected: {{{expected_drop_rate}}} L/hr)
- 24h Complaint Count: {{{complaints_count}}}
- Past Leak History: {{{past_leak_history}}}
- Tail-end Pressure: {{{tail_end_pressure}}} bar
- Is Critical Zone: {{{is_critical_zone}}}

Apply the following rule engine to calculate a 'leak_score':
1.  **Pressure–Flow Rule**: If current pressure drops at least 25% below the baseline, AND flow increases at least 30% above baseline, add +0.5 to leak_score.
2.  **Reservoir Drop Rule**: If the reservoir drop rate exceeds (expected drop rate × 1.5), add +0.4 to leak_score.
3.  **Complaint Clustering Rule**: If complaint count > 3, add +0.3 to leak_score.
4.  **Past History Rule**: If past_leak_history is true AND current pressure is below baseline, add a strong weight of +0.2 to leak_score.
5.  **Tail-End Pressure Rule**: If tail-end pressure < 0.5 bar while upstream pressure is normal (pressure_value >= pressure_baseline), add +0.3 to leak_score (indicates localized leak).
6.  **Critical Zone Rule**: If the zone is critical and any leak is suspected (initial score > 0), add +0.2 weight.

Calculate the final leak_score (capped at 1.0) and determine the leakage_status:
- score >= 0.8 -> HIGH
- 0.5 <= score < 0.8 -> MEDIUM
- score < 0.5 -> LOW

Also list which rules were triggered.

Provide a simple 'reasoning' paragraph for the operator and 'recommended_actions' as a short, actionable list.

Example Reasoning: "Pressure is low and flow is high, which usually indicates leakage in the line. The high number of recent complaints supports this."
Example Actions: "- Check the line from standpost 3 to Ward 2.\n- Inspect for sewage ingress near the culvert."

Output ONLY the final, valid JSON object with the fields: leak_score, leakage_status, triggered_rules, reasoning, recommended_actions.
`,
});

const leakageDetectionFlow = ai.defineFlow(
  {
    name: 'leakageDetectionFlow',
    inputSchema: LeakageDetectionInputSchema,
    outputSchema: LeakageDetectionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
