
'use server';

/**
 * @fileOverview A conversational AI assistant for JalSaathi residents.
 *
 * - jalSaathiAssistant - A function that responds to user queries.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AssistantInputSchema = z.object({
  query: z.string().describe('The user\'s question or message.'),
});

const AssistantOutputSchema = z.object({
  response: z.string().describe('The AI assistant\'s response.'),
});

const assistantPrompt = ai.definePrompt({
  name: 'jalSaathiAssistantPrompt',
  input: { schema: AssistantInputSchema },
  output: { schema: AssistantOutputSchema },
  prompt: `You are the "JalSaathi Assistant", a friendly and helpful AI chatbot for residents using a rural water supply app. Your goal is to answer questions clearly and simply.

You can help with:
- How to register a complaint (e.g., "how do I report a leak?").
- Checking water availability or supply timings.
- Understanding water quality reports.
- Explaining how the app works.

Keep your answers concise and easy to understand for a rural audience. If you don't know the answer, say so politely.

User's question: {{{query}}}
`,
});

export const jalSaathiAssistant = ai.defineFlow(
  {
    name: 'jalSaathiAssistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {
    const { output } = await assistantPrompt(input);
    return output!;
  }
);
