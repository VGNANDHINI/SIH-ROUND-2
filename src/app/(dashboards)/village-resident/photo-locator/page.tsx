
'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, MapPin, Sparkles, Check } from 'lucide-react';
import {
  predictLeakLocation,
  PredictLeakLocationOutput,
} from '@/ai/flows/predict-leak-location';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PhotoLocatorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [result, setResult] = useState<PredictLeakLocationOutput | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResult(null);
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!photo) {
      toast({
        variant: 'destructive',
        title: 'No Photo Selected',
        description: 'Please upload a photo of the leak to analyze.',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const photoDataUri = await fileToDataUri(photo);
      const analysisResult = await predictLeakLocation({ photoDataUri });
      setResult(analysisResult);
      toast({
        title: 'Analysis Complete',
        description: `Location identified with ${analysisResult.confidence.toLowerCase()} confidence.`,
      });
    } catch (error: any) {
      console.error('Location prediction failed:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: 'High' | 'Medium' | 'Low') => {
    switch (confidence) {
      case 'High': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-red-500';
    }
  };


  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>AI Photo Locator</CardTitle>
          <CardDescription>
            Upload a photo of a suspected leak, and our AI will try to
            pinpoint its location.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted"
            onClick={() => fileInputRef.current?.click()}
          >
            {photoPreview ? (
              <Image
                src={photoPreview}
                alt="Leak preview"
                width={300}
                height={256}
                className="object-contain h-full w-full rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">PNG or JPG</p>
              </div>
            )}
            <Input
              id="photo-upload"
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/png, image/jpeg"
              onChange={handleFileChange}
            />
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={isLoading || !photo}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Analyze Location
          </Button>
        </CardContent>
      </Card>

      <Card className="sticky top-24">
        <CardHeader>
          <CardTitle>Analysis Result</CardTitle>
          <CardDescription>
            The predicted location will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : result ? (
             <div className="space-y-6 text-sm">
                <div className="space-y-2">
                    <p className="text-muted-foreground font-medium">Confidence</p>
                     <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", getConfidenceColor(result.confidence))}></div>
                        <p className="font-bold text-lg">{result.confidence}</p>
                    </div>
                </div>

                 <div className="space-y-2">
                    <p className="text-muted-foreground font-medium">Predicted Location</p>
                    <div className="flex items-start gap-3 p-4 rounded-md border bg-muted">
                        <MapPin className="h-5 w-5 mt-1 text-primary"/>
                        <p className="font-semibold text-base text-foreground">{result.predictedLocation}</p>
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-base mb-2">Reasoning</h3>
                    <p className="text-muted-foreground italic">"{result.reasoning}"</p>
                </div>

                <Button className="w-full">
                    <Check className="mr-2 h-4 w-4" />
                    Confirm & Report Leak at this Location
                </Button>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p>Upload a photo to begin.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
