'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "lucide-react";
import { format, addDays } from "date-fns";

const getWeeklySchedule = () => {
    const today = new Date();
    const schedule = [];
    const timings = [
        "6:00 AM - 9:00 AM",
        "5:00 PM - 8:00 PM",
        "6:30 AM - 9:30 AM",
        "5:30 PM - 8:30 PM",
        "7:00 AM - 10:00 AM",
        "4:00 PM - 7:00 PM",
        "No Morning Supply (Maintenance)",
    ];

    for (let i = 0; i < 7; i++) {
        const date = addDays(today, i);
        schedule.push({
            day: format(date, 'EEEE'),
            date: format(date, 'dd MMM'),
            timing: timings[i % timings.length] 
        });
    }
    return schedule;
};


export function WaterSchedule() {
  const schedule = getWeeklySchedule();

  return (
    <Card className="lg:col-span-2">
        <CardHeader>
            <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-primary" />
                <div>
                    <CardTitle>Weekly Water Supply Schedule</CardTitle>
                    <CardDescription>
                        Planned water distribution timings for the upcoming week.
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Day</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Supply Timings</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {schedule.map((day, index) => (
                        <TableRow key={index} className={day.day === "Sunday" ? "bg-muted/50" : ""}>
                            <TableCell className="font-medium">{day.day}</TableCell>
                            <TableCell>{day.date}</TableCell>
                            <TableCell>{day.timing}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
}
