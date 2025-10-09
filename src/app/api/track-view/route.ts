import { db } from "@/lib/firebase-admin";
// THE FIX: Import 'FieldValue' instead of 'increment'
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { productId } = await request.json();
        if (!productId) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
        }

        const productRef = db.collection('products').doc(productId);
        
        // THE FIX: Use FieldValue.increment() to update the count
        await productRef.update({
            views: FieldValue.increment(1)
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error tracking view:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

