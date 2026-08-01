"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import {
  Instagram,
  Facebook,
  Youtube,
  Phone,
  Mail,
  MapPin,
  Download,
  ExternalLink
} from "lucide-react";

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Category {
  id: number;
  name: string;
}

interface SiteInfo {
  short_description: string;
  instagram: string;
  youtube: string;
  snapchat: string;
  facebook: string;
  whatsapp: string;
  google: string;
}

export default function Footer() {
  const [year, setYear] = useState<number | string>(new Date().getFullYear());
  const [categories, setCategories] = useState<Category[]>([]);
  const [siteInfo, setSiteInfo] = useState<SiteInfo>({
    short_description: "Curating elegance through fashion, redefining the modern Bangalore aesthetic.",
    instagram: "",
    youtube: "",
    snapchat: "",
    facebook: "",
    whatsapp: "",
    google: ""
  });

  useEffect(() => {
    setYear(new Date().getFullYear());

    const fetchCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name")
        .order('priority', { ascending: true });
      if (data) setCategories(data);
    };

    const fetchSiteInfo = async () => {
      try {
        const { data, error } = await supabase
          .from("site_info")
          .select("short_description, instagram, youtube, snapchat, facebook, whatsapp, google")
          .eq("id", 1)
          .single();

        if (data && !error) {
          setSiteInfo({
            short_description: data.short_description || siteInfo.short_description,
            instagram: data.instagram || "",
            youtube: data.youtube || "",
            snapchat: data.snapchat || "",
            facebook: data.facebook || "",
            whatsapp: data.whatsapp || "",
            google: data.google || ""
          });
        }
      } catch (err) {
        console.error("Error fetching site_info:", err);
      }
    };

    fetchCategories();
    fetchSiteInfo();
  }, [siteInfo.short_description]);

  const formatUrl = (urlStr: string, type: string) => {
    if (!urlStr) return "";
    if (urlStr.startsWith("http://") || urlStr.startsWith("https://")) return urlStr;

    if (type === "whatsapp") {
      if (urlStr.includes("wa.me") || urlStr.includes("chat.whatsapp.com")) {
        return `https://${urlStr}`;
      }
      return `https://wa.me/${urlStr.replace(/[^0-9]/g, "")}`;
    }
    return `https://${urlStr}`;
  };

  const activeSocialLinks = [
    { icon: <Instagram size={18} />, href: formatUrl(siteInfo.instagram, "instagram"), label: "Instagram" },
    { icon: <Facebook size={18} />, href: formatUrl(siteInfo.facebook, "facebook"), label: "Facebook" },
    { icon: <Youtube size={18} />, href: formatUrl(siteInfo.youtube, "youtube"), label: "Youtube" },
    {
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3c-3.1 0-5.5 2-5.5 5 0 1.2.4 2.5.8 3.3-.6.5-1.2 1-1.8 2.2 0 .6.5.9 1.5.9h.3c.4 1.3 1.3 2.1 3.2 2.6.4.4.9.9 1.5.9s1.1-.5 1.5-.9c1.9-.5 2.8-1.3 3.2-2.6h.3c1 0 1.5-.3 1.5-.9 0-1.2-.6-1.7-1.8-2.2.4-.8.8-2.1.8-3.3 0-3-2.4-5-5-5z" />
        </svg>
      ),
      href: formatUrl(siteInfo.snapchat, "snapchat"),
      label: "Snapchat"
    },
    {
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.454 5.709 1.455h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      href: formatUrl(siteInfo.whatsapp, "whatsapp"),
      label: "WhatsApp"
    },
    {
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10c5.14 0 9.4-3.87 9.94-8.88H12v-3h9.8c.1.6.2 1.2.2 1.88z" />
        </svg>
      ),
      href: formatUrl(siteInfo.google, "google"),
      label: "Google"
    }
  ].filter(item => item.href !== "");

  return (
    <footer className="bg-white dark:bg-black border-t border-neutral-200 dark:border-[#333] text-neutral-800 dark:text-gray-300 pt-16 pb-12 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 lg:gap-12 mb-12">
          
          {/* Column 1: Brand Profile */}
          <div className="flex flex-col space-y-5">
            <div className="relative w-44 h-12">
              <Image
                src="/removebglogo.png"
                alt="Bangalore Collective Logo"
                fill
                sizes="(max-width: 768px) 176px, 176px"
                className="object-contain object-left dark:brightness-110"
                priority
              />
            </div>
            <p className="text-neutral-600 dark:text-gray-400 text-sm leading-relaxed max-w-xs font-normal">
              {siteInfo.short_description}
            </p>
            {/* Social Icons Container */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              {activeSocialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="p-2.5 text-neutral-600 dark:text-gray-400 border border-neutral-300 dark:border-[#444] rounded-full hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-black hover:border-neutral-900 dark:hover:border-white transition-all duration-200 ease-in-out"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links Menu */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-900 dark:text-gray-200 mb-5 relative after:content-[''] after:block after:w-8 after:h-[2px] after:bg-neutral-900 dark:after:bg-gray-200 after:mt-2">
              Menu
            </h3>
            <ul className="space-y-3.5">
              <li>
                <Link href="/userinterface/home" className="text-sm text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/userinterface/Gproducts" className="text-sm text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors">
                  Product Gallery
                </Link>
              </li>
              <li>
                <Link href="/userinterface/about" className="text-sm text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Dynamically Fetched Categories */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-900 dark:text-gray-200 mb-5 relative after:content-[''] after:block after:w-8 after:h-[2px] after:bg-neutral-900 dark:after:bg-gray-200 after:mt-2">
              Shop By Category
            </h3>
            {categories.length > 0 ? (
              <ul className="space-y-3.5">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/userinterface/Gproducts/category/${cat.id}`}
                      className="text-sm text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors block"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-neutral-400 dark:text-gray-500 italic">No categories available</p>
            )}
          </div>

          {/* Column 4: Contact & Studio Info */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-900 dark:text-gray-200 mb-5 relative after:content-[''] after:block after:w-8 after:h-[2px] after:bg-neutral-900 dark:after:bg-gray-200 after:mt-2">
              Contact Us
            </h3>
            <div className="space-y-4 text-sm text-neutral-600 dark:text-gray-400">
              <div className="flex items-start gap-3">
                <Phone size={16} className="mt-0.5 text-neutral-900 dark:text-white flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 dark:text-gray-500">Call Support</span>
                  <a href="tel:+919060889995" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                    +91 9060889995
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail size={16} className="mt-0.5 text-neutral-900 dark:text-white flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 dark:text-gray-500">Email Us</span>
                  <a href="mailto:bangalorecollective15@gmail.com" className="hover:text-neutral-900 dark:hover:text-white transition-colors break-all">
                    bangalorecollective15@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 text-neutral-900 dark:text-white flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 dark:text-gray-500">Our Studio</span>
                  <p className="leading-relaxed">
                    7th Block, Jayanagar,<br />
                    Bengaluru, KA 560070
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Banner: Android App Download */}
        <div className="my-10 p-6 bg-neutral-900 dark:bg-[#111] text-white dark:text-gray-100 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm dark:border dark:border-[#333]">
          <div className="text-center sm:text-left">
            <h4 className="text-base font-semibold tracking-wide">Shop on the go</h4>
            <p className="text-xs text-neutral-400 dark:text-gray-400 mt-0.5">Download our specialized application for exclusive collections and rapid checkouts.</p>
          </div>
          <a
            href="/downloads/app-debug.apk"
            download="BangaloreCollective.apk"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white dark:bg-white text-neutral-900 dark:text-black px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-neutral-100 dark:hover:bg-gray-200 transition-all duration-200 shadow-md group"
          >
            <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
            Download Android App
          </a>
        </div>

        {/* Footer Bottom Bar */}
        <div className="pt-8 border-t border-neutral-200 dark:border-[#333] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-neutral-500 dark:text-gray-500">
          
          {/* Rights & Utility Policies */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
            <p className="font-medium text-neutral-700 dark:text-gray-400">© {year} Bangalore Collective.</p>
            <div className="flex items-center gap-4">
              <Link href="/userinterface/privacy-policy" className="hover:text-neutral-900 dark:hover:text-white hover:underline underline-offset-2 transition-colors">
                Privacy Policy
              </Link>
              <span className="text-neutral-300 dark:text-gray-700 hidden sm:inline">|</span>
              <Link href="/userinterface/terms-and-conditions" className="hover:text-neutral-900 dark:hover:text-white hover:underline underline-offset-2 transition-colors">
                Terms & Conditions
              </Link>
            </div>
          </div>

          {/* Developer Attribution */}
          <p className="text-center md:text-right text-xs">
            Designed & Developed by{" "}
            <a
              href="https://rakvih.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-800 dark:text-white font-semibold inline-flex items-center gap-0.5 hover:underline transition-all"
            >
              Rakvih
              <ExternalLink size={10} className="opacity-60" />
            </a>
          </p>
        </div>

      </div>
    </footer>
  );
}