'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { clearOldImages, registerImageInDb } from './actions';
import { UploadCloud, Loader2 } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function BulkUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploading(true);
    const cleanedProducts = new Set<string>();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const match = file.name.match(/product_id (\d+)/i);
      const productId = match ? match[1] : null;

      if (productId) {
        // 1. Clear old data if needed
        if (!cleanedProducts.has(productId)) {
          await clearOldImages(productId);
          cleanedProducts.add(productId);
        }

        // 2. Direct Upload to Supabase (Bypassing Next.js Server)
        const fileName = `${productId}_${Date.now()}_${i}.jpg`;
        const { data, error } = await supabase.storage.from('product-images').upload(fileName, file);

        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
          await registerImageInDb(productId, publicUrl);
        }
      }
      setProgress(i + 1);
    }
    setUploading(false);
    alert('Upload complete!');
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded-3xl shadow-xl border border-slate-100">
      <h1 className="text-2xl font-black text-[#2b2652] mb-2">Bulk Asset Uploader</h1>
      
      {!uploading ? (
        <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-[#c4a174] transition-all">
          <UploadCloud className="text-slate-300 mb-4" size={40} />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#2b2652]">Select 1200+ Files</span>
          <input type="file" multiple onChange={handleUpload} className="hidden" accept="image/*" />
        </label>
      ) : (
        <div className="space-y-6">
          <p className="text-xl font-black text-[#2b2652]">Uploaded: {progress}</p>
          <Loader2 className="animate-spin text-[#c4a174]" size={24} />
        </div>
      )}
    </div>
  );
}