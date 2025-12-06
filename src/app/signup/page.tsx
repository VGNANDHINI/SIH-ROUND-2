
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFirebase } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Chrome, Loader2 } from 'lucide-react';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [block, setBlock] = useState('');
  const [panchayat, setPanchayat] = useState('');
  
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });
      
      const userData = {
        uid: user.uid,
        displayName: name,
        email: user.email,
        phoneNumber,
        createdAt: serverTimestamp(),
        state,
        district,
        block,
        panchayat,
      };

      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, userData);

      router.push('/');
    } catch (error: any) {
        if(error.code === 'auth/email-already-in-use') {
             toast({
                variant: 'destructive',
                title: 'Sign up failed',
                description: 'This email is already in use. Please sign in instead.',
            });
        } else {
             toast({
                variant: 'destructive',
                title: 'Sign up failed',
                description: error.message,
            });
        }
    } finally {
        setLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) return;
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(firestore, 'users', user.uid);
      const userData = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber, // This might be null
        createdAt: serverTimestamp(),
        // These fields are required, so we prompt the user to fill them after first login
        state: 'Default State',
        district: 'Default District',
        block: 'Default Block',
        panchayat: 'Default Panchayat',
      };

      await setDoc(userDocRef, userData, { merge: true });

      router.push('/');
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
    <div className="flex items-center justify-center min-h-screen bg-background py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>
            Join JalSaathi to manage your water resources
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleEmailSignUp} className="space-y-4 pt-4">
                <div className="space-y-2"> <Label htmlFor="name-email">Name</Label> <Input id="name-email" type="text" value={name} onChange={(e) => setName(e.target.value)} required /> </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"> <Label htmlFor="email">Email</Label> <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /> </div>
                    <div className="space-y-2"> <Label htmlFor="phoneNumber-email">Phone Number</Label> <Input id="phoneNumber-email" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required /> </div>
                </div>
                <div className="space-y-2"> <Label htmlFor="password">Password</Label> <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /> </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"> <Label htmlFor="state-email">State</Label> <Input id="state-email" value={state} onChange={(e) => setState(e.target.value)} required /> </div>
                    <div className="space-y-2"> <Label htmlFor="district-email">District</Label> <Input id="district-email" value={district} onChange={(e) => setDistrict(e.target.value)} required /> </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"> <Label htmlFor="block-email">Block</Label> <Input id="block-email" value={block} onChange={(e) => setBlock(e.target.value)} required /> </div>
                    <div className="space-y-2"> <Label htmlFor="panchayat-email">Panchayat</Label> <Input id="panchayat-email" value={panchayat} onChange={(e) => setPanchayat(e.target.value)} required /> </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}> {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign Up </Button>
            </form>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Chrome className="mr-2 h-4 w-4" />
            Sign up with Google
          </Button>
        </CardContent>
        <CardFooter className="text-sm justify-center">
          <p>
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

    