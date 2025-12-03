'use client';
import { useCollection } from './use-collection';
import type { WaterScheme, PumpIssue, Bill, PumpLog } from '@/lib/data';

export function useWaterSchemes() {
  return useCollection<WaterScheme>('waterSchemes');
}

export function usePumpIssues() {
    return useCollection<PumpIssue>('pumpIssues');
}

export function useBills() {
    return useCollection<Bill>('bills');
}

export function usePumpLogs() {
    return useCollection<PumpLog>('pumpLogs');
}
