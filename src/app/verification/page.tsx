"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function VerificationPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
    const [panFile, setPanFile] = useState<File | null>(null);
    const [gstFile, setGstFile] = useState<File | null>(null);
    const [addressProofFile, setAddressProofFile] = useState<File | null>(null);
    const [workProof, setWorkProof] = useState<File | null>(null);

    const [submissionStatus, setSubmissionStatus] = useState<'not_submitted' | 'pending' | 'submitted'>('not_submitted');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && user) {
            if (user.role === 'artisan' && user.isVerifiedArtisan) {
                router.push('/artisan-hub');
            } else if (user.role === 'buyer') {
                router.push('/');
            } else {
                const checkSubmission = async () => {
                    if (!user) return;
                    const submissionDocRef = doc(db, 'verificationSubmissions', user.uid);
                    const docSnap = await getDoc(submissionDocRef);
                    if (docSnap.exists() && docSnap.data().status === 'pending') {
                        setSubmissionStatus('pending');
                    }
                };
                checkSubmission();
            }
        } else if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);
    
    // Cloudinary Upload Function
    const uploadFile = async (file: File) => {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
        const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!;
        
        // 1. Get a signature from our secure API route
        const timestamp = Math.round((new Date).getTime()/1000);
        const signatureResponse = await fetch('/api/sign-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paramsToSign: {
                    timestamp: timestamp,
                    folder: `verification/${user?.uid}`
                },
            }),
        });
        
        if (!signatureResponse.ok) {
            // This will help debug if the API route itself fails
            const errorText = await signatureResponse.text();
            console.error("Signature API Error:", errorText);
            throw new Error('Failed to get upload signature.');
        }

        const { signature } = await signatureResponse.json();

        // 2. Upload the file directly to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        formData.append('folder', `verification/${user?.uid}`);

        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error("Cloudinary Upload Error:", errorText);
            throw new Error('Cloudinary upload failed');
        }

        const uploadData = await uploadResponse.json();
        return uploadData.secure_url;
    };


    const handleSubmit = async () => {
        if (!aadhaarFile || !panFile || !addressProofFile || !workProof || !user) {
            setError('Please upload all required documents.');
            return;
        }
        setLoading(true);
        setError('');

        try {
            // Upload all documents and get their URLs
            const aadhaarUrl = await uploadFile(aadhaarFile);
            const panUrl = await uploadFile(panFile);
            const addressProofUrl = await uploadFile(addressProofFile);
            const workProofUrl = await uploadFile(workProof);
            
            let gstUrl = null;
            if (gstFile) {
                gstUrl = await uploadFile(gstFile);
            }

            // Create submission document in Firestore with Cloudinary URLs
            await setDoc(doc(db, 'verificationSubmissions', user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                aadhaarUrl,
                panUrl,
                addressProofUrl,
                workProofUrl,
                gstUrl,
                status: 'pending',
                submittedAt: new Date(),
            });

            setSubmissionStatus('submitted');
        } catch (err) {
            console.error(err);
            setError('Something went wrong during the upload. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    if (authLoading || !user) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (submissionStatus === 'pending' || submissionStatus === 'submitted') {
        return (
            <div className="flex h-screen items-center justify-center p-4 text-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Verification Pending</CardTitle>
                        <CardDescription>
                            Your documents have been submitted and are currently under review. We will notify you via email once the process is complete. This usually takes 1-2 business days.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Artisan Verification</CardTitle>
                    <CardDescription>
                        To ensure the authenticity of our marketplace, please provide the following documents. Your information is kept secure and confidential.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="aadhaar-card">Aadhaar Card <span className="text-red-500">*</span></Label>
                            <Input id="aadhaar-card" type="file" accept="image/*,application/pdf" onChange={(e) => setAadhaarFile(e.target.files ? e.target.files[0] : null)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="pan-card">PAN Card <span className="text-red-500">*</span></Label>
                            <Input id="pan-card" type="file" accept="image/*,application/pdf" onChange={(e) => setPanFile(e.target.files ? e.target.files[0] : null)} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="address-proof">Business Address Proof <span className="text-red-500">*</span></Label>
                        <p className="text-sm text-muted-foreground">e.g., Electricity Bill, Rent Agreement</p>
                        <Input id="address-proof" type="file" accept="image/*,application/pdf" onChange={(e) => setAddressProofFile(e.target.files ? e.target.files[0] : null)} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="work-proof">Proof of Work <span className="text-red-500">*</span></Label>
                         <p className="text-sm text-muted-foreground">Photos of your workshop, tools, or you creating your products.</p>
                        <Input id="work-proof" type="file" accept="image/*,application/pdf" onChange={(e) => setWorkProof(e.target.files ? e.target.files[0] : null)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="gst-proof">GST Registration (Optional)</Label>
                        <Input id="gst-proof" type="file" accept="image/*,application/pdf" onChange={(e) => setGstFile(e.target.files ? e.target.files[0] : null)} />
                    </div>
                    {error && <p className="text-center text-red-500 text-sm">{error}</p>}
                    <Button onClick={handleSubmit} disabled={loading} className="w-full">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit for Verification'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

