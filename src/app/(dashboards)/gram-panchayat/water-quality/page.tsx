'use client';

import { WaterQualityLogForm } from './_components/water-quality-log-form';
import { WaterQualityHistory } from './_components/water-quality-history';
import { useState } from 'react';
import type { WaterTest } from '@/lib/data';

export default function GramPanchayatWaterQualityPage() {
  const [newTest, setNewTest] = useState<WaterTest | null>(null);

  const handleTestLogged = (test: WaterTest) => {
    setNewTest(test);
  };

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-1 gap-8 items-start">
        <WaterQualityLogForm onTestLogged={handleTestLogged} />
      </div>
      <WaterQualityHistory newTest={newTest} />
    </div>
  );
}
