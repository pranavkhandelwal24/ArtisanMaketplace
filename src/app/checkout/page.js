"use client";

import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc, addDoc, collection, serverTimestamp, runTransaction, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function CheckoutPage() {
    const { user, loading: authLoading } = useAuth();
    const { cartItems, totalPrice, cartCount, clearCart } = useCart();
    const router = useRouter();
    
    const [address, setAddress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);

    const deliveryCharge = 50.00;
    const finalTotal = totalPrice + deliveryCharge;

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login?redirect=/checkout');
            } else if (cartCount === 0) {
                router.push('/');
            } else {
                const fetchAddress = async () => {
                    const userDocRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(userDocRef);
                    if (docSnap.exists() && docSnap.data().shippingAddress) {
                        setAddress(docSnap.data().shippingAddress);
                    }
                    setLoading(false);
                };
                fetchAddress();
            }
        }
    }, [user, authLoading, router, cartCount]);
    
    const handlePlaceOrder = async () => {
        if (!user || !address || cartItems.length === 0) return;
        
        setPlacingOrder(true);
        try {
            const artisanIds = [...new Set(cartItems.map(item => item.artisanId))];
            const orderData = {
                buyerId: user.uid,
                artisanIds: artisanIds,
                shippingAddress: { ...address, name: user.displayName },
                items: cartItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    imageUrl: item.imageUrls[0],
                    artisanId: item.artisanId,
                })),
                subtotal: totalPrice,
                deliveryCharge: deliveryCharge,
                totalAmount: finalTotal,
                status: 'Packaging',
                paymentMethod: "Manual",
                paymentStatus: "Paid",
                createdAt: serverTimestamp(),
            };
            
            // Use a transaction to create the order and update sales counts atomically
            await runTransaction(db, async (transaction) => {
                const ordersCollectionRef = collection(db, "orders");
                const newOrderRef = doc(ordersCollectionRef);
                transaction.set(newOrderRef, orderData);

                for (const item of cartItems) {
                    const productRef = doc(db, "products", item.id);
                    transaction.update(productRef, {
                        sales: increment(item.quantity)
                    });
                }
            });
            
            clearCart();
            router.push(`/order-success?orderId=new`);

        } catch (error) {
            console.error("Error placing order:", error);
        } finally {
            setPlacingOrder(false);
        }
    };

    if (authLoading || loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <main className="container mx-auto max-w-4xl p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6">Checkout</h1>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Shipping Address</CardTitle>
                             <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
                                Change
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {address ? (
                                <div className="text-muted-foreground">
                                    <p className="font-semibold text-foreground">{user?.displayName}</p>
                                    <p>{address.line1}</p>
                                    {address.line2 && <p>{address.line2}</p>}
                                    <p>{address.city}, {address.state} - {address.pincode}</p>
                                    <p>Phone: {address.phone}</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-muted-foreground mb-4">Please add a shipping address.</p>
                                    <Button onClick={() => router.push('/settings')}>Add Address</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Review Items</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {cartItems.map(item => (
                                <div key={item.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Image src={item.imageUrls[0]} alt={item.name} width={64} height={64} className="rounded-md" />
                                        <div>
                                            <p className="font-semibold">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <p>₹{(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                
                <div className="lg:col-span-1">
                    <Card className="sticky top-20">
                        <CardHeader>
                            <CardTitle>Price Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="flex justify-between text-muted-foreground">
                               <span>Subtotal</span>
                               <span>₹{totalPrice.toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between text-muted-foreground">
                               <span>Delivery Charges</span>
                               <span>₹{deliveryCharge.toFixed(2)}</span>
                           </div>
                           <div className="border-t pt-4 flex items-center justify-between font-bold text-lg">
                                <p>Total Amount</p>
                                <p>₹{finalTotal.toFixed(2)}</p>
                           </div>
                            <Button onClick={handlePlaceOrder} className="w-full mt-4" disabled={!address || placingOrder}>
                                {placingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {placingOrder ? 'Placing Order...' : 'Place Order'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
