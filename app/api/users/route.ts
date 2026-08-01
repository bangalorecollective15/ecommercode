import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize the Admin Supabase client using the SERVICE_ROLE_KEY
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Secure server-side variable
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("query") || "").toLowerCase().trim();

  try {
    // Supabase Admin API method to pull auth directory records
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 50, // Increased page size to ensure filter pool covers your users
    });

    if (error) throw error;

    // Filter users dynamically
    const filteredUsers = users.filter((user) => {
      if (!search) return true;

      const emailMatch = user.email?.toLowerCase().includes(search);
      
      // Look for phone numbers at BOTH root level and nested user_metadata level
      const rootPhoneMatch = user.phone?.includes(search);
      const metaPhoneMatch = user.user_metadata?.phone?.includes(search);
      
      const nameMatch = user.user_metadata?.full_name?.toLowerCase().includes(search);

      return emailMatch || rootPhoneMatch || metaPhoneMatch || nameMatch;
    });

    // Format the profile array structures cleanly for your frontend mapping rules
    const formattedUsers = filteredUsers.map((u) => {
      // 1. Resolve Name: prioritization goes metadata name -> email identity prefix -> fallback
      const emailFallback = u.email ? u.email.split("@")[0] : "Auth User";
      const resolvedName = u.user_metadata?.full_name || emailFallback;

      // 2. Resolve Phone: looks at root, then looks at your nested metadata block
      const resolvedPhone = u.phone || u.user_metadata?.phone || "N/A";

      return {
        id: u.id,
        name: resolvedName.toUpperCase(), // Keeps typography styling consistent with your POS look
        phone: resolvedPhone,
        email: u.email,
      };
    });

    return NextResponse.json(formattedUsers);
  } catch (error: any) {
    console.error("User Directory API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}