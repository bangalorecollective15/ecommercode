"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";

// Above-the-fold sections load eagerly, in the main bundle
// NOTE: using the "@/" alias instead of "./" so this works no matter which
// folder these files live in relative to HomeClient.tsx. Place all the
// section files in app/userinterface/components/ (adjust the path
// below if you put them somewhere else).
import HeroSlider from "@/app/userinterface/components/HHeroSlider";
import CategoryShowcase from "@/app/userinterface/components/CategoryShowcase";
import ProductSpotlight from "@/app/userinterface/components/ProductSpotlight";

// Below-the-fold sections are code-split: each becomes its own JS chunk
// that only downloads and hydrates once it's about to scroll into view.
// This is the main lever for cutting initial JS + main-thread work.
const CategoryHighlights = dynamic(() => import("@/app/userinterface/components/CategoryHighlights"), {
  loading: () => <SectionSkeleton height="h-[500px]" />,
});
const BrandsRoster = dynamic(() => import("@/app/userinterface/components/BrandsRoster"), {
  loading: () => <SectionSkeleton height="h-[420px]" />,
});
const CommunityStats = dynamic(() => import("@/app/userinterface/components/CommunityStats"), {
  loading: () => <SectionSkeleton height="h-[500px]" />,
});
const LifestyleSections = dynamic(() => import("@/app/userinterface/components/LifestyleSections"), {
  loading: () => <SectionSkeleton height="h-[600px]" />,
});
const InstagramFeed = dynamic(() => import("@/app/userinterface/components/InstagramFeed"), {
  loading: () => <SectionSkeleton height="h-[550px]" />,
});

function SectionSkeleton({ height }: { height: string }) {
  return <div className={`w-full ${height} bg-slate-50 dark:bg-[#0a0a0a] animate-pulse`} />;
}

interface HeroData {
  id: string;
  images: string[];
  title: string;
  description: string;
  button_text: string;
  lifestyle_tag?: string;
}

const DEFAULT_DATA = {
  middle_badge: "Quality First",
  middle_title: "Elevated Style, Made Effortless \n & Affordable",
  middle_description: "Carefully selected pieces made to fit seamlessly into modern life.",
  cat1_title: "Apparel",
  cat1_description: "Timeless wardrobe staples.",
  cat1_image_url: "",
  cat2_title: "Accessories",
  cat2_description: "Handcrafted leather accents.",
  cat2_image_url: "",
  cat3_title: "Lifestyle",
  cat3_description: "Minimalist home essentials.",
  cat3_image_url: "",
  live_badge: "Live Gallery",
  live_title: "BUILT AROUND \nTrust, Style and Quality",
  live_image_url: "/phto.png",
  live_quote: "The minimalist aesthetic I've been searching for. A true sanctuary for modern living.",
  stat1_value: "10,000+",
  stat1_label: "Trusted Customers",
  stat2_value: "Premium",
  stat2_label: "Quality Craftsmanship",
  stat3_value: "Luxury",
  stat3_label: "Made Affordable",
  stat4_value: "Fast & Secure",
  stat4_label: "Worldwide Shipping",
};

interface HomeClientProps {
  initialHeroSections: HeroData[];
  initialData: any | null;
  initialCategories: any[];
  initialSubcategories: any[];
  initialBrands: any[];
  initialLatestProducts: any[];
  initialLifestyleSections: any[];
  initialInstagramLinks?: any[];
  initialAttributes?: any[];
}

export default function HomeClient({
  initialHeroSections,
  initialData,
  initialCategories,
  initialSubcategories,
  initialBrands,
  initialLatestProducts,
  initialLifestyleSections,
  initialInstagramLinks = [],
  initialAttributes = [],
}: HomeClientProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get("type");
      if (type === "recovery") {
        router.push(`/userinterface/auth/update-password/${window.location.hash}`);
      }
    }
  }, [router]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: session }) => {
      setUserId(session.session?.user?.id || null);
    });
  }, []);

  const data = initialData || DEFAULT_DATA;

  return (
    <div className="bg-[#fcfcfc] dark:bg-black min-h-screen font-sans selection:bg-orange-100 dark:selection:bg-orange-900 transition-colors duration-300">
      {/* 1. Hero — eager, above the fold */}
      <HeroSlider heroSections={initialHeroSections} attributes={initialAttributes} />

      {/* 2. Category showcase — eager, near the top */}
      <CategoryShowcase categories={initialCategories} subcategories={initialSubcategories} />

      {/* 3. Product spotlight marquee — eager, still high on the page */}
      <ProductSpotlight latestProducts={initialLatestProducts} userId={userId} />

      {/* 4. Category highlights — lazy, code-split */}
      <CategoryHighlights data={data} />

      {/* 5. Brands roster — lazy, code-split */}
      <BrandsRoster brands={initialBrands} />

      {/* 6. Community stats + live gallery — lazy, code-split (Instagram embeds removed) */}
      <CommunityStats data={data} />

      {/* 7. Dynamic lifestyle sections — lazy, code-split */}
      <LifestyleSections
        sections={initialLifestyleSections}
        attributes={initialAttributes}
        userId={userId}
      />

      {/* 8. Instagram feed — lazy, code-split, AND only mounts its script/embeds
          once the section is near the viewport (see InstagramFeed.tsx) */}
      <InstagramFeed instagramLinks={initialInstagramLinks} />

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(calc(-50% - 1rem)); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}