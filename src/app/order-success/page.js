"use client";

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

function OrderSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');

    return (
        <div className="flex min-h-[70vh] items-center justify-center">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <CardTitle className="mt-4 text-2xl">Order Placed Successfully!</CardTitle>
                    <CardDescription>
                        Thank you for your purchase. We&apos;ve received your order and will begin processing it shortly.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {orderId && (
                        <div className="rounded-md bg-muted p-3 text-sm">
                            Your Order ID is: <span className="font-semibold">{orderId}</span>
                        </div>
                    )}
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button className="w-full" onClick={() => router.push('/')}>
                            Continue Shopping
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => router.push('/my-orders')}>
                            View My Orders
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Wrap with Suspense for better handling of search parameters
export default function OrderSuccessPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <OrderSuccessContent />
        </Suspense>
    );
}
