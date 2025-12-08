
'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-pump-maintenance.ts';
import '@/ai/flows/water-quality-issue-analysis.ts';
import '@/ai/flows/suggest-water-level.ts';
import '@/ai/flows/diagnose-water-network.ts';
import '@/ai/flows/predict-leak-location.ts';
import '@/ai/flows/get-aerial-view.ts';
import '@/ai/flows/jal-saathi-assistant.ts';
import '@/ai/flows/diagnose-water-network.ts';
