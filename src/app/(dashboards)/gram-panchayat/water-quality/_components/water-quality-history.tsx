'use client';
import { useEffect, useState } from 'react';
import { useWaterQualityTests, useUser, useDoc } from '@/firebase';
import type { UserProfile, WaterTest } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function WaterQualityHistory({ newTest }: { newTest: WaterTest | null }) {
  const { user, loading: userLoading } = useUser();
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(
    user ? `users/${user.uid}` : null
  );
  const { data: fetchedTests, loading: testsLoading } = useWaterQualityTests(
    profile?.panchayat
  );
  const [tests, setTests] = useState<WaterTest[] | null>(null);

  useEffect(() => {
    if (fetchedTests) {
      setTests(fetchedTests);
    }
  }, [fetchedTests]);

  useEffect(() => {
    if (newTest) {
      setTests((prevTests) => [newTest, ...(prevTests || [])]);
    }
  }, [newTest]);

  const loading = userLoading || profileLoading || (!!profile && testsLoading && !tests);

  const getStatusVariant = (status: WaterTest['status']) => {
    switch (status) {
      case 'safe':
        return 'success';
      case 'unsafe':
        return 'destructive';
      case 'attention-needed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Test History</CardTitle>
        <CardDescription>
          Last 10 water quality test results for {profile?.panchayat}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>pH</TableHead>
                <TableHead>Turbidity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests && tests.length > 0 ? (
                tests.slice(0, 10).map((test) => (
                  <TableRow key={test.id}>
                    <TableCell>
                      {test.testDate
                        ? new Date(
                            (test.testDate as any).seconds * 1000
                          ).toLocaleString()
                        : 'Now'}
                    </TableCell>
                    <TableCell>{test.ward}</TableCell>
                    <TableCell>{test.pH}</TableCell>
                    <TableCell>{test.turbidity}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(test.status)}>
                        {test.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No tests found for this panchayat yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
