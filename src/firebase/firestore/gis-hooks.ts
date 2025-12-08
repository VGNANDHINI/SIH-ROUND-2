
'use client';
import { useCollection } from './use-collection';
import type { PipelineFeature, ValveFeature, PumpFeature, TankFeature } from '@/lib/gis-data';

export function usePipelines(villageId: string | null) {
  const path = villageId ? `gis_assets/${villageId}/pipelines` : null;
  return useCollection<PipelineFeature>(path);
}

export function useValves(villageId: string | null) {
  const path = villageId ? `gis_assets/${villageId}/valves` : null;
  return useCollection<ValveFeature>(path);
}

export function usePumps(villageId: string | null) {
  const path = villageId ? `gis_assets/${villageId}/pumps` : null;
  return useCollection<PumpFeature>(path);
}

export function useTanks(villageId: string | null) {
  const path = villageId ? `gis_assets/${villageId}/tanks` : null;
  return useCollection<TankFeature>(path);
}
