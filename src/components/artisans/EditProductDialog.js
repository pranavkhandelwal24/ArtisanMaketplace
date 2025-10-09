"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { Loader2, X, Video } from "lucide-react";

export function EditProductDialog({ product, onOpenChange }) {
  const { user } = useAuth();

  // State for existing product data
  const [productName, setProductName] = useState(product.name);
  const [price, setPrice] = useState(product.price.toString());
  const [description, setDescription] = useState(product.description);
  const [category, setCategory] = useState(product.category);
  const [existingMedia, setExistingMedia] = useState(product.media || []);

  // State for new files to be uploaded
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setNewFiles(selectedFiles);
      const filePreviews = selectedFiles.map(file => ({
          url: URL.createObjectURL(file),
          type: file.type,
      }));
      setNewPreviews(filePreviews);
    }
  };
  
  // This will only remove newly added previews, not existing media
  const removeNewPreview = (indexToRemove) => {
    setNewFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setNewPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  // You would need to add logic to delete from Cloudinary for this to be complete
  const removeExistingMedia = (indexToRemove) => {
      alert("Functionality to delete existing media from Cloudinary can be added here.");
      // setExistingMedia(prev => prev.filter((_, index) => index !== indexToRemove));
  }

  const uploadFile = async (file) => {
    // This function is identical to the one in AddProductDialog
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
    if (!productName || !price || !description || !category) {
      setError("Please fill all required fields.");
      return;
    }
    setLoading(true);
    try {
      let newMediaData = [];
      if (newFiles.length > 0) {
        newMediaData = await Promise.all(newFiles.map(file => uploadFile(file)));
      }

      const productDocRef = doc(db, "products", product.id);
      await updateDoc(productDocRef, {
        name: productName,
        price: parseFloat(price),
        description,
        category,
        media: arrayUnion(...newMediaData), // Add new media to the existing array
        // Update imageUrls for compatibility, adding only new images
        imageUrls: arrayUnion(...newMediaData.filter(m => m.type === 'image').map(m => m.url)),
      });

      onOpenChange(false); // Close dialog on success
    } catch (e) {
      console.error("Error updating product:", e);
      setError("Failed to update product. Check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Make changes to your product. Add or remove media as needed.</DialogDescription>
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
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Existing Media</Label>
             <div className="col-span-3">
                {existingMedia.length > 0 ? (
                    <div className="mt-2 grid grid-cols-3 gap-4">
                    {existingMedia.map((media, index) => (
                        <div key={index} className="relative">
                        {media.type === 'video' ? (
                            <div className="relative aspect-square w-full rounded-md bg-black flex items-center justify-center">
                                <Video className="h-8 w-8 text-white" />
                            </div>
                        ) : (
                            <Image src={media.url} alt={`Media ${index + 1}`} width={100} height={100} className="rounded-md object-cover aspect-square" />
                        )}
                        </div>
                    ))}
                    </div>
                ) : <p className="text-sm text-muted-foreground pt-2">No media uploaded yet.</p>}
             </div>
          </div>
           <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="files" className="text-right pt-2">Add New Media</Label>
            <div className="col-span-3">
              <Input id="files" type="file" accept="image/*,video/*" multiple onChange={handleFileChange} />
              {newPreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {newPreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      {preview.type.startsWith('video') ? (
                          <div className="relative aspect-square w-full rounded-md bg-black flex items-center justify-center">
                            <Video className="h-8 w-8 text-white" />
                          </div>
                      ) : (
                          <Image src={preview.url} alt={`Preview ${index + 1}`} width={100} height={100} className="rounded-md object-cover aspect-square" />
                      )}
                      <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removeNewPreview(index)}>
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
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

