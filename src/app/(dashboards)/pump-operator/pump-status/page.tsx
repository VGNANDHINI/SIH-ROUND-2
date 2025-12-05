'use client';

import { useUser, useDoc, useFirestore } from '@/firebase';
import type { UserProfile, PumpLog } from '@/lib/data';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useState, useMemo } from 'react';
import { PumpControl } from './_components/pump-control';
import { AiWaterLevelConfirm } from './_components/ai-water-level-confirm';
import { DailyStats } from './_components/daily-stats';
import { PumpLogsHistory } from './_components/pump-logs-history';
import { AnalyticsCharts } from './_components/analytics-charts';
import { useCollection } from '@/firebase/firestore/use-collection';

export default function PumpStatusPage() {
  const { user, loading: userLoading } = useUser();
  const {
    data: profile,
    loading: profileLoading,
  } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);
  const {
    data: logs,
    loading: logsLoading,
  } = useCollection<PumpLog>('pumpLogs');

  const [activeLog, setActiveLog] = useState<PumpLog | null>(null);
  const [sessionToConfirm, setSessionToConfirm] = useState<PumpLog | null>(
    null
  );

  const loading = userLoading || profileLoading;

  const isProfileConfigured = useMemo(() => {
    return (
      profile &&
      profile.pumpCategory &&
      profile.pumpDischargeRate &&
      profile.motorHorsepower &&
      profile.tankHeight &&
      profile.tankBaseArea
    );
  }, [profile]);

  const handleSessionStart = (log: PumpLog) => {
    setActiveLog(log);
    setSessionToConfirm(null);
  };

  const handleSessionEnd = (log: PumpLog) => {
    setActiveLog(null);
    setSessionToConfirm(log);
  };

  const handleConfirmation = () => {
    setSessionToConfirm(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isProfileConfigured) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Operator Profile Not Configured</AlertTitle>
        <AlertDescription>
          Your pump parameters are not set. Please configure your profile to
          start logging pump activity.
          <Button asChild className="mt-4">
            <Link href="/pump-operator/profile">Go to Operator Profile</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <PumpControl
            profile={profile}
            activeLog={activeLog}
            onSessionStart={handleSessionStart}
            onSessionEnd={handleSessionEnd}
          />
          <AiWaterLevelConfirm
            sessionToConfirm={sessionToConfirm}
            onConfirmation={handleConfirmation}
          />
        </div>
        <div className="lg:col-span-2">
           <DailyStats logs={logs} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PumpLogsHistory logs={logs} loading={logsLoading} />
        <AnalyticsCharts />
      </div>
    </div>
  );
}
