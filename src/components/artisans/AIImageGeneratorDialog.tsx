"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DocumentData } from "firebase/firestore";
import { Loader2, Sparkles } from "lucide-react";
import Image from "next/image";

interface AIImageGeneratorDialogProps {
  product: DocumentData;
  onOpenChange: (open: boolean) => void;
}

export function AIImageGeneratorDialog({ product, onOpenChange }: AIImageGeneratorDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    setLoading(true);
    setError("");
    setGeneratedImage(null);

    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: product.name,
          productDescription: product.description,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate image. The AI service might be busy.");
      }

      const data = await response.json();
      setGeneratedImage(data.imageData);

    } catch (e: any) {
      console.error("Image generation error:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToProduct = () => {
    // In a future step, this will save the new image URL to the product in Firestore.
    alert("Functionality to save this image to the product will be added next!");
    onOpenChange(false);
  };


  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>AI Lifestyle Photo Generator</DialogTitle>
          <DialogDescription>
            Generate a new, professional lifestyle photo for your product "{product.name}".
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center gap-4 py-4">
            {loading && (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-10 w-10 animate-spin" />
                    <p>Generating your image... this may take a moment.</p>
                </div>
            )}
            
            {generatedImage && !loading && (
                <div className="w-full">
                    <Image
                        src={generatedImage}
                        alt="AI generated lifestyle photo"
                        width={400}
                        height={400}
                        className="rounded-lg object-cover mx-auto"
                    />
                </div>
            )}

            {!generatedImage && !loading && (
                 <div className="text-center p-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Your new image will appear here.</p>
                </div>
            )}

            {error && <p className="text-center text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          {generatedImage ? (
             <Button onClick={handleAddToProduct}>Add to Product</Button>
          ) : (
            <Button onClick={handleGenerateImage} disabled={loading}>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate New Image
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
