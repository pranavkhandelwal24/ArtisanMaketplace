"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function MyOrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login?redirect=/my-orders');
            } else {
                const fetchOrders = async () => {
                    setLoading(true);
                    try {
                        const q = query(
                            collection(db, "orders"), 
                            where("buyerId", "==", user.uid),
                            orderBy("createdAt", "desc") // Show newest orders first
                        );
                        const querySnapshot = await getDocs(q);
                        const userOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        setOrders(userOrders);
                    } catch (error) {
                        console.error("Error fetching orders:", error);
                    } finally {
                        setLoading(false);
                    }
                };
                fetchOrders();
            }
        }
    }, [user, authLoading, router]);

    if (authLoading || loading) {
        return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <main className="container mx-auto max-w-4xl p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6">My Orders</h1>
            {orders.length > 0 ? (
                <div className="space-y-6">
                    {orders.map(order => (
                        <Card key={order.id}>
                            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                                <div>
                                    <CardTitle>Order #{order.id.substring(0, 8)}</CardTitle>
                                    <CardDescription>
                                        Placed on: {new Date(order.createdAt.seconds * 1000).toLocaleDateString()}
                                    </CardDescription>
                                </div>
                                <div className="mt-2 md:mt-0">
                                    <p>Status: <span className="font-semibold">{order.status}</span></p>
                                    <p className="font-bold">Total: ₹{order.totalAmount.toFixed(2)}</p>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4">
                                            <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="rounded-md" />
                                            <div>
                                                <p className="font-medium">{item.name}</p>
                                                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <h2 className="text-2xl font-semibold">No Orders Found</h2>
                    <p className="text-muted-foreground mt-2">You haven&apos;t placed any orders yet.</p>
                    <Button className="mt-4" onClick={() => router.push('/')}>Start Shopping</Button>
                </div>
            )}
        </main>
    );
}
