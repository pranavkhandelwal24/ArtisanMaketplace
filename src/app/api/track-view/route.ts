import { db } from "@/lib/firebase-admin";
import { increment } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { productId } = await request.json();
        if (!productId) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
        }

        const productRef = db.collection('products').doc(productId);
        
        // Use the admin SDK to increment the view count atomically
        await productRef.update({
            views: increment(1)
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error tracking view:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
