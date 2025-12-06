
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
import { Chrome, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
        confirmationResult?: ConfirmationResult;
    }
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

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
  
  const setupRecaptcha = () => {
      if (!auth) return;
      if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response: any) => {
              // reCAPTCHA solved, allow signInWithPhoneNumber.
            }
          });
      }
  }

  const handlePhoneSignIn = async () => {
      if (!auth) return;
      setLoading(true);
      setupRecaptcha();
      try {
          const appVerifier = window.recaptchaVerifier!;
          const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
          window.confirmationResult = confirmationResult;
          setOtpSent(true);
          toast({ title: "OTP Sent", description: "An OTP has been sent to your phone number." });
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Failed to send OTP', description: error.message });
      } finally {
          setLoading(false);
      }
  }

  const handleVerifyOtp = async () => {
      if (!auth || !window.confirmationResult) return;
      setLoading(true);
      try {
          await window.confirmationResult.confirm(otp);
          const redirectTo = searchParams.get('redirectTo') || '/';
          router.push(redirectTo);
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'OTP Verification Failed', description: error.message });
      } finally {
          setLoading(false);
      }
  }


  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email">
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
                 <div className="space-y-4 pt-4">
                    {!otpSent ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1 123 456 7890" required />
                            </div>
                            <Button onClick={handlePhoneSignIn} className="w-full" disabled={loading || !phoneNumber}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send OTP
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="otp">OTP</Label>
                                <Input id="otp" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                            </div>
                             <Button onClick={handleVerifyOtp} className="w-full" disabled={loading || !otp}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Verify OTP & Sign In
                            </Button>
                             <Button variant="link" size="sm" onClick={() => setOtpSent(false)} className="w-full">Back</Button>
                        </div>
                    )}
                </div>
            </TabsContent>
          </Tabs>

          <div id="recaptcha-container"></div>
          
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
