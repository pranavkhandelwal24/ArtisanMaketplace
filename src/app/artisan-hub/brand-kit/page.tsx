"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles } from 'lucide-react';
import { BrandKitDisplay } from '@/components/artisans/BrandKitDisplay';
import { useAuth } from '@/context/AuthContext'; // 1. Import useAuth
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // 2. Import Firestore functions
import { db } from '@/lib/firebase';

// Define the type for the brand kit
type BrandKit = {
  missionStatement: string;
  tagline: string;
  colorPalette: { name: string; hex: string }[];
  fontPairing: {
    headline: { name: string; weight: string };
    body: { name: string; weight: string };
  };
  logoIdeas: string[];
};

export default function BrandKitPage() {
    const { user } = useAuth(); // Get the current user
    const [brandName, setBrandName] = useState('');
    const [brandDescription, setBrandDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [brandKit, setBrandKit] = useState<BrandKit | null>(null);

    // 3. Fetch existing brand kit when the page loads
    useEffect(() => {
        if (user) {
            const fetchBrandKit = async () => {
                const userDocRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists() && docSnap.data().brandKit) {
                    setBrandKit(docSnap.data().brandKit);
                }
            };
            fetchBrandKit();
        }
    }, [user]);

    const handleSubmit = async () => {
        if (!brandName || !brandDescription || !user) {
            setError('Please provide a brand name, description, and be logged in.');
            return;
        }
        setLoading(true);
        setError('');
        setBrandKit(null);

        try {
            const response = await fetch('/api/ai/generate-brand-kit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brandName, brandDescription }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate brand kit.');
            }

            const data: BrandKit = await response.json();
            setBrandKit(data);

            // 4. Save the newly generated brand kit to the user's profile
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                brandKit: data,
            });

        } catch (e: any) {
            console.error(e);
            setError(e.message || 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-1 flex-col gap-4">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">AI Brand Kit Generator</h1>
            </div>
            
            {/* Don't show the form if a brand kit already exists */}
            {!brandKit && (
                <div className="flex flex-col gap-4 rounded-lg border p-4 shadow-sm md:gap-8 md:p-6">
                    <div className="grid gap-2">
                        <h2 className="text-xl font-semibold">Define Your Brand</h2>
                        <p className="text-muted-foreground">
                            Tell our AI about your brand, and we'll generate a professional brand identity for you.
                        </p>
                    </div>
                    <div className="grid gap-6">
                        <div className="grid gap-3">
                            <Label htmlFor="brand-name">Brand Name</Label>
                            <Input
                                id="brand-name"
                                type="text"
                                className="w-full"
                                placeholder="e.g., Earth & Ember Pottery"
                                value={brandName}
                                onChange={(e) => setBrandName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="brand-description">Brand Description (What do you create?)</Label>
                            <Textarea
                                id="brand-description"
                                className="min-h-32"
                                placeholder="e.g., I create minimalist, earth-toned ceramic tableware inspired by nature."
                                value={brandDescription}
                                onChange={(e) => setBrandDescription(e.target.value)}
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <Button onClick={handleSubmit} disabled={loading} className="w-fit">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Generate My Brand Kit
                        </Button>
                    </div>
                </div>
            )}

            {brandKit && <BrandKitDisplay kit={brandKit} />}
        </div>
    );
}

