
'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, AlertTriangle } from 'lucide-react';
import { getAerialView } from '@/ai/flows/get-aerial-view';

export default function AerialViewPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState('Anjur, Chengalpattu, Tamil Nadu');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleLookup = async () => {
    if (!address) {
      toast({ title: 'Address required', description: 'Please enter an address to look up.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    setVideoUri(null);
    setError(null);

    try {
      const result = await getAerialView({ address });
      if (result.state === 'ACTIVE' && result.uri) {
        setVideoUri(result.uri);
      } else {
        const message = result.state === 'PROCESSING' 
          ? 'The video for this address is still processing. Please try again later.'
          : 'A cinematic video could not be found for this address.';
        setError(message);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Cinematic Aerial View</CardTitle>
        <CardDescription>
          Enter an address or a known location in your panchayat to get a cinematic aerial view.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g., Anjur, Chengalpattu, Tamil Nadu"
          />
          <Button onClick={handleLookup} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Get View
          </Button>
        </div>
        
        <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin"/>
                <p>Fetching cinematic video...</p>
            </div>
          ) : videoUri ? (
            <video
              key={videoUri}
              className="w-full h-full object-cover"
              muted
              autoPlay
              loop
              playsInline
            >
                <source src={videoUri} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground text-center p-4">
                {error ? (
                    <>
                        <AlertTriangle className="h-10 w-10 text-destructive"/>
                        <p className="font-semibold text-destructive">{error}</p>
                    </>
                ) : (
                    <>
                        <Camera className="h-10 w-10"/>
                        <p>Your aerial view will appear here.</p>
                    </>
                )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
