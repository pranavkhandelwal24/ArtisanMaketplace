"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, Sparkles, X } from "lucide-react";

export function AddProductDialog() {
  const { user } = useAuth();
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleImageChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles(files);

      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  };
  
  const removeImage = (indexToRemove) => {
    setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const resetForm = () => {
    setProductName("");
    setPrice("");
    setDescription("");
    setImageFiles([]);
    setImagePreviews([]);
    setError("");
    setLoading(false);
  };
  
  const uploadFile = async (file) => {
    console.log("Starting upload for:", file.name);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    
    const timestamp = Math.round((new Date).getTime()/1000);
    const signatureResponse = await fetch('/api/sign-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            paramsToSign: { timestamp, folder: `products/${user?.uid}` },
        }),
    });
    
    if (!signatureResponse.ok) {
        const errorText = await signatureResponse.text();
        console.error("Signature API Error:", errorText);
        throw new Error('Failed to get upload signature.');
    }

    const { signature } = await signatureResponse.json();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', `products/${user?.uid}`);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const uploadResponse = await fetch(uploadUrl, { method: 'POST', body: formData });

    if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Cloudinary Upload Error:", errorText);
        throw new Error('Cloudinary upload failed for ' + file.name);
    }

    const uploadData = await uploadResponse.json();
    console.log("Successfully uploaded:", file.name);
    return uploadData.secure_url;
  };

  const handleSubmit = async () => {
    setError("");
    if (!productName || !price || !description || imageFiles.length === 0 || !user) {
      setError("Please fill out all fields and upload at least one image.");
      return;
    }

    setLoading(true);
    try {
      console.log("Starting product save process...");
      const imageUrls = await Promise.all(imageFiles.map(file => uploadFile(file)));
      console.log("All images uploaded. URLs:", imageUrls);

      await addDoc(collection(db, "products"), {
        artisanId: user.uid,
        artisanName: user.displayName,
        name: productName,
        price: parseFloat(price),
        description: description,
        imageUrls: imageUrls,
        createdAt: serverTimestamp(),
        isVerified: false,
      });
      console.log("Product data saved to Firestore.");

      setIsOpen(false);
      resetForm();

    } catch (e) {
      console.error("Error adding product: ", e);
      setError("Failed to add product. Check the console for details.");
    } finally {
      // Ensure loading is always set to false, even on error
      setLoading(false);
      console.log("Product save process finished.");
    }
  };

  const handleEnhanceDescription = async () => {
    if (!productName || !description) {
      setError("Please enter a product name and description first.");
      return;
    }
    setAiLoading(true);
    setError("");
    try {
      const response = await fetch('/api/ai/enhance-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, description }),
      });
      if (!response.ok) throw new Error("Failed to get a response from the AI.");
      const data = await response.json();
      setDescription(data.enhancedDescription);
    } catch (e) {
      console.error(e);
      setError("Could not enhance description. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open); }}>
      <DialogTrigger asChild>
        <Button>Add New Product</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add a New Product</DialogTitle>
          <DialogDescription>
            Fill in the details for your new item. You can add multiple images.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={productName} onChange={(e) => setProductName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">Price (₹)</Label>
            <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">Description</Label>
            <div className="col-span-3">
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
              <Button size="sm" variant="outline" onClick={handleEnhanceDescription} disabled={aiLoading} className="mt-2">
                {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Enhance with AI
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="picture" className="text-right pt-2">Images</Label>
            <div className="col-span-3">
              <Input id="picture" type="file" accept="image/*" multiple onChange={handleImageChange} />
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {imagePreviews.map((src, index) => (
                    <div key={index} className="relative">
                      <Image src={src} alt={`Preview ${index + 1}`} width={100} height={100} className="rounded-md object-cover aspect-square" />
                      <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removeImage(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {error && <p className="col-span-4 text-center text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Saving..." : "Save Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
