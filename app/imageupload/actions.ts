'use server';

import supabase from '@/lib/supabase';

// This function now only handles DB registration
export async function registerImageInDb(productId: string, publicUrl: string) {
  await supabase.from('product_images').insert([{ product_id: productId, image_url: publicUrl }]);
  return { success: true };
}

// Helper to delete old records
export async function clearOldImages(productId: string) {
  const { data: existing } = await supabase.from('product_images').select('id, image_url').eq('product_id', productId);
  if (existing) {
    for (const img of existing) {
      const name = img.image_url.split('/').pop();
      if (name) await supabase.storage.from('product-images').remove([name]);
      await supabase.from('product_images').delete().eq('id', img.id);
    }
  }
}