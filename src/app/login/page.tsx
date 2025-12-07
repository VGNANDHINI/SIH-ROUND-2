
"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useFirebase } from '@/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Chrome, Loader2, Droplet, Phone } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth } = useFirebase();
  const { toast } = useToast();
  
  const setupRecaptcha = () => {
    if (!auth) return;
    // Cleanup existing verifier
    if ((window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier.clear();
    }
    
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (response: any) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
        console.log("reCAPTCHA verified");
      }
    });
  };
  
  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);
    setupRecaptcha();
    const appVerifier = (window as any).recaptchaVerifier;
    try {
        const result = await signInWithPhoneNumber(auth, `+91${phoneNumber}`, appVerifier);
        setConfirmationResult(result);
        setOtpSent(true);
        toast({ title: "OTP Sent", description: "Please check your phone for the OTP." });
    } catch (error: any) {
         toast({
            variant: 'destructive',
            title: 'Failed to send OTP',
            description: error.message,
        });
    } finally {
        setLoading(false);
    }
  }

  const handleOtpVerify = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!confirmationResult) return;
      setLoading(true);
      try {
          await confirmationResult.confirm(otp);
          const redirectTo = searchParams.get('redirectTo') || '/';
          router.push(redirectTo);
      } catch (error: any) {
          toast({
              variant: 'destructive',
              title: 'OTP Verification Failed',
              description: error.message,
          });
      } finally {
          setLoading(false);
      }
  }


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
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
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
            </TabsContent>
            <TabsContent value="phone">
               {!otpSent ? (
                 <form onSubmit={handlePhoneSignIn} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="flex items-center gap-2">
                        <span className="p-2 border rounded-md bg-muted">+91</span>
                        <Input id="phone" type="tel" placeholder="10-digit number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                      </div>
                    </div>
                    <div id="recaptcha-container"></div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send OTP
                    </Button>
                  </form>
               ) : (
                  <form onSubmit={handleOtpVerify} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp">Enter OTP</Label>
                      <Input id="otp" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Verify OTP & Sign In
                    </Button>
                    <Button variant="link" size="sm" onClick={() => setOtpSent(false)}>Back to phone number</Button>
                  </form>
               )}
            </TabsContent>
          </Tabs>
          
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
