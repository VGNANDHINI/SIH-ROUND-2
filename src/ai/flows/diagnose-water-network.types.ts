
import { z } from 'zod';

export const DiagnoseWaterNetworkInputSchema = z.object({
  pressure_value: z.number().describe('Pressure value in PSI or bar.'),
  flow_rate: z.number().describe('Manual meter reading for flow rate.'),
  chlorine_level: z.number().describe('Chlorine level in ppm.'),
  turbidity_level: z.number().describe('Turbidity level in NTU.'),
  reservoir_drop_rate: z.number().describe('Reservoir drop rate in liters/hour.'),
  pump_status: z.enum(['running', 'stopped']).describe('Current status of the pump.'),
  complaints_count: z.number().int().describe('Number of complaints in the area.'),
  complaint_types: z.array(z.string()).describe('Types of complaints, e.g., low pressure, dirty water.'),
  sewage_line_nearby: z.boolean().describe('Whether a sewage line is nearby.'),
  past_leak_history: z.enum(['yes', 'no']).describe('Whether there is a history of leaks in the area.'),
});
export type DiagnoseWaterNetworkInput = z.infer<typeof DiagnoseWaterNetworkInputSchema>;

export const DiagnoseWaterNetworkOutputSchema = z.object({
  pressure_status: z.string().describe('LOW, HIGH, or NORMAL.'),
  leakage_status: z.string().describe('NORMAL or LEAKAGE.'),
  sewage_contamination_status: z.string().describe('PRESENT, SUSPECTED, or NOT_PRESENT.'),
  reasoning: z.string().describe('Simple reasoning for the diagnosis.'),
  recommended_actions: z.string().describe('Simple recommended actions for the operator.'),
});
export type DiagnoseWaterNetworkOutput = z.infer<typeof DiagnoseWaterNetworkOutputSchema>;
