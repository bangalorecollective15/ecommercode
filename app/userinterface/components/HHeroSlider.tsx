"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import OptimizedImage from "@/app/userinterface/components/OptimizedImage";

interface HeroData {
  id: string;
  images: string[];
  title: string;
  description: string;
  button_text: string;
  lifestyle_tag?: string;
}

interface HeroSliderProps {
  heroSections: HeroData[];
  attributes: any[];
}

export default function HeroSlider({ heroSections, attributes }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const getLifestyleAttributeId = (tagName?: string): number | string | null => {
    if (!tagName) return null;
    const match = attributes.find((a) => a.type === "lifestyle_tag" && a.name === tagName);
    return match ? match.id : null;
  };

  const getHeroHref = (hero: HeroData) => {
    if (!hero.lifestyle_tag) return "/userinterface/Gproducts";
    const lifestyleId = getLifestyleAttributeId(hero.lifestyle_tag);
    return lifestyleId
      ? `/userinterface/Gproducts?lifestyle=${lifestyleId}`
      : `/userinterface/Gproducts?tag=${hero.lifestyle_tag}`;
  };

  useEffect(() => {
    if (heroSections.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSections.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroSections]);

  return (
    <section className="w-full bg-[#fcfcfc] dark:bg-black transition-colors duration-300">
      <div className="relative h-[550px] md:h-[700px] w-full overflow-hidden bg-[#0a0a0a]">
        {heroSections.map((hero, index) => (
          <div
            key={hero.id}
            className={`absolute inset-0 transition-all duration-[1.2s] ease-in-out ${
              index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            {/* Only the active + first slide need to be eager; the rest can stay lazy */}
            <OptimizedImage
              src={hero.images[0]}
              alt={hero.title}
              fill
              priority={index === 0}
              sizes="100vw"
              className={`object-cover transition-transform duration-[8s] ${
                index === currentSlide ? "scale-105" : "scale-100"
              }`}
            />

            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/30 to-transparent" />

            <div className="absolute inset-0 flex items-center">
              <div className="max-w-[1400px] mx-auto w-full px-6 md:px-12">
                <div className="max-w-3xl">
                  <div
                    className={`flex items-center gap-4 mb-6 transition-all duration-700 delay-300 ${
                      index === currentSlide ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    }`}
                  >
                    <div className="h-[2px] w-12 bg-orange-600" />
                    <span className="text-orange-500 text-[10px] font-black uppercase tracking-[0.4em]">
                      New Season Arrival
                    </span>
                  </div>

                  <h2
                    className={`text-5xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] uppercase mb-6 transition-all duration-1000 delay-500 ${
                      index === currentSlide ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"
                    }`}
                  >
                    {hero.title.split(" ")[0]} <br />
                    <span className="text-transparent" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.4)" }}>
                      {hero.title.split(" ").slice(1).join(" ")}
                    </span>
                  </h2>

                  <p
                    className={`text-white/50 text-sm md:text-base font-medium leading-relaxed max-w-sm mb-10 transition-all duration-700 delay-700 ${
                      index === currentSlide ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                    }`}
                  >
                    {hero.description}
                  </p>

                  <div
                    className={`transition-all duration-700 delay-1000 ${
                      index === currentSlide ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                    }`}
                  >
                    <Link href={getHeroHref(hero)} className="group flex items-center gap-4 w-fit">
                      <div className="px-8 py-4 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest group-hover:bg-orange-600 group-hover:text-white transition-all shadow-xl">
                        {hero.lifestyle_tag ? "View Products" : hero.button_text || "Shop Now"}
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {heroSections.length > 0 && (
          <div className="absolute bottom-0 left-0 w-full z-30 flex justify-between items-center px-6 md:px-12 py-8 bg-gradient-to-t from-black/50 to-transparent">
            <div className="flex items-center gap-2">
              {heroSections.map((_, idx) => (
                <button key={idx} onClick={() => setCurrentSlide(idx)} className="group py-2">
                  <div
                    className={`h-[3px] transition-all duration-500 rounded-full ${
                      idx === currentSlide ? "w-16 bg-orange-600" : "w-6 bg-white/20 group-hover:bg-white/40"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 font-mono text-[10px] tracking-[0.3em] text-white/40">
              <span className="text-white">0{currentSlide + 1}</span>
              <div className="w-8 h-px bg-white/20" />
              <span>0{heroSections.length}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}