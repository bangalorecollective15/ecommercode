import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {}
        },
      },
    }
  );
}

export async function GET() {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from('site_info').select('*').eq('id', 1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return NextResponse.json(data || {});
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseClient();
    const { type, ...body } = await request.json();

       const updatePayload: any = { updated_at: new Date().toISOString() };
    if (type === "texts") {
      updatePayload.short_description = body.short_description;
      updatePayload.long_description = body.long_description;
    } else if (type === "socials") {
      updatePayload.instagram = body.instagram;
      updatePayload.youtube = body.youtube;
      updatePayload.snapchat = body.snapchat;
      updatePayload.facebook = body.facebook;
      updatePayload.whatsapp = body.whatsapp;
      updatePayload.google = body.google;
    }

    const { data, error } = await supabase.from('site_info').upsert({ id: 1, ...updatePayload }).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}