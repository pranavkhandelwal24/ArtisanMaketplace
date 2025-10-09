"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminDeliveriesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    
    const [activeOrders, setActiveOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user || !user.isAdmin) {
                router.push('/'); // Security: redirect non-admins
            } else {
                fetchActiveOrders();
            }
        }
    }, [user, authLoading, router]);

    const fetchActiveOrders = async () => {
        setLoading(true);
        try {
            const ordersRef = collection(db, "orders");
            const q = query(
                ordersRef, 
                where("status", "in", ["Ready for Pickup", "Shipped", "Out for Delivery"]),
                orderBy("createdAt", "asc")
            );
            const querySnapshot = await getDocs(q);
            const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setActiveOrders(orders);
        } catch (error) {
            console.error("Error fetching active orders:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleStatusChange = async (orderId, newStatus) => {
        const orderDocRef = doc(db, "orders", orderId);
        await updateDoc(orderDocRef, { status: newStatus });
        fetchActiveOrders(); // Refresh the list
    };

    if (authLoading || loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <main className="container mx-auto p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Delivery Management</CardTitle>
                    <CardDescription>
                        Manage orders that are ready for pickup or are currently in transit.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {activeOrders.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Buyer</TableHead>
                                    <TableHead>Shipping City</TableHead>
                                    <TableHead>Current Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">#{order.id.substring(0, 8)}</TableCell>
                                        <TableCell>{order.shippingAddress.name}</TableCell>
                                        <TableCell>{order.shippingAddress.city}</TableCell>
                                        <TableCell>
                                            <span className="font-semibold">{order.status}</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                                    <DropdownMenuItem onSelect={() => handleStatusChange(order.id, 'Shipped')}>
                                                        Mark as Shipped
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleStatusChange(order.id, 'Out for Delivery')}>
                                                        Mark as Out for Delivery
                                                    </DropdownMenuItem>
                                                     <DropdownMenuItem onSelect={() => handleStatusChange(order.id, 'Delivered')}>
                                                        Mark as Delivered
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-16">
                            <h2 className="text-2xl font-semibold">All Clear!</h2>
                            <p className="text-muted-foreground mt-2">There are no orders currently awaiting pickup or in transit.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}

