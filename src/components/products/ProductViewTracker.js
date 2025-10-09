"use client";

import { useEffect } from 'react';

export function ProductViewTracker({ productId }) {
    useEffect(() => {
        // This function is called only once when the component mounts
        const trackView = async () => {
            try {
                await fetch('/api/track-view', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId }),
                });
            } catch (error) {
                console.error("Failed to track view:", error);
            }
        };

        trackView();
    }, [productId]); // The effect depends on the productId

    // This component renders nothing to the screen
    return null;
}
