
'use server';
/**
 * @fileOverview An AI-powered diagnostic system for rural water networks.
 *
 * - diagnoseWaterNetwork - A function that analyzes water network data.
 */

import { ai } from '@/ai/genkit';
import { DiagnoseWaterNetworkInputSchema, DiagnoseWaterNetworkOutputSchema, type DiagnoseWaterNetworkInput, type DiagnoseWaterNetworkOutput } from './diagnose-water-network.types';


export async function diagnoseWaterNetwork(
  input: DiagnoseWaterNetworkInput
): Promise<DiagnoseWaterNetworkOutput> {
  return diagnoseWaterNetworkFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnoseWaterNetworkPrompt',
  input: { schema: DiagnoseWaterNetworkInputSchema },
  output: { schema: DiagnoseWaterNetworkOutputSchema },
  prompt: `You are an expert Water Network Diagnostic System for rural piped water supply.
Your job is to analyze manually entered data from village/GP operators and determine:

1. Whether the water condition is NORMAL or LEAKAGE.
2. Whether sewage contamination is PRESENT, SUSPECTED, or NOT_PRESENT.
3. Whether pressure is LOW, HIGH, or NORMAL.
4. Give simple reasoning and recommended actions.
5. Always output clean JSON.

The operator will manually enter the following fields:
- pressure_value (in PSI or bar): {{{pressure_value}}}
- flow_rate (manual meter reading): {{{flow_rate}}}
- chlorine_level (ppm): {{{chlorine_level}}}
- turbidity_level (NTU): {{{turbidity_level}}}
- reservoir_drop_rate (liters/hour): {{{reservoir_drop_rate}}}
- pump_status (running / stopped): {{{pump_status}}}
- complaints_count (number of complaints in the area): {{{complaints_count}}}
- complaint_types: {{jsonStringify complaint_types}}
- sewage_line_nearby (true / false): {{{sewage_line_nearby}}}
- past_leak_history (yes / no): {{{past_leak_history}}}

===========================
LOGIC TO APPLY
===========================

A. LEAKAGE DETECTION LOGIC:
- If pressure_value is lower than normal AND flow_rate is higher → possible leakage.
- If reservoir_drop_rate is unusually high → possible leakage.
- If complaints_count > 3 in the same zone → leakage probability increases.
- If past_leak_history = "yes" AND low pressure appears again → high probability of leakage.

B. SEWAGE CONTAMINATION DETECTION:
- If complaint_types includes “bad smell”, “dirty water”, “brown water” AND sewage_line_nearby = true → contamination likely. Use PRESENT.
- If turbidity_level > safe limit (e.g., > 5 NTU) → contamination suspected. Use SUSPECTED.
- If chlorine_level is below safe limit (e.g., < 0.2 ppm) → contamination risk increases. Use SUSPECTED.
- If multiple contamination indicators appear together → high contamination probability. Use PRESENT.
- Otherwise, use NOT_PRESENT.

C. PRESSURE STATUS:
- Assume normal pressure is between 10-30 PSI (0.7-2.1 bar).
- If pressure_value < 10 PSI → LOW.
- If pressure_value > 30 PSI → HIGH.
- If within normal range → NORMAL.

D. FINAL OUTPUT FORMAT:
Always respond in the valid JSON structure defined in the output schema.

E. RULES:
- Do NOT assume automated sensors. The operator manually enters all values.
- Use only the data given; do not invent values.
- Keep reasoning simple and easy for rural operators to understand.
- If data is conflicting, choose the safest path (e.g., warn if in doubt).
- Output ONLY valid JSON. Nothing else.
`,
});

const diagnoseWaterNetworkFlow = ai.defineFlow(
  {
    name: 'diagnoseWaterNetworkFlow',
    inputSchema: DiagnoseWaterNetworkInputSchema,
    outputSchema: DiagnoseWaterNetworkOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
