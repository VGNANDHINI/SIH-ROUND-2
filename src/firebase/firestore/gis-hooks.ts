
'use client';
import { useCollection } from './use-collection';
import type { State, District, Mandal, Panchayat, Habitation, Pipeline, Valve, Pump, Tank } from '@/lib/gis-data';

export function useStates() {
  return useCollection<State>('states');
}

export function useDistricts(stateId: string | null) {
  const path = stateId ? `states/${stateId}/districts` : null;
  return useCollection<District>(path);
}

export function useMandals(stateId: string | null, districtId: string | null) {
  const path = stateId && districtId ? `states/${stateId}/districts/${districtId}/mandals` : null;
  return useCollection<Mandal>(path);
}

export function usePanchayats(stateId: string | null, districtId: string | null, mandalId: string | null) {
  const path = stateId && districtId && mandalId ? `states/${stateId}/districts/${districtId}/mandals/${mandalId}/panchayats` : null;
  return useCollection<Panchayat>(path);
}

export function useHabitations(stateId: string | null, districtId: string | null, mandalId: string | null, panchayatId: string | null) {
    const path = stateId && districtId && mandalId && panchayatId ? `states/${stateId}/districts/${districtId}/mandals/${mandalId}/panchayats/${panchayatId}/habitations` : null;
    return useCollection<Habitation>(path);
}

const getAssetPath = (basePath: string | null, asset: string) => {
    return basePath ? `${basePath}/${asset}` : null;
}

export function usePipelines(panchayatPath: string | null) {
    return useCollection<Pipeline>(getAssetPath(panchayatPath, 'pipelines'));
}

export function useValves(panchayatPath: string | null) {
    return useCollection<Valve>(getAssetPath(panchayatPath, 'valves'));
}

export function usePumps(panchayatPath: string | null) {
    return useCollection<Pump>(getAssetPath(panchayatPath, 'pumps'));
}

export function useTanks(panchayatPath: string | null) {
    return useCollection<Tank>(getAssetPath(panchayatPath, 'tanks'));
}
