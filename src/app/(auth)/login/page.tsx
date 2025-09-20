"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function LoginPage() {
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'buyer' | 'artisan'>('buyer');
  const [error, setError] = useState('');
  const router = useRouter();

  // This new function checks a user's role and verification status to send them to the correct page.
  const handleRedirect = async (user: User) => {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.role === 'artisan' && !userData.isVerifiedArtisan) {
        router.push('/verification'); // Unverified artisans go here
      } else if (userData.role === 'artisan') {
        router.push('/artisan-hub'); // Verified artisans go here
      } else {
        router.push('/'); // Buyers go here
      }
    } else {
       router.push('/'); // Default redirect
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (isSignUpMode) {
      if (!displayName) return setError('Please enter your full name.');
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          displayName,
          email,
          role,
          isVerifiedArtisan: false, // Artisans are NOT verified on sign-up
        });
        await handleRedirect(user);
      } catch (e) {
        setError('Failed to create account. Email might be in use.');
      }
    } else {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await handleRedirect(userCredential.user);
      } catch (e) {
        setError('Failed to log in. Check credentials.');
      }
    }
  };
  
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      // Only create a new doc if the user is signing in for the first time
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          role: 'buyer', // Google Sign-In defaults to 'buyer'
          isVerifiedArtisan: false
        });
      }
      await handleRedirect(user);
    } catch (e) {
      setError('Failed to sign in with Google.');
    }
  };

  const toggleMode = () => {
    setIsSignUpMode(!isSignUpMode);
    setError('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-stone-50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{isSignUpMode ? 'Create an Account' : 'Login'}</CardTitle>
          <CardDescription>
            {isSignUpMode ? 'Enter your details to create a new account.' : 'Enter your email below to login to your account.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button onClick={handleGoogleSignIn} variant="outline" className="w-full">
            {isSignUpMode ? 'Sign up with Google' : 'Sign in with Google'}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
          </div>
          {isSignUpMode && (
            <div className="grid gap-2">
              <Label htmlFor="displayName">Full Name</Label>
              <Input id="displayName" placeholder="Pranav Kumar" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {isSignUpMode && (
             <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
               <div className="space-y-0.5">
                 <Label>Sign up as an Artisan</Label>
                 <CardDescription>Choose this to sell your products.</CardDescription>
               </div>
               <Switch checked={role === 'artisan'} onCheckedChange={(checked) => setRole(checked ? 'artisan' : 'buyer')} />
             </div>
           )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button onClick={handleSubmit} className="w-full">{isSignUpMode ? 'Create Account' : 'Sign in'}</Button>
          <div className="mt-4 text-center text-sm">
            {isSignUpMode ? 'Already have an account?' : "Don't have an account?"}{" "}
            <button onClick={toggleMode} className="underline">{isSignUpMode ? 'Sign in' : 'Sign up'}</button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

