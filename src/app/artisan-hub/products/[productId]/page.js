"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, ArrowLeft, Sparkles, Lightbulb, BadgeDollarSign, Megaphone, Target, Camera, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

export default function ProductAnalyticsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const productId = params.productId;

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [aiError, setAiError] = useState('');

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
                return;
            }
            if (productId) {
                const productDocRef = doc(db, 'products', productId);
                const unsubscribe = onSnapshot(productDocRef, (docSnap) => {
                    if (docSnap.exists() && docSnap.data().artisanId === user.uid) {
                        setProduct({ id: docSnap.id, ...docSnap.data() });
                    } else {
                        router.push('/artisan-hub/products');
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching product:", error);
                    router.push('/artisan-hub/products');
                });
                return () => unsubscribe();
            }
        }
    }, [user, authLoading, router, productId]);
    
    const handleGenerateAnalysis = async () => {
        if (!product) return;
        setAiLoading(true);
        setAnalysis(null);
        setAiError('');
        try {
            const response = await fetch('/api/ai/analyze-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    views: product.views || 0,
                    sales: product.sales || 0,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to get a response from the AI service.");
            }
            const data = await response.json();
            setAnalysis(data);
        } catch (e) {
            setAiError(e.message || "An unknown error occurred.");
        } finally {
            setAiLoading(false);
        }
    };

    if (authLoading || loading || !product) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>;
    }

    return (
        <div className="flex flex-1 flex-col gap-4">
            <div>
                <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Products
                </Button>
                <h1 className="text-lg font-semibold md:text-2xl">Product Details & Analytics</h1>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{product.name}</CardTitle>
                            <CardDescription>Status: {product.isVerified ? "Approved" : "Pending Review"}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Image
                                src={product.imageUrls[0]} alt={product.name}
                                width={400} height={400}
                                className="rounded-lg object-cover w-full aspect-square mb-4 border"
                            />
                            <p className="font-bold text-2xl">₹{product.price.toFixed(2)}</p>
                            <p className="mt-2 text-muted-foreground text-sm">{product.description}</p>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    <Card>
                         <CardHeader>
                            <CardTitle>Performance Insights</CardTitle>
                            <CardDescription>This data is updated in real-time. Use it to generate an AI analysis.</CardDescription>
                         </CardHeader>
                        <CardContent>
                           <div className="grid grid-cols-2 gap-4 mb-6 text-center">
                               <div className="rounded-lg border p-4"><p className="text-2xl font-bold">{product.views || 0}</p><p className="text-sm text-muted-foreground">Views</p></div>
                               <div className="rounded-lg border p-4"><p className="text-2xl font-bold">{product.sales || 0}</p><p className="text-sm text-muted-foreground">Sales</p></div>
                           </div>
                           {!analysis && !aiLoading && (
                                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                                    <h3 className="text-lg font-semibold">Get Expert Advice</h3>
                                    <p className="text-muted-foreground mt-2 mb-4">Generate an AI-powered strategic report to get tips on pricing, marketing, and more.</p>
                                    <Button onClick={handleGenerateAnalysis}><Sparkles className="mr-2 h-4 w-4" />Generate AI Analysis</Button>
                                </div>
                           )}
                           {aiLoading && (
                               <div className="text-center p-8 border-2 border-dashed rounded-lg">
                                   <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                                   <p className="text-muted-foreground">Our AI is analyzing your product...</p>
                               </div>
                           )}
                           {aiError && <p className="text-red-500 text-sm text-center">{aiError}</p>}
                           {analysis && (
                               <div className="space-y-6">
                                   <h3 className="text-lg font-semibold text-center">AI-Powered Strategic Analysis</h3>
                                   <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg"><div className="bg-blue-100 p-2 rounded-full mt-1"><BadgeDollarSign className="h-5 w-5 text-blue-600" /></div><div><h4 className="font-semibold">Pricing Strategy</h4><p className="text-sm text-muted-foreground">{analysis.pricingAnalysis}</p></div></div>
                                   <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg"><div className="bg-purple-100 p-2 rounded-full mt-1"><Lightbulb className="h-5 w-5 text-purple-600" /></div><div><h4 className="font-semibold">Description Enhancement</h4><p className="text-sm text-muted-foreground">{analysis.descriptionSuggestion}</p></div></div>
                                   <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg"><div className="bg-green-100 p-2 rounded-full mt-1"><Megaphone className="h-5 w-5 text-green-600" /></div><div><h4 className="font-semibold">Marketing Idea</h4><p className="text-sm text-muted-foreground">{analysis.marketingIdea}</p></div></div>
                                   <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                                       <div className="bg-orange-100 p-2 rounded-full mt-1"><Target className="h-5 w-5 text-orange-600" /></div>
                                       <div>
                                           <h4 className="font-semibold">Ideal Customer: {analysis.idealCustomerPersona.name}</h4>
                                           <p className="text-sm text-muted-foreground">
                                                <strong>Age:</strong> {analysis.idealCustomerPersona.age_range}<br/>
                                                <strong>Interests:</strong> {analysis.idealCustomerPersona.interests}<br/>
                                                <strong>Values:</strong> {analysis.idealCustomerPersona.values}
                                           </p>
                                       </div>
                                   </div>
                                   <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg"><div className="bg-red-100 p-2 rounded-full mt-1"><Camera className="h-5 w-5 text-red-600" /></div><div><h4 className="font-semibold">Photography Tips</h4><p className="text-sm text-muted-foreground">{analysis.photographyTips}</p></div></div>
                                   <div className="p-4 bg-muted/50 rounded-lg">
                                       <h4 className="font-semibold flex items-center gap-2 mb-2"><Tags className="h-5 w-5"/> SEO Keywords</h4>
                                       <div className="flex flex-wrap gap-2">
                                            {analysis.seoKeywords.map(keyword => (<Badge key={keyword} variant="secondary">{keyword}</Badge>))}
                                       </div>
                                   </div>
                                   <Button variant="ghost" size="sm" onClick={handleGenerateAnalysis} className="w-full">Regenerate Analysis</Button>
                               </div>
                           )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

