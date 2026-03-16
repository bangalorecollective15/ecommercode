"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import ProductCard from "../components/ProductCard";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Loader2,
  Leaf,
  ShieldCheck,
  Heart,
  Instagram,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  Award // Added for a professional brand touch
} from "lucide-react";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function HomePage() {
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [latestProducts, setLatestProducts] = useState<any[]>([]);
  const [instagramLinks, setInstagramLinks] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]); // New Brands State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [banner, setBanner] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch everything in parallel for better performance
        const [hero, products, notify, insta, brandData] = await Promise.all([
          supabase.from("hero_section").select("images").eq("active", true).limit(1).maybeSingle(),
          supabase.from("products").select(`*, product_variations(*), product_images(image_url)`).eq("active", true).order("created_at", { ascending: false }).limit(4),
          supabase.from("notification_banner").select("*").eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
          supabase.from("instagram_links").select("*").eq("published", true).order("created_at", { ascending: false }),
          supabase.from("brands").select("*").eq("status", true).order("name_en") // Fetching Brands
        ]);

        if (hero.data?.images) setHeroImages(hero.data.images);
        
        setLatestProducts(products.data?.map(p => ({
          ...p,
          price: p.product_variations?.[0]?.price || 0,
          image: p.product_images?.[0]?.image_url
        })) || []);

        if (notify.data) {
          setBanner(notify.data);
          setShowBanner(true);
        }

        if (insta.data) setInstagramLinks(insta.data);
        if (brandData.data) setBrands(brandData.data);

      } catch (err) {
        console.error("Data Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Instagram Script Logic
  useEffect(() => {
    if (!instagramLinks.length) return;
    if ((window as any).instgrm) {
      (window as any).instgrm.Embeds.process();
    } else {
      const script = document.createElement("script");
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      script.onload = () => (window as any).instgrm.Embeds.process();
      document.body.appendChild(script);
    }
  }, [instagramLinks]);

  // Slider Logic
  useEffect(() => {
    if (heroImages.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev === heroImages.length - 1 ? 0 : prev + 1));
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [heroImages]);

  const nextSlide = () => setCurrentSlide((prev) => (prev === heroImages.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1));

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#FAFAFA]">
      <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
    </div>
  );

  return (
    <div className="bg-[#FAFAFA] min-h-screen pb-20 overflow-x-hidden">
      
      {/* --- POPUP BANNER --- */}
      {showBanner && banner && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setShowBanner(false)}
              className="absolute top-3 right-4 z-20 bg-black/40 hover:bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all font-bold text-xl"
            >
              &times;
            </button>
            <img src={banner.image_url} alt="Promotion" className="w-full h-auto max-h-[80vh] object-contain" />
          </div>
        </div>
      )}

      {/* --- HERO SECTION --- */}
      <section className="relative w-full h-[280px] sm:h-[350px] md:h-[450px] lg:h-[550px] overflow-hidden bg-slate-900">
        <div
          className="flex w-full h-full transition-transform duration-[700ms] ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {heroImages.map((img, i) => (
            <img key={i} src={img} alt={`Hero ${i}`} className="w-full h-full object-cover flex-shrink-0" />
          ))}
        </div>
        {heroImages.length > 1 && (
          <>
            <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-black transition-all z-20">
              <ChevronLeft size={20} />
            </button>
            <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-black transition-all z-20">
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </section>

      {/* --- FEATURES SECTION --- */}
      <section className="bg-white py-16 border-b border-slate-100">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-2xl md:text-3xl font-black mb-4">100% Natural, Chemical-Free, Quality Guaranteed</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-12">
            <div className="flex flex-col items-center">
              <Leaf className="text-orange-600 mb-4" size={40} />
              <h3 className="font-bold uppercase tracking-widest mb-2">100% Natural</h3>
              <p className="text-sm text-slate-500">Pure goodness without artificial additives.</p>
            </div>
            <div className="flex flex-col items-center">
              <ShieldCheck className="text-orange-600 mb-4" size={40} />
              <h3 className="font-bold uppercase tracking-widest mb-2">Chemical-Free</h3>
              <p className="text-sm text-slate-500">No harmful chemicals or preservatives.</p>
            </div>
            <div className="flex flex-col items-center">
              <Heart className="text-orange-600 mb-4" size={40} />
              <h3 className="font-bold uppercase tracking-widest mb-2">Made with Love</h3>
              <p className="text-sm text-slate-500">Traditional recipes from our home to yours.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- LATEST PRODUCTS --- */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-12 mt-16 md:mt-24">
        <div className="flex items-end justify-between mb-10 border-b border-slate-200 pb-6">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Just Added</h2>
          <Link href="/userinterface/Gproducts" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-orange-600 transition-all">
            View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {latestProducts.map((p) => <ProductCard key={p.id} product={p} userId={userId} />)}
        </div>
      </section>

      {/* --- INSTAGRAM SCROLLER --- */}
      <section className="w-full py-18 bg-white border-b border-slate-100">
        <div className="text-center mb-14 space-y-3 px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-center">
            <Instagram className="w-10 h-10 text-pink-500" />
          </div>
          <h2 className="text-4xl font-extrabold mb-2 tracking-tight">Follow Us on Instagram</h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
            Watch how we prepare our authentic products with love and care
          </p>
        </div>
        <div className="relative overflow-hidden">
          <div className="flex gap-6 animate-marquee">
            {instagramLinks.concat(instagramLinks).map((link, idx) => (
              <div key={idx} className="flex-shrink-0 w-72 rounded-2xl shadow-lg overflow-hidden">
                <blockquote className="instagram-media" data-instgrm-permalink={link.url} data-instgrm-version="14"></blockquote>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-gray-600 text-lg tracking-wide mt-10 flex items-center justify-center gap-2">
          <Instagram className="w-6 h-6 text-pink-500" /> @swaadha_homemade
        </p>
      </section>


{/* --- BRAND CARDS SECTION --- */}
<section className="w-full py-24 bg-white">
  <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
    <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-orange-600">
          <Award size={20} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Premium Quality</span>
        </div>
        <h2 className="text-4xl font-black tracking-tighter">Our Trusted Partners</h2>
      </div>
      <p className="text-slate-400 text-sm max-w-xs md:text-right italic">
        Collaborating with brands that share our commitment to natural goodness.
      </p>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {brands.map((brand) => (
        <Link 
          key={brand.id} 
          href={`/userinterface/Gproducts?brand_id=${brand.id}`} // Link to product page with filter
          className="group relative bg-[#FAFAFA] border border-slate-100 rounded-2xl p-8 flex flex-col items-center justify-center gap-6 transition-all duration-500 hover:bg-white hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:-translate-y-2 cursor-pointer"
        >
          {/* Status Indicator Dot */}
          <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-orange-500 transition-colors" />

          <div className="h-16 w-full flex items-center justify-center">
            <img
              src={brand.image_url}
              alt={brand.alt_text}
              className="max-h-full max-w-[85%] object-contain transition-all duration-500 ease-in-out group-hover:scale-110"
            />
          </div>

          <div className="text-center space-y-1">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-colors">
              {brand.name_en}
            </h3>
            <div className="w-0 group-hover:w-full h-[1.5px] bg-orange-600 transition-all duration-500 mx-auto" />
          </div>

          {/* Decorative Glass Background on Hover */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-orange-50/0 to-orange-50/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </Link>
      ))}
    </div>
  </div>
</section>

      {/* --- OUR STORY --- */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-12 py-24 flex flex-col md:flex-row items-center gap-16">
        <div className="md:w-1/2">
          <span className="bg-orange-100 text-orange-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Our Story</span>
          <h2 className="text-4xl font-black mt-6 mb-8 leading-tight">A Family Tradition <br /> Passed Down with Love</h2>
          <p className="text-slate-600 text-lg leading-relaxed mb-6">
            We are a mother and daughter duo, committed to bringing you the authentic flavors of homemade food.
          </p>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-black text-orange-600">15+</div>
            <div className="text-sm font-bold uppercase text-slate-400 leading-tight">Years of <br /> Experience</div>
          </div>
        </div>
        <div className="md:w-1/2">
          <img src="https://deliciousfoods.in/cdn/shop/articles/spices_1100x.jpg?v=1742457010" className="rounded-3xl shadow-2xl w-full h-[400px] object-cover" alt="Authentic Spices" />
        </div>
      </section>

      {/* --- ORDERING PROCESS --- */}
      <section className="bg-orange-50/50 py-24 border-y border-orange-100">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-16">Easy Ordering Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-all text-left">
              <Phone className="text-orange-600 mb-4" />
              <h3 className="font-bold mb-2">Contact Us</h3>
              <p className="text-sm text-slate-500">Call/WhatsApp: <br /><strong>+91 8296295658</strong></p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-all text-left">
              <Calendar className="text-orange-600 mb-4" />
              <h3 className="font-bold mb-2">Advance Orders</h3>
              <p className="text-sm text-slate-500">Please order 6-7 days in advance for fresh batches.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-all text-left">
              <Clock className="text-orange-600 mb-4" />
              <h3 className="font-bold mb-2">Delivery Time</h3>
              <p className="text-sm text-slate-500">Bangalore: 24hrs <br /> Outside: 4-10 days</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-all text-left">
              <CheckCircle2 className="text-orange-600 mb-4" />
              <h3 className="font-bold mb-2">Bulk Orders</h3>
              <p className="text-sm text-slate-500">We cater for marriages & festivals (min 100 people).</p>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .animate-marquee {
          display: flex;
          animation: marquee 40s linear infinite;
          width: max-content;
        }
        .animate-marquee-brands {
          display: flex;
          animation: marquee 25s linear infinite;
          width: max-content;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee:hover, .animate-marquee-brands:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}