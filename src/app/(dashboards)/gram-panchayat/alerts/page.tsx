
'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { sendBulkSms } from '@/services/notifications';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const alertSchema = z.object({
  message: z
    .string()
    .min(10, 'Alert message must be at least 10 characters long.')
    .max(160, 'Alert message cannot exceed 160 characters.'),
});

export default function AlertsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof alertSchema>>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      message: '',
    },
  });

  async function onSubmit(values: z.infer<typeof alertSchema>) {
    setIsLoading(true);
    try {
      const result = await sendBulkSms(values.message);
      if (result.success) {
        toast({
          title: 'Alerts Sent Successfully',
          description: `Messages have been sent to ${result.sentCount} users.`,
        });
        form.reset();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Send Alerts',
        description:
          error.message || 'An unknown error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Notification Center</CardTitle>
        <CardDescription>
          Compose a message and send it as an SMS to all registered users with a
          phone number.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(() => {})} className="space-y-6">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alert Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your alert message here... (max 160 characters)"
                      className="resize-none"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  disabled={isLoading || !form.formState.isValid}
                  className="w-full"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Review and Send Alert
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will send an SMS alert to all users with a registered phone number. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Card>
                  <CardContent className="p-4 bg-muted rounded-md mt-2">
                    <p className="text-sm text-muted-foreground">{form.getValues('message')}</p>
                  </CardContent>
                </Card>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                      </>
                    ) : (
                      'Confirm and Send'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
