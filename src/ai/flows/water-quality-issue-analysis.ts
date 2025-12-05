'use server';

/**
 * @fileOverview AI-powered tool that analyzes water quality issues.
 *
 * - analyzeWaterQualityIssue - A function that suggests potential causes and actions.
 * - AnalyzeWaterQualityInput - The input type for the function.
 * - AnalyzeWaterQualityOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeWaterQualityInputSchema = z.object({
  anomalies: z.string().describe("A description of the specific issue observed, e.g., 'Water has a yellow tint'."),
  historicalData: z.string().describe("Normal operating ranges and historical context, e.g., 'Normal pH is 7.2-7.6'."),
  externalFactors: z.string().describe("Any external factors that might be relevant, e.g., 'heavy rainfall'."),
});
export type AnalyzeWaterQualityInput = z.infer<typeof AnalyzeWaterQualityInputSchema>;

const AnalyzeWaterQualityOutputSchema = z.object({
  potentialCauses: z.string().describe('A bulleted list of the most likely causes for the observed anomalies, ordered by probability.'),
  suggestedActions: z.string().describe('A numbered list of actionable steps to diagnose and resolve the issue, including immediate safety precautions.'),
});
export type AnalyzeWaterQualityOutput = z.infer<typeof AnalyzeWaterQualityOutputSchema>;

export async function analyzeWaterQualityIssue(
  input: AnalyzeWaterQualityInput
): Promise<AnalyzeWaterQualityOutput> {
  return analyzeWaterQualityIssueFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeWaterQualityIssuePrompt',
  input: { schema: AnalyzeWaterQualityInputSchema },
  output: { schema: AnalyzeWaterQualityOutputSchema },
  prompt: `You are an expert water quality analyst for the Jal Jeevan Mission in India. Your task is to diagnose water quality problems based on field observations.

Analyze the following information to identify potential causes and suggest corrective actions.

1.  **Observed Anomalies:**
    {{{anomalies}}}

2.  **Historical & Normal Data:**
    {{{historicalData}}}

3.  **External Factors:**
    {{{externalFactors}}}

Based on this, provide a concise analysis.

-   **Potential Causes:** List the most likely causes as a bulleted list. Consider the interplay between the external factors and the anomalies.
-   **Suggested Actions:** Provide a clear, numbered list of steps. Start with immediate safety actions (like issuing a 'boil water' advisory), then diagnostic steps (like taking a sample from a different point), and finally potential long-term fixes.
`,
});

const analyzeWaterQualityIssueFlow = ai.defineFlow(
  {
    name: 'analyzeWaterQualityIssueFlow',
    inputSchema: AnalyzeWaterQualityInputSchema,
    outputSchema: AnalyzeWaterQualityOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
