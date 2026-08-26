"use client";

import OptimizedImage from "@/app/userinterface/components/OptimizedImage";

interface CategoryHighlightsProps {
  data: any;
}

export default function CategoryHighlights({ data }: CategoryHighlightsProps) {
  const categoriesArray = [
    { title: data.cat1_title, description: data.cat1_description, image: data.cat1_image_url },
    { title: data.cat2_title, description: data.cat2_description, image: data.cat2_image_url },
    { title: data.cat3_title, description: data.cat3_description, image: data.cat3_image_url },
  ];

  return (
    <section className="py-14 bg-[#E5DDD3] dark:bg-black/50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <span className="text-brand-gold font-bold tracking-[0.3em] text-xs uppercase block">
            {data.middle_badge}
          </span>
          <h2 className="mt-4 text-4xl md:text-5xl font-serif text-slate-900 dark:text-white leading-tight whitespace-pre-line transition-colors duration-300">
            {data.middle_title}
          </h2>
          <p className="mt-6 text-slate-600 dark:text-gray-400 max-w-xl mx-auto text-lg leading-relaxed transition-colors duration-300">
            {data.middle_description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {categoriesArray.map((cat, index) => (
            <div key={index} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl aspect-[4/5] shadow-xl">
                <OptimizedImage
                  src={cat.image || "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a"}
                  alt={cat.title || "Showcase Collection"}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="absolute bottom-6 left-6">
                  <h3 className="text-white text-2xl font-serif tracking-wide">{cat.title}</h3>
                </div>
              </div>
              <div className="mt-6 px-2 text-center md:text-left">
                <p className="text-slate-600 dark:text-gray-400 leading-relaxed text-sm font-medium transition-colors duration-300">
                  {cat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}