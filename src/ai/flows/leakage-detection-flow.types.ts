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
