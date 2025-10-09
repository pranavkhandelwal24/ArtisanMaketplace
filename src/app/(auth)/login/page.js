"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { auth, db } from '@/lib/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup, 
    RecaptchaVerifier,
    signInWithPhoneNumber,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Helper to set up the reCAPTCHA verifier
const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response) => {
                console.log("reCAPTCHA solved");
            }
        });
    }
};

export default function LoginPage() {
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email');
  
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState('buyer');
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleRedirect = async (user) => {
    if (!user) return router.push('/');
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.role === 'artisan' && !userData.isVerifiedArtisan) {
        router.push('/verification');
      } else if (userData.role === 'artisan') {
        router.push('/artisan-hub');
      } else {
        router.push('/');
      }
    } else {
       router.push('/');
    }
  };

  const handleEmailSubmit = async () => {
    setError('');
    setLoading(true);
    if (isSignUpMode) {
      if (!displayName) {
        setLoading(false);
        return setError('Please enter your full name.');
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName });
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          displayName,
          email,
          role,
          isVerifiedArtisan: false,
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
    setLoading(false);
  };
  
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          role: 'buyer',
          isVerifiedArtisan: false
        });
      }
      await handleRedirect(user);
    } catch (e) {
      console.error("Google Sign-In Error:", e);
      setError('Failed to sign in with Google. Please try again.');
    }
    setLoading(false);
  };

  const handlePhoneSubmit = async () => {
      setError('');
      setLoading(true);
      try {
          const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
          setupRecaptcha();
          const appVerifier = window.recaptchaVerifier;
          const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
          setConfirmationResult(confirmation);
          setOtpSent(true);
      } catch (e) {
          console.error("Phone Sign-In Error:", e);
          setError("Failed to send OTP. Please check the phone number or try again.");
      }
      setLoading(false);
  };

  const handleOtpVerify = async () => {
      setError('');
      setLoading(true);
      if (!confirmationResult) {
          setError("Something went wrong. Please try sending the OTP again.");
          setLoading(false);
          return;
      }
      try {
          const result = await confirmationResult.confirm(otp);
          const user = result.user;
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
              await setDoc(userDocRef, {
                  uid: user.uid,
                  phoneNumber: user.phoneNumber,
                  role: 'buyer',
                  isVerifiedArtisan: false
              });
          }
          await handleRedirect(user);
      } catch (e) {
          console.error("OTP Verification Error:", e);
          setError("Invalid OTP. Please try again.");
      }
      setLoading(false);
  };

  const toggleMode = () => {
    setIsSignUpMode(!isSignUpMode);
    setError('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-stone-50">
      <div id="recaptcha-container"></div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{isSignUpMode ? 'Create an Account' : 'Login'}</CardTitle>
          <CardDescription>
            {isSignUpMode ? 'Enter your details to create an account.' : 'Sign in to your account.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button onClick={handleGoogleSignIn} variant="outline" className="w-full" disabled={loading}>
            Sign in with Google
          </Button>

          <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div></div>

           <div className="grid grid-cols-2 gap-2">
                <Button variant={loginMethod === 'email' ? 'default' : 'outline'} onClick={() => { setLoginMethod('email'); setOtpSent(false); }}>Email</Button>
                <Button variant={loginMethod === 'phone' ? 'default' : 'outline'} onClick={() => { setLoginMethod('phone'); setOtpSent(false); }}>Phone</Button>
           </div>
          
           {loginMethod === 'email' && (
              <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
           )}

           {loginMethod === 'phone' && !otpSent && (
              <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="e.g., 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
           )}
           
           {loginMethod === 'phone' && otpSent && (
                <div className="grid gap-2">
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input id="otp" type="text" placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} />
                    <Button variant="link" size="sm" className="p-0 h-auto justify-start" onClick={() => setOtpSent(false)}>Change phone number</Button>
                </div>
           )}

          {isSignUpMode && loginMethod === 'email' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="displayName">Full Name</Label>
                <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
              </div>
               <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                 <div><Label>Sign up as an Artisan</Label></div>
                 <Switch checked={role === 'artisan'} onCheckedChange={(checked) => setRole(checked ? 'artisan' : 'buyer')} />
               </div>
            </>
           )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
           {loginMethod === 'email' && <Button onClick={handleEmailSubmit} className="w-full" disabled={loading}>{loading ? 'Processing...' : (isSignUpMode ? 'Create Account' : 'Sign in')}</Button>}
           {loginMethod === 'phone' && !otpSent && <Button onClick={handlePhoneSubmit} className="w-full" disabled={loading}>{loading ? 'Sending...' : 'Send OTP'}</Button>}
           {loginMethod === 'phone' && otpSent && <Button onClick={handleOtpVerify} className="w-full" disabled={loading}>{loading ? 'Verifying...' : 'Verify OTP & Login'}</Button>}
          
          <div className="mt-4 text-center text-sm">
            {isSignUpMode ? 'Already have an account?' : "Don't have an account?"}{" "}
            <button onClick={toggleMode} className="underline">
              {isSignUpMode ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

