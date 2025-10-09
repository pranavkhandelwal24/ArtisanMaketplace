"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, Sparkles, X, Video } from "lucide-react";

export function AddProductDialog() {
  const { user } = useAuth();
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      const filePreviews = selectedFiles.map(file => ({
          url: URL.createObjectURL(file),
          type: file.type,
      }));
      setPreviews(filePreviews);
    }
  };
  
  const removeFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const resetForm = () => {
    setProductName(""); setPrice(""); setDescription(""); setCategory("");
    setFiles([]); setPreviews([]); setError(""); setLoading(false);
  };
  
  const uploadFile = async (file) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const isVideo = file.type.startsWith('video');
    const resourceType = isVideo ? 'video' : 'image';
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    const timestamp = Math.round((new Date).getTime()/1000);
    const signatureResponse = await fetch('/api/sign-image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paramsToSign: { timestamp, folder: `products/${user?.uid}` } }),
    });
    if (!signatureResponse.ok) throw new Error('Failed to get upload signature.');
    const { signature } = await signatureResponse.json();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', `products/${user?.uid}`);

    const uploadResponse = await fetch(uploadUrl, { method: 'POST', body: formData });
    if (!uploadResponse.ok) throw new Error(`Cloudinary upload failed for ${file.name}`);
    const uploadData = await uploadResponse.json();
    
    return { url: uploadData.secure_url, type: resourceType };
  };

  const handleSubmit = async () => {
    setError("");
    if (!productName || !price || !description || !category || files.length === 0 || !user) {
      setError("Please fill all fields, select a category, and upload at least one file.");
      return;
    }
    setLoading(true);
    try {
      const mediaData = await Promise.all(files.map(file => uploadFile(file)));
      await addDoc(collection(db, "products"), {
        artisanId: user.uid, artisanName: user.displayName,
        name: productName, price: parseFloat(price), description, category,
        media: mediaData,
        imageUrls: mediaData.filter(m => m.type === 'image').map(m => m.url),
        createdAt: serverTimestamp(), isVerified: false,
      });
      setIsOpen(false);
      resetForm();
    } catch (e) {
      setError("Failed to add product. Check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnhanceDescription = async () => {
    // This function can be filled in later
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open); }}>
      <DialogTrigger asChild><Button>Add New Product</Button></DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add a New Product</DialogTitle>
          <DialogDescription>Fill in the details for your new item. You can add multiple images and videos.</DialogDescription>
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Category</Label>
             <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="pottery">Pottery</SelectItem>
                    <SelectItem value="textiles">Textiles</SelectItem>
                    <SelectItem value="woodwork">Woodwork</SelectItem>
                    <SelectItem value="jewelry">Jewelry</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                </SelectContent>
             </Select>
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
            <Label htmlFor="files" className="text-right pt-2">Media</Label>
            <div className="col-span-3">
              <Input id="files" type="file" accept="image/*,video/*" multiple onChange={handleFileChange} />
              {previews.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative">
                      {preview.type.startsWith('video') ? (
                          <div className="relative aspect-square w-full rounded-md bg-black flex items-center justify-center">
                            <Video className="h-8 w-8 text-white" />
                          </div>
                      ) : (
                          <Image src={preview.url} alt={`Preview ${index + 1}`} width={100} height={100} className="rounded-md object-cover aspect-square" />
                      )}
                      <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removeFile(index)}>
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

