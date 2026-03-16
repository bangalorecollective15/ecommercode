"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Instagram, Facebook, Twitter, ArrowRight } from "lucide-react";

export default function Footer() {
  // Fix 1: Prevent Date Mismatch by handling year in state
  const [year, setYear] = useState<number | string>("");

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 text-white border-t border-orange-500/20">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* About */}
        <div className="space-y-6 md:col-span-1">
          <h2 className="text-3xl font-black tracking-tighter  leading-none">
            Swaadha<span className="text-white/70">.</span>
          </h2>
          <p className="text-white/80 text-[13px] leading-relaxed font-medium">
            Bringing authentic flavors and fresh ingredients from our family kitchen to yours.
          </p>
          <div className="flex gap-4">
            <a href="#" className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-orange-600 transition-all">
              <Instagram size={14} />
            </a>
            <a href="#" className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-orange-600 transition-all">
              <Facebook size={14} />
            </a>
            <a href="#" className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-orange-600 transition-all">
              <Twitter size={14} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Explore</h3>
          <ul className="space-y-3">
            <li>
              <Link href="/userinterface/home" className="text-sm font-bold hover:translate-x-1 inline-block transition-transform">Home</Link>
            </li>
            <li>
              <Link href="/userinterface/category" className="text-sm font-bold hover:translate-x-1 inline-block transition-transform">Category</Link>
            </li>
            <li>
              <Link href="/userinterface/Gproducts" className="text-sm font-bold hover:translate-x-1 inline-block transition-transform">Product Gallery</Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Contact</h3>
          <div className="space-y-3 text-sm font-bold">
            <p>
              <a href="tel:+918296295658" className="hover:text-white/70 transition">+91 8296295658</a>
            </p>
            <p>
              <a href="mailto:info@swaadha.com" className="hover:text-white/70 transition">info@swaadha.com</a>
            </p>
            <p className="opacity-70 font-medium">Bangalore, India</p>
          </div>
        </div>

        {/* Newsletter */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Stay Updated</h3>
          <form className="relative group" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Email address"
              autoComplete="off"
              // Fix 2: Suppress hydration warning for extension-injected attributes
              suppressHydrationWarning
              className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl text-white placeholder:text-white/50 text-xs focus:outline-none focus:bg-white/20 transition-all"
            />
            <button
              type="submit"
              suppressHydrationWarning
              className="absolute right-2 top-1.2 bottom-1.2 p-2 rounded-lg text-white hover:scale-110 transition-transform"
            >
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 py-8 text-center text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {year} Swaadha Homemade. All rights reserved.</p>
          <p className="text-white/80">
            Developed by{" "}
            <a 
              href="https://rakvih.in/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white border-b border-white/40 hover:border-white transition-colors"
            >
              Rakvih
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}