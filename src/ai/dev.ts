'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-pump-maintenance.ts';
import '@/ai/flows/water-quality-issue-analysis.ts';
import '@/ai/flows/suggest-water-level.ts';
import '@/ai/flows/diagnose-water-network.ts';
import '@/ai/flows/leakage-detection-flow.ts';
import '@/ai/flows/predict-leak-location.ts';
