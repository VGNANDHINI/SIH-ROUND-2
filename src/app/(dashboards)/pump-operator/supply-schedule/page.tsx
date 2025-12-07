
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/data';

const scheduleSchema = z.object({
  monday_morning: z.string(),
  monday_evening: z.string(),
  tuesday_morning: z.string(),
  tuesday_evening: z.string(),
  wednesday_morning: z.string(),
  wednesday_evening: z.string(),
  thursday_morning: z.string(),
  thursday_evening: z.string(),
  friday_morning: z.string(),
  friday_evening: z.string(),
  saturday_morning: z.string(),
  saturday_evening: z.string(),
  sunday_morning: z.string(),
  sunday_evening: z.string(),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function SetSupplySchedulePage() {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { data: profile } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);
  const { data: schedule, loading: scheduleLoading } = useDoc<ScheduleFormValues>(profile ? `waterSchedules/${profile.panchayat}` : null);

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      monday_morning: '6:00 AM - 9:00 AM',
      monday_evening: '5:00 PM - 8:00 PM',
      tuesday_morning: '6:00 AM - 9:00 AM',
      tuesday_evening: '5:00 PM - 8:00 PM',
      wednesday_morning: '6:00 AM - 9:00 AM',
      wednesday_evening: '5:00 PM - 8:00 PM',
      thursday_morning: '6:00 AM - 9:00 AM',
      thursday_evening: '5:00 PM - 8:00 PM',
      friday_morning: '6:00 AM - 9:00 AM',
      friday_evening: '5:00 PM - 8:00 PM',
      saturday_morning: '7:00 AM - 10:00 AM',
      saturday_evening: '4:00 PM - 7:00 PM',
      sunday_morning: '7:00 AM - 10:00 AM',
      sunday_evening: '4:00 PM - 7:00 PM',
    },
  });
  
  useEffect(() => {
    if(schedule) {
        form.reset(schedule);
    }
  }, [schedule, form]);


  const onSubmit = async (values: ScheduleFormValues) => {
    if (!firestore || !profile?.panchayat) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not determine your panchayat.' });
      return;
    }
    setIsSaving(true);
    const scheduleRef = doc(firestore, 'waterSchedules', profile.panchayat);

    try {
      await setDoc(scheduleRef, values, { merge: true });
      toast({ title: 'Schedule Saved', description: 'The water supply schedule has been updated.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Set Weekly Water Supply Schedule</CardTitle>
        <CardDescription>
          Enter the planned water supply timings for each day. This schedule will be visible to residents.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {scheduleLoading ? <Loader2 className="h-8 w-8 animate-spin"/> : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {days.map(day => (
              <div key={day} className="space-y-4 rounded-lg border p-4">
                <h3 className="text-lg font-medium capitalize">{day}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`${day}_morning` as keyof ScheduleFormValues}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Morning Supply</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 6:00 AM - 9:00 AM" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`${day}_evening` as keyof ScheduleFormValues}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Evening Supply</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 5:00 PM - 8:00 PM" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Schedule
            </Button>
          </form>
        </Form>
        )}
      </CardContent>
    </Card>
  );
}
