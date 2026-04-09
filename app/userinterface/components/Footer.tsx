"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { 
  Instagram, 
  Facebook, 
  Youtube, 
  MessageCircle,
  Share2
} from "lucide-react";

// Initialize Supabase (Same as Header)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Category {
  id: number;
  name: string;
}

export default function Footer() {
  const [year, setYear] = useState<number | string>("");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    setYear(new Date().getFullYear());

    // Fetch Categories for Footer
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name")
        .order('priority', { ascending: true });
      if (data) setCategories(data);
    };

    fetchCategories();
  }, []);

  const SnapchatIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c-1.2 0-2.4.6-3.1 1.6-.4.5-.6 1.2-.6 1.9 0 .3 0 .5.1.7-.8.3-1.4.9-1.7 1.7-.1.4-.2.8-.2 1.2 0 .5.1 1 .4 1.4-.4.4-.6 1-.6 1.5 0 .6.2 1.2.6 1.6-.3.4-.4.9-.4 1.4 0 1.2.8 2.3 2 2.8.5.2 1 .3 1.5.3.3 0 .6 0 .9-.1.8 1.1 2 1.8 3.4 1.8s2.6-.7 3.4-1.8c.3.1.6.1.9.1.5 0 1-.1 1.5-.3 1.2-.5 2-1.6 2-2.8 0-.5-.1-1-.4-1.4.4-.4.6-1 .6-1.6 0-.5-.2-1.1-.6-1.5.3-.4.4-.9.4-1.4 0-.4-.1-.8-.2-1.2-.3-.8-.9-1.4-1.7-1.7.1-.2.1-.4.1-.7 0-.7-.2-1.4-.6-1.9C14.4 3.6 13.2 3 12 3z" />
    </svg>
  );

  return (
    <footer className="bg-gradient-to-b from-[#c4a174] to-[#8a6d3b] text-white border-t border-black/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* 1. Brand Identity */}
          <div className="space-y-6 col-span-1 md:col-span-1">
            <div className="relative w-40 h-12">
              <Image 
                src="/banglorecollectivelogo.jpg" 
                alt="Bangalore Collective" 
                fill
                className="object-contain brightness-0 invert"
              />
            </div>
            <p className="text-white/80 text-[12px] leading-relaxed font-medium max-w-xs">
              Curating elegance through fashion, redefining the modern Bangalore aesthetic.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { icon: <Instagram size={16} />, href: "https://www.instagram.com/bangalorecollectiveofficial" },
                { icon: <Facebook size={16} />, href: "https://www.facebook.com/people/Bangalore-Collective/61585467871164/" },
                { icon: <Youtube size={16} />, href: "https://www.youtube.com/@bangalore_collective" },
                { icon: <SnapchatIcon />, href: "https://www.snapchat.com/@blrcollective" },
                { icon: <MessageCircle size={16} />, href: "https://chat.whatsapp.com/BjHcvhyeckqDR304Q5SniW" },
                { icon: <Share2 size={16} />, href: "https://share.google/Ir6IhvGLTuzXYCEod" }
              ].map((social, i) => (
                <a key={i} href={social.href} target="_blank" rel="noopener noreferrer" className="p-2 bg-black/10 rounded-full hover:bg-white hover:text-[#8a6d3b] transition-all">
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* 2. Maison Navigation (Static) */}
          <div className="md:pl-4">
            <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-black/40 mb-6">Maison</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/userinterface/home" className="text-[12px] font-bold text-white/70 hover:text-black transition-all uppercase tracking-widest">Home</Link>
              </li>
              <li>
                <Link href="/userinterface/Gproducts" className="text-[12px] font-bold text-white/70 hover:text-black transition-all uppercase tracking-widest">Product Gallery</Link>
              </li>
              <li>
                <Link href="/userinterface/about" className="text-[12px] font-bold text-white/70 hover:text-black transition-all uppercase tracking-widest">About Us</Link>
              </li>
            </ul>
          </div>

          {/* 3. Dynamic Categories (From Supabase) */}
          <div>
            <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-black/40 mb-6">Collections</h3>
            <ul className="space-y-3">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link 
                    href={`/userinterface/Gproducts/category/${cat.id}`} 
                    className="text-[12px] font-bold text-white/70 hover:text-black transition-all uppercase tracking-widest"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              {/* Optional Static Link */}
              
            </ul>
          </div>

          {/* 4. Contact */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-black/40 mb-6">Concierge</h3>
            <div className="space-y-4">
              <div className="group">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-black/30 mb-1">Call</p>
                <a href="tel:+919060889995" className="text-[14px] font-bold text-white group-hover:text-black transition-colors">+91 9060889995</a>
              </div>
              <div className="group">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-black/30 mb-1">Email</p>
                <a href="mailto:bangalorecollective15@gmail.com" className="text-[14px] font-bold text-white group-hover:text-black transition-colors underline-offset-4 hover:underline">bangalorecollective15@gmail.com</a>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-black/30 mb-1">The Atelier</p>
                <p className="text-[12px] font-medium text-white/80 leading-tight">7th Block, Jayanagar, Bengaluru, Karnataka 560070</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-8 border-t border-black/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-wrap justify-center gap-6 items-center text-black/40 text-[9px] font-black uppercase tracking-[0.3em]">
            <p>© {year} Bangalore Collective</p>
            <Link href="/userinterface/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/userinterface/terms-and-conditions" className="hover:text-white transition-colors">Terms & Conditions</Link>
          </div>
          
          <p className="text-black/40 text-[9px] font-black uppercase tracking-[0.3em]">
            Developed by <a href="https://rakvih.in/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-black transition-colors">Rakvih</a>
          </p>
        </div>
      </div>
    </footer>
  );
}