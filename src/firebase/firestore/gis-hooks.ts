
'use client';
import { useCollection } from './use-collection';
import type { PipelineFeature, ValveFeature, PumpFeature, TankFeature } from '@/lib/gis-data';

export function usePipelines() {
  return useCollection<PipelineFeature>('assets_pipelines');
}

export function useValves() {
  return useCollection<ValveFeature>('assets_valves');
}

export function usePumps() {
    return useCollection<PumpFeature>('assets_pumps');
}

export function useTanks() {
    return useCollection<TankFeature>('assets_tanks');
}

    