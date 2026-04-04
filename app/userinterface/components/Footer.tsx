"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Instagram, 
  Facebook, 
  Youtube, 
  MessageCircle,
  Share2
} from "lucide-react";

export default function Footer() {
  const [year, setYear] = useState<number | string>("");

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const SnapchatIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c-1.2 0-2.4.6-3.1 1.6-.4.5-.6 1.2-.6 1.9 0 .3 0 .5.1.7-.8.3-1.4.9-1.7 1.7-.1.4-.2.8-.2 1.2 0 .5.1 1 .4 1.4-.4.4-.6 1-.6 1.5 0 .6.2 1.2.6 1.6-.3.4-.4.9-.4 1.4 0 1.2.8 2.3 2 2.8.5.2 1 .3 1.5.3.3 0 .6 0 .9-.1.8 1.1 2 1.8 3.4 1.8s2.6-.7 3.4-1.8c.3.1.6.1.9.1.5 0 1-.1 1.5-.3 1.2-.5 2-1.6 2-2.8 0-.5-.1-1-.4-1.4.4-.4.6-1 .6-1.6 0-.5-.2-1.1-.6-1.5.3-.4.4-.9.4-1.4 0-.4-.1-.8-.2-1.2-.3-.8-.9-1.4-1.7-1.7.1-.2.1-.4.1-.7 0-.7-.2-1.4-.6-1.9C14.4 3.6 13.2 3 12 3z" />
    </svg>
  );

  return (
    <footer className="bg-[#080808] text-white border-t border-white/5 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        {/* Main Grid - Reduced bottom margin from mb-24 to mb-12 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* 1. Brand Identity */}
          <div className="space-y-6">
            <div className="relative w-40 h-12">
              <Image 
                src="/banglorecollectivelogo.jpg" 
                alt="Bangalore Collective" 
                fill
                className="object-contain brightness-200"
              />
            </div>
            <p className="text-white/40 text-[13px] leading-relaxed font-light max-w-xs">
              A narrative of elegance through curated fashion, redefining the modern Bangalore aesthetic at the intersection of heritage and urban living.
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
                <a key={i} href={social.href} target="_blank" className="p-2.5 bg-white/5 rounded-full hover:bg-white hover:text-black transition-all">
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* 2. Navigation */}
          <div className="md:pl-12">
            <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-6">Curations</h3>
            <ul className="grid grid-cols-2 gap-y-3 gap-x-4">
              {["New Arrivals", "Women", "Men", "Unisex", "Gallery", "Stories"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-[12px] font-medium text-white/50 hover:text-white transition-all">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Contact */}
          <div className="space-y-6">
            <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-6">Concierge</h3>
            <div className="space-y-4">
              <div className="group">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">Call</p>
                <a href="tel:+919060889995" className="text-[14px] text-white/70 group-hover:text-white transition-colors">+91 9060889995</a>
              </div>
              <div className="group">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">Email</p>
                <a href="mailto:bangalorecollective15@gmail.com" className="text-[14px] text-white/70 group-hover:text-white transition-colors">bangalorecollective15@gmail.com</a>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">The Atelier</p>
                <p className="text-[13px] text-white/50 leading-tight">7th Block, Jayanagar, Bengaluru</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Credits - Reduced top padding from pt-12 to pt-8 */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-8 items-center text-white/20 text-[9px] font-black uppercase tracking-[0.3em]">
            <p>© {year} Bangalore Collective</p>
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          </div>
          
          <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.3em]">
            Developed by <a href="https://rakvih.in/" target="_blank" className="text-white/40 hover:text-orange-500 transition-colors">Rakvih</a>
          </p>
        </div>
      </div>
    </footer>
  );
}