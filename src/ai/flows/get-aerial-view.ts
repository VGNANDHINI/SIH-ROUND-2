
'use server';
/**
 * @fileOverview An AI-powered tool to retrieve a cinematic aerial view video for a given address.
 *
 * - getAerialView - A function that fetches the video URI from the Google Aerial View API.
 * - GetAerialViewInput - The input type for the function.
 * - GetAerialViewOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GetAerialViewInputSchema = z.object({
  address: z.string().describe(
    'The address for which to look up an aerial view video. This can also be a videoId.'
  ),
});
export type GetAerialViewInput = z.infer<typeof GetAerialViewInputSchema>;

const GetAerialViewOutputSchema = z.object({
  state: z.enum(['PROCESSING', 'ACTIVE', 'NOT_FOUND']),
  uri: z.string().optional().describe('The MP4 URI of the medium quality landscape video if found.'),
  error: z.string().optional().describe('An error message if the video lookup fails.'),
});
export type GetAerialViewOutput = z.infer<typeof GetAerialViewOutputSchema>;

// Helper to determine if the input is a videoId or an address
function videoIdOrAddress(value: string) {
  const videoIdRegex = /[0-9a-zA-Z-_]{22}/;
  return value.match(videoIdRegex) ? 'videoId' : 'address';
}

export const getAerialView = ai.defineFlow(
  {
    name: 'getAerialView',
    inputSchema: GetAerialViewInputSchema,
    outputSchema: GetAerialViewOutputSchema,
  },
  async ({ address }) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured.');
    }
    
    try {
      const parameterKey = videoIdOrAddress(address);
      const urlParameter = new URLSearchParams();
      urlParameter.set(parameterKey, address);
      urlParameter.set('key', apiKey);
      
      const response = await fetch(`https://aerialview.googleapis.com/v1/videos:lookupVideo?${urlParameter.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'Failed to fetch video from Aerial View API');
      }

      const videoResult = await response.json();

      if (videoResult.state === 'PROCESSING') {
        return { state: 'PROCESSING' };
      } else if (videoResult.error && videoResult.error.code === 404) {
         return { state: 'NOT_FOUND', error: 'Video not found.' };
      } else {
        return { state: 'ACTIVE', uri: videoResult.uris?.MP4_MEDIUM?.landscapeUri };
      }
    } catch (err: any) {
       console.error('Error in getAerialView flow:', err);
       return { state: 'NOT_FOUND', error: err.message || 'An unknown error occurred.'};
    }
  }
);
