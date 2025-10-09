"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function AdminProductApprovalPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Security check: ensure user is logged in and is an admin
    useEffect(() => {
        if (!authLoading && (!user || !user.isAdmin)) {
            router.push('/'); // Redirect non-admins
        } else if (!authLoading && user) {
            fetchPendingProducts();
        }
    }, [user, authLoading, router]);

    const fetchPendingProducts = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "products"), where("isVerified", "==", false));
            const querySnapshot = await getDocs(q);
            const pendingProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(pendingProducts);
        } catch (error) {
            console.error("Error fetching pending products:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (productId) => {
        try {
            const productDocRef = doc(db, 'products', productId);
            await updateDoc(productDocRef, { isVerified: true });
            // Refresh the list after approval
            fetchPendingProducts();
        } catch (error) {
            console.error("Error approving product:", error);
        }
    };

    if (authLoading || loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <main className="container mx-auto p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Product Approval Queue</CardTitle>
                    <CardDescription>Review new products submitted by artisans before they go live.</CardDescription>
                </CardHeader>
                <CardContent>
                    {products.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Image</TableHead>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead>Artisan</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map(product => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <Image
                                              alt={product.name}
                                              className="aspect-square rounded-md object-cover"
                                              height="64"
                                              src={product.imageUrls[0] || "https://placehold.co/64x64"}
                                              width="64"
                                            />
                                        </TableCell>
                                        <TableCell>{product.name}</TableCell>
                                        <TableCell>{product.artisanName}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" onClick={() => handleApprove(product.id)}>Approve</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No products are pending approval.</p>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
