
"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useFirebase } from '@/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Chrome, Loader2, Droplet } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth } = useFirebase();
  const { toast } = useToast();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const redirectTo = searchParams.get('redirectTo') || '/';
      router.push(redirectTo);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign in failed',
        description: error.message,
      });
    } finally {
        setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      const redirectTo = searchParams.get('redirectTo') || '/';
      router.push(redirectTo);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Google sign in failed',
        description: error.message,
      });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Droplet className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground font-headline">JalShakthi</h1>
            </div>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleEmailSignIn} className="space-y-4 pt-4">
                <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                </Button>
            </form>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Chrome className="mr-2 h-4 w-4" />
            Sign in with Google
          </Button>
        </CardContent>
        <CardFooter className="text-sm justify-center">
          <p>Don't have an account? <Link href="/signup" className="font-semibold text-primary hover:underline">Sign up</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
}
