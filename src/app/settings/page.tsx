"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    
    const [address, setAddress] = useState({
        line1: '',
        line2: '',
        city: '',
        state: '',
        pincode: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            const fetchAddress = async () => {
                const userDocRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists() && docSnap.data().shippingAddress) {
                    setAddress(docSnap.data().shippingAddress);
                }
            };
            fetchAddress();
        }
    }, [user, authLoading, router]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setAddress(prev => ({...prev, [id]: value}));
    };

    const handleSubmit = async () => {
        if (!user) return;
        setLoading(true);
        setSuccess(false);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                shippingAddress: address
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000); // Hide success message after 3s
        } catch (error) {
            console.error("Failed to update address:", error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !user) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <main className="container mx-auto p-4 md:p-8">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>Manage your account and shipping details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold">Shipping Address</h3>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="line1">Address Line 1</Label>
                                <Input id="line1" value={address.line1} onChange={handleInputChange} placeholder="House No., Building Name" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="line2">Address Line 2</Label>
                                <Input id="line2" value={address.line2} onChange={handleInputChange} placeholder="Area, Colony, Street" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input id="city" value={address.city} onChange={handleInputChange} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input id="state" value={address.state} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="pincode">Pincode</Label>
                                    <Input id="pincode" value={address.pincode} onChange={handleInputChange} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" value={address.phone} onChange={handleInputChange} type="tel" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Changes
                    </Button>
                    {success && <p className="text-sm text-green-600">Address updated successfully!</p>}
                </CardContent>
            </Card>
        </main>
    );
}
