'use client';
import { useCollection } from './use-collection';
import type { WaterScheme, PumpIssue, Bill, PumpLog, Operator, Complaint, WaterTest, SopLibraryItem, DailyChecklist, LeakageAlert } from '@/lib/data';
import { sopLibraryItems } from '@/lib/sop-data';

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

export function useOperators() {
    return useCollection<Operator>('operators');
}

export function useComplaints() {
    return useCollection<Complaint>('complaints');
}

export function useWaterQualityTests(panchayatId?: string) {
    const path = panchayatId ? `panchayats/${panchayatId}/waterTests` : null;
    return useCollection<WaterTest>(path);
}

export function useDailyChecklists(panchayatId?: string) {
    const path = panchayatId ? `panchayats/${panchayatId}/checklists` : null;
    return useCollection<DailyChecklist>(path);
}

export function useLeakageAlerts() {
    return useCollection<LeakageAlert>('leakageAlerts');
}

// NOTE: This hook uses static data for the prototype.
// In a real app, it would use useCollection('sopLibrary').
export function useSopLibrary() {
    return { data: sopLibraryItems, loading: false, error: null };
}
