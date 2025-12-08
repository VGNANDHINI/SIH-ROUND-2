
'use client';
import { useCollection } from './use-collection';
import type { PipelineFeature, ValveFeature, PumpFeature, TankFeature } from '@/lib/gis-data';

export function usePipelines(village?: string) {
  return useCollection<PipelineFeature>('assets_pipelines');
}

export function useValves(village?: string) {
  return useCollection<ValveFeature>('assets_valves');
}

export function usePumps(village?: string) {
    return useCollection<PumpFeature>('assets_pumps');
}

export function useTanks(village?: string) {
    return useCollection<TankFeature>('assets_tanks');
}
