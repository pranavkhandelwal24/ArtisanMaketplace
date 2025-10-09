"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, MoreHorizontal } from 'lucide-react';
import { AddProductDialog } from '@/components/artisans/AddProductDialog';
import { EditProductDialog } from '@/components/artisans/EditProductDialog';
import { collection, query, where, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from 'next/image';

// This component now handles both displaying and managing products
function MyProductsList({ user }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState(null);

    useEffect(() => {
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
    }, [user.uid]);

    const handleDelete = async (productId) => {
        if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, "products", productId));
            } catch (error) {
                console.error("Error deleting product:", error);
                alert("Failed to delete product. Please try again.");
            }
        }
    };

    if (loading) return <p className="text-center py-8">Loading products...</p>;

    return (
        <>
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Your Products</CardTitle>
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
                                        <TableCell className="font-medium">{product.name}</TableCell>
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
                                                    <DropdownMenuItem onSelect={() => setEditingProduct(product)}>Edit</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleDelete(product.id)}>Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">
                            You haven&apos;t added any products yet.
                        </p>
                    )}
                </CardContent>
            </Card>
            {editingProduct && (
                <EditProductDialog
                    product={editingProduct}
                    onOpenChange={() => setEditingProduct(null)}
                />
            )}
        </>
    );
}

// The main page component
export default function ArtisanHubPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (user.role === 'artisan' && !user.isVerifiedArtisan) {
        router.push('/verification');
      }
      else if (user.role === 'buyer') {
          router.push('/');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'artisan' || !user.isVerifiedArtisan) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-500" />
      </div>
    );
  }

  return (
    <main className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex flex-col items-start justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Welcome, {user.displayName || 'Artisan'}!
              </h1>
              <p className="text-muted-foreground">
                  Manage your products and view your sales here.
              </p>
          </div>
          <AddProductDialog />
      </div>
      
      <MyProductsList user={user} />
    </main>
  );
}
