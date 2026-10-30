import React, { useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export interface HeroSlideItem {
  id: number;
  image: string;
  imageMobile: string;
  title: string;
  badge: string;
  headline: string;
  subheadline: string;
}

const defaultHeroSlides: HeroSlideItem[] = [
  {
    id: 1,
    image: "/assets/hero/lppm-hero-1.png",
    imageMobile: "/assets/hero/lppm-hero-1.png",
    title: "Laboratorium Riset Terapan UNUSU",
    badge: "Riset Ilmiah & Inovasi",
    headline: "Pusat Riset Terapan & Inovasi Teknologi",
    subheadline: "Mendorong keunggulan riset saintifik terapan dan hilirisasi inovasi berlandaskan nilai Aswaja An-Nahdliyah.",
  },
  {
    id: 2,
    image: "/assets/hero/lppm-hero-2.png",
    imageMobile: "/assets/hero/lppm-hero-2.png",
    title: "Kolaborasi Dosen dan Peneliti Muda",
    badge: "Hibah Kompetitif Nasional",
    headline: "Penguatan Kapasitas Peneliti & PKM",
    subheadline: "Fasilitasi pendanaan riset dosen pemula, skema terapan, dan pemberdayaan masyarakat Sumatera Utara.",
  },
  {
    id: 3,
    image: "/assets/hero/lppm-hero-3.png",
    imageMobile: "/assets/hero/lppm-hero-3.png",
    title: "Pemberdayaan Masyarakat di Lapangan",
    badge: "Dampak Nyata Komunitas",
    headline: "Pengabdian Berbasis Kemitraan Umat",
    subheadline: "Mengabdi untuk kemaslahatan masyarakat melalui transfer keilmuan dan teknologi tepat guna.",
  },
  {
    id: 4,
    image: "/assets/hero/lppm-hero-4.png",
    imageMobile: "/assets/hero/lppm-hero-4.png",
    title: "Pusat Studi & Repositori Ilmiah",
    badge: "Scopus & SINTA Terakreditasi",
    headline: "Publikasi Bereputasi & Perolehan HKI",
    subheadline: "Mendukung diseminasi karya ilmiah civitas akademika UNUSU pada jurnal nasional terindeks dan internasional.",
  },
];

export const FullHeroSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % defaultHeroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () =>
    setCurrentSlide((prev) => (prev === 0 ? defaultHeroSlides.length - 1 : prev - 1));
  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % defaultHeroSlides.length);

  return (
    <section
      aria-label="Hero Banner Slider"
      className="relative w-full h-[580px] sm:h-[640px] lg:h-[700px] overflow-hidden bg-violet-950"
    >
      {/* Slides */}
      {defaultHeroSlides.map((slide, index) => {
        const isActive = index === currentSlide;
        return (
          <div
            key={slide.id}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {/* 80% Visual Gambar: Full background coverage dengan subtle zoom visual */}
            <picture className="absolute inset-0 w-full h-full">
              <source media="(max-width: 640px)" srcSet={slide.imageMobile} />
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover object-center transform scale-100 hover:scale-105 transition-transform duration-7000 ease-out"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </picture>

            {/* Gradient Overlay Transparan — Soft violet gradient mempertahankan 80% kejelasan gambar */}
            <div className="absolute inset-0 bg-gradient-to-t from-violet-950/90 via-violet-950/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-violet-950/70 via-transparent to-transparent hidden sm:block" />

            {/* 20% Tulisan Ringkas & Tajam (Compact Bottom Section) */}
            <div className="relative z-10 max-w-7xl mx-auto h-full flex flex-col justify-end pb-10 sm:pb-14 px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl space-y-2.5">
                {/* Badge Category */}
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-violet-600/90 text-white border border-violet-400/30 backdrop-blur-md shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>{slide.badge}</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
                  {slide.headline}
                </h1>

                {/* Compact Subheadline */}
                <p className="text-violet-100 text-xs sm:text-sm max-w-xl font-normal leading-relaxed drop-shadow-md">
                  {slide.subheadline}
                </p>

                {/* Call To Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <a
                    href="#layanan"
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-xl active:scale-98"
                  >
                    Pangkalan Riset
                  </a>
                  <a
                    href="#skema"
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs border border-white/25 backdrop-blur-md transition-all active:scale-98"
                  >
                    Skema Hibah PKM
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Slide Indicators / Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2">
        {defaultHeroSlides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Buka slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              idx === currentSlide ? "w-8 bg-amber-400" : "w-2 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      {/* Prev & Next Controls */}
      <div className="hidden sm:flex absolute right-6 bottom-5 z-20 items-center space-x-2">
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Slide Sebelumnya"
          className="w-9 h-9 rounded-xl bg-violet-900/60 hover:bg-violet-800 text-white flex items-center justify-center backdrop-blur-md border border-violet-400/30 transition-all cursor-pointer"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Slide Berikutnya"
          className="w-9 h-9 rounded-xl bg-violet-900/60 hover:bg-violet-800 text-white flex items-center justify-center backdrop-blur-md border border-violet-400/30 transition-all cursor-pointer"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};
