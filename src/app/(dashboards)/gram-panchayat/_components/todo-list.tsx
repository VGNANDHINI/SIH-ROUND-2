
'use client';

import { useMemo } from 'react';
import { useComplaints, useDoc, useUser } from '@/firebase';
import type { Complaint, UserProfile } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

// --- Configuration for Priority Calculation ---
const RISK_MULTIPLIERS: Record<Complaint['issueType'], number> = {
  "Dirty water": 8,
  "No water": 7,
  "Leakage": 5,
  "Motor off": 4,
  "Low pressure": 2,
  "Others": 1,
};

const HH_AFFECTED: Record<Complaint['issueType'], number> = {
  "Dirty water": 20,
  "No water": 15,
  "Leakage": 5,
  "Motor off": 15,
  "Low pressure": 5,
  "Others": 1,
};

// --- Helper Functions ---
const calculatePriority = (complaint: Complaint) => {
  const now = new Date();
  const reportedAt = complaint.reportedAt?.toDate ? complaint.reportedAt.toDate() : new Date();
  const hoursOverdue = (now.getTime() - reportedAt.getTime()) / (1000 * 60 * 60);

  const hhAffected = HH_AFFECTED[complaint.issueType] || 1;
  const riskMultiplier = RISK_MULTIPLIERS[complaint.issueType] || 1;

  const priorityScore = (hhAffected * 2) + (hoursOverdue * 3) + (riskMultiplier * 10);
  
  return Math.min(Math.round(priorityScore), 100); // Cap priority at 100
};

const getPriorityDetails = (score: number) => {
  if (score >= 80) return { icon: '🔴', label: 'PRIORITISE', color: 'text-red-600', recommendation: 'FIX NOW! Drop everything. Impacts many households.' };
  if (score >= 50) return { icon: '🟠', label: 'Urgent', color: 'text-orange-500', recommendation: 'Fix within 2 hours. Call helper if needed.' };
  if (score >= 25) return { icon: '🟡', label: 'Soon', color: 'text-yellow-500', recommendation: 'Fix today before evening supply.' };
  return { icon: '🟢', label: 'Later', color: 'text-green-600', recommendation: 'Can wait. Check tomorrow.' };
};


// --- The Component ---
export function TodoList() {
  const { user } = useUser();
  const { data: profile } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);
  const { data: allComplaints, loading } = useComplaints();

  const tasks = useMemo(() => {
    if (!profile || !allComplaints) return [];
    
    return allComplaints
      .filter(c => c.userPanchayat === profile.panchayat && c.status === 'Open')
      .map(c => ({
        ...c,
        priority: calculatePriority(c),
      }))
      .sort((a, b) => b.priority - a.priority);

  }, [profile, allComplaints]);

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Priority To-Do List</CardTitle>
        <CardDescription>Auto-ranked tasks for your Panchayat.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
        
        {!loading && tasks.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
                <p>🎉</p>
                <p>No open complaints!</p>
                <p className="text-xs">Your panchayat is running smoothly.</p>
            </div>
        )}
        
        {!loading && tasks.map(task => {
          const { icon, label, color, recommendation } = getPriorityDetails(task.priority);
          return (
            <Link href="/gram-panchayat/complaints" key={task.id} className="block p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-start">
                    <span className="font-medium text-sm">{icon} {task.issueType} - {task.address}</span>
                    <span className={`text-xs font-bold ${color}`}>{task.priority} pts</span>
                </div>
                <div className="text-xs text-muted-foreground ml-6">
                    <span className={`font-semibold ${color}`}>{label}</span> - {recommendation}
                </div>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  );
}
