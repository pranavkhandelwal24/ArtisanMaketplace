"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, ArrowLeft, Sparkles, Lightbulb, BadgeDollarSign, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

// Define the shape of the AI analysis for type safety
type AnalysisResult = {
    pricingAnalysis: string;
    descriptionSuggestion: string;
    marketingIdea: string;
};

export default function ProductAnalyticsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const productId = params.productId as string;

    const [product, setProduct] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [aiError, setAiError] = useState('');

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
                return;
            }
            if (productId) {
                const fetchProduct = async () => {
                    setLoading(true);
                    try {
                        const productDocRef = doc(db, 'products', productId);
                        const docSnap = await getDoc(productDocRef);

                        if (docSnap.exists() && docSnap.data().artisanId === user.uid) {
                            setProduct({ id: docSnap.id, ...docSnap.data() });
                        } else {
                            router.push('/artisan-hub/products');
                        }
                    } catch (error) {
                        console.error("Error fetching product:", error);
                        router.push('/artisan-hub/products');
                    } finally {
                        setLoading(false);
                    }
                };
                fetchProduct();
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
                }),
            });
            
            if (!response.ok) {
                throw new Error("Failed to get a response from the AI service.");
            }

            const data: AnalysisResult = await response.json();
            setAnalysis(data);

        } catch (e: any) {
            console.error(e);
            setAiError(e.message || "An unknown error occurred.");
        } finally {
            setAiLoading(false);
        }
    };

    if (authLoading || loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    if (!product) {
        return null;
    }

    return (
        <div className="flex flex-1 flex-col gap-4">
            <div>
                <Button variant="outline" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Products
                </Button>
                <h1 className="text-lg font-semibold md:text-2xl">Product Details & Analytics</h1>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>{product.name}</CardTitle>
                            <CardDescription>Status: {product.isVerified ? "Approved" : "Pending Review"}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Image
                                src={product.imageUrls[0]} alt={product.name}
                                width={400} height={400}
                                className="rounded-lg object-cover w-full aspect-square mb-4"
                            />
                            <p className="font-bold text-2xl">₹{product.price.toFixed(2)}</p>
                            <p className="mt-2 text-muted-foreground">{product.description}</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2">
                    <Card>
                         <CardHeader>
                            <CardTitle>Performance Insights</CardTitle>
                            <CardDescription>
                                Our AI can analyze your product's performance and provide expert suggestions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           {/* Static Data - to be replaced with real data later */}
                           <div className="grid grid-cols-2 gap-4 mb-6 text-center">
                               <div className="rounded-lg border p-4"><p className="text-2xl font-bold">0</p><p className="text-sm text-muted-foreground">Views (30 days)</p></div>
                               <div className="rounded-lg border p-4"><p className="text-2xl font-bold">0</p><p className="text-sm text-muted-foreground">Sales</p></div>
                           </div>
                           
                           {/* AI Analysis Section */}
                           {!analysis && !aiLoading && (
                                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                                    <h3 className="text-lg font-semibold">Get Expert Advice</h3>
                                    <p className="text-muted-foreground mt-2 mb-4">
                                        Generate an AI-powered report to get concrete tips on how to improve your product listing, description, and pricing to attract more buyers.
                                    </p>
                                    <Button onClick={handleGenerateAnalysis}>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Generate AI Analysis
                                    </Button>
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
                                   <div className="flex items-start gap-4">
                                       <div className="bg-blue-100 p-2 rounded-full"><BadgeDollarSign className="h-5 w-5 text-blue-600" /></div>
                                       <div>
                                           <h4 className="font-semibold">Pricing Strategy</h4>
                                           <p className="text-sm text-muted-foreground">{analysis.pricingAnalysis}</p>
                                       </div>
                                   </div>
                                   <div className="flex items-start gap-4">
                                       <div className="bg-purple-100 p-2 rounded-full"><Lightbulb className="h-5 w-5 text-purple-600" /></div>
                                       <div>
                                           <h4 className="font-semibold">Description Enhancement</h4>
                                           <p className="text-sm text-muted-foreground">{analysis.descriptionSuggestion}</p>
                                       </div>
                                   </div>
                                   <div className="flex items-start gap-4">
                                       <div className="bg-green-100 p-2 rounded-full"><Megaphone className="h-5 w-5 text-green-600" /></div>
                                       <div>
                                           <h4 className="font-semibold">Marketing Tip</h4>
                                           <p className="text-sm text-muted-foreground">{analysis.marketingIdea}</p>
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

