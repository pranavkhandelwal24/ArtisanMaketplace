"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, MoreHorizontal, Sparkles, LineChart } from 'lucide-react';
import { AddProductDialog } from '@/components/artisans/AddProductDialog';
import { EditProductDialog } from '@/components/artisans/EditProductDialog';
import { AIImageGeneratorDialog } from '@/components/artisans/AIImageGeneratorDialog';
import { collection, query, where, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from 'next/image';
import Link from 'next/link';

export default function MyProductsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState(null);
    const [generatingImageFor, setGeneratingImageFor] = useState(null);

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== 'artisan') {
                router.push('/');
            } else {
                const q = query(collection(db, "products"), where("artisanId", "==", user.uid));
                const unsubscribe = onSnapshot(q, (querySnapshot) => {
                    const productsData = [];
                    querySnapshot.forEach((doc) => {
                        productsData.push({ id: doc.id, ...doc.data() });
                    });
                    setProducts(productsData);
                    setLoading(false);
                });
                return () => unsubscribe();
            }
        }
    }, [user, authLoading, router]);

    const handleDelete = async (productId) => {
        // For simplicity and to avoid build issues, confirmation is removed.
        // A custom confirmation modal would be a great future addition.
        try {
            await deleteDoc(doc(db, "products", productId));
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("Failed to delete product. Please try again.");
        }
    };

    if (authLoading || loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <div className="flex flex-1 flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">My Products</h1>
                <AddProductDialog />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Your Product Inventory</CardTitle>
                    <CardDescription>Manage your products, edit details, and access AI tools.</CardDescription>
                </CardHeader>
                <CardContent>
                    {products.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="hidden sm:table-cell">
                                            <Image
                                              alt={product.name}
                                              className="aspect-square rounded-md object-cover"
                                              height="64"
                                              src={product.imageUrls[0] || "https://placehold.co/64x64"}
                                              width="64"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <Link href={`/artisan-hub/products/${product.id}`} className="hover:underline">
                                                {product.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>₹{product.price.toFixed(2)}</TableCell>
                                        <TableCell>
                                          {product.isVerified ? 'Approved' : 'Pending Review'}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onSelect={() => setEditingProduct(product)}>Edit Details</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleDelete(product.id)}>Delete</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onSelect={() => setGeneratingImageFor(product)}>
                                                        <Sparkles className="mr-2 h-4 w-4" />
                                                        AI Image Tools
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/artisan-hub/products/${product.id}`} className="flex items-center">
                                                           <LineChart className="mr-2 h-4 w-4" />
                                                            AI Analytics
                                                        </Link>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                         <div className="text-center py-16 rounded-lg border-2 border-dashed">
                            <h2 className="text-2xl font-semibold">No Products Yet</h2>
                            <p className="text-muted-foreground mt-2">Click the &quot;Add New Product&quot; button to get started.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {editingProduct && (
                <EditProductDialog
                    product={editingProduct}
                    onOpenChange={() => setEditingProduct(null)}
                />
            )}
            
            {generatingImageFor && (
                <AIImageGeneratorDialog
                    product={generatingImageFor}
                    onOpenChange={() => setGeneratingImageFor(null)}
                />
            )}
        </div>
    );
}

