
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDoc, useUser } from "@/firebase";
import { UserProfile } from "@/lib/data";
import { Calendar, Loader2 } from "lucide-react";
import { useMemo } from "react";

type Schedule = {
    [key: string]: string;
}

export function WaterSchedule() {
  const { user } = useUser();
  const { data: profile } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);
  const { data: scheduleData, loading: scheduleLoading } = useDoc<Schedule>(profile ? `waterSchedules/${profile.panchayat}` : null);

  const schedule = useMemo(() => {
    if (!scheduleData) return [];

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.map(day => ({
        day: day.charAt(0).toUpperCase() + day.slice(1),
        timing: `${scheduleData[`${day}_morning`]} & ${scheduleData[`${day}_evening`]}`
    }));
  }, [scheduleData]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <Card className="lg:col-span-2">
        <CardHeader>
            <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-primary" />
                <div>
                    <CardTitle>Weekly Water Supply Schedule</CardTitle>
                    <CardDescription>
                        Live water distribution timings for your area.
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            {scheduleLoading ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : schedule.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Day</TableHead>
                            <TableHead>Supply Timings</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {schedule.map((day, index) => (
                            <TableRow key={index} className={day.day === today ? "bg-muted/80" : ""}>
                                <TableCell className="font-medium">{day.day}</TableCell>
                                <TableCell>{day.timing}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <p className="text-center text-muted-foreground py-10">Supply schedule has not been set by the operator yet.</p>
            )}
        </CardContent>
    </Card>
  );
}
