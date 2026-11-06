import React, { useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { assetUrl } from "../lib/assets";

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
    image: assetUrl("/assets/hero/lppm-hero-1.png"),
    imageMobile: assetUrl("/assets/hero/lppm-hero-1.png"),
    title: "Laboratorium Riset Terapan UNUSU",
    badge: "Riset Ilmiah & Inovasi",
    headline: "Pusat Riset Terapan & Inovasi Teknologi",
    subheadline: "Mendorong keunggulan riset saintifik terapan dan hilirisasi inovasi berlandaskan nilai Aswaja An-Nahdliyah.",
  },
  {
    id: 2,
    image: assetUrl("/assets/hero/lppm-hero-2.png"),
    imageMobile: assetUrl("/assets/hero/lppm-hero-2.png"),
    title: "Kolaborasi Dosen dan Peneliti Muda",
    badge: "Hibah Kompetitif Nasional",
    headline: "Penguatan Kapasitas Peneliti & PKM",
    subheadline: "Fasilitasi pendanaan riset dosen pemula, skema terapan, dan pemberdayaan masyarakat Sumatera Utara.",
  },
  {
    id: 3,
    image: assetUrl("/assets/hero/lppm-hero-3.png"),
    imageMobile: assetUrl("/assets/hero/lppm-hero-3.png"),
    title: "Pemberdayaan Masyarakat di Lapangan",
    badge: "Dampak Nyata Komunitas",
    headline: "Pengabdian Berbasis Kemitraan Umat",
    subheadline: "Mengabdi untuk kemaslahatan masyarakat melalui transfer keilmuan dan teknologi tepat guna.",
  },
  {
    id: 4,
    image: assetUrl("/assets/hero/lppm-hero-4.png"),
    imageMobile: assetUrl("/assets/hero/lppm-hero-4.png"),
    title: "Pusat Studi & Repositori Ilmiah",
    badge: "Scopus & SINTA Terakreditasi",
    headline: "Publikasi Bereputasi & Perolehan HKI",
    subheadline: "Mendukung diseminasi karya ilmiah civitas akademika UNUSU pada jurnal nasional terindeks dan internasional.",
  },
];

export const FullHeroSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % defaultHeroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const prevSlide = () =>
    setCurrentSlide((prev) => (prev === 0 ? defaultHeroSlides.length - 1 : prev - 1));
  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % defaultHeroSlides.length);

  const counter = `${String(currentSlide + 1).padStart(2, '0')} / ${String(defaultHeroSlides.length).padStart(2, '0')}`;

  return (
    <section
      aria-label="Hero Banner Slider"
      className="relative w-full h-[calc(100svh-4rem)] min-h-[560px] max-h-[1080px] overflow-hidden bg-violet-950 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
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
                width={1280}
                height={720}
                className="w-full h-full object-cover object-center transform scale-100 hover:scale-105 transition-transform duration-7000 ease-out"
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
              />
            </picture>

            {/* Gradient Overlay Transparan: soft violet gradient mempertahankan 80% kejelasan gambar */}
            <div className="absolute inset-0 bg-gradient-to-t from-violet-950/90 via-violet-950/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-violet-950/70 via-transparent to-transparent hidden sm:block" />

            {/* 20% Tulisan Ringkas & Tajam (Compact Bottom Section) */}
            <div className="relative z-10 max-w-7xl mx-auto h-full flex flex-col justify-end pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl space-y-3 sm:space-y-4">
                {/* Badge Category */}
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-violet-600/90 text-white border border-violet-400/30 backdrop-blur-md shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>{slide.badge}</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.05] text-balance drop-shadow-lg">
                  {slide.headline}
                </h1>

                {/* Compact Subheadline */}
                <p className="text-violet-100 text-sm sm:text-lg max-w-xl font-normal leading-relaxed text-pretty drop-shadow-md">
                  {slide.subheadline}
                </p>

                {/* Call To Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <a
                    href="#layanan"
                    className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-[8px] bg-white hover:bg-violet-100 text-violet-950 font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    Pangkalan Riset
                  </a>
                  <a
                    href="#skema"
                    className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-[8px] bg-white/15 hover:bg-white/25 text-white font-semibold text-xs border border-white/25 transition-colors"
                  >
                    Skema Hibah PKM
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Slide Indicators / Dots (kiri-bawah) */}
      <div className="absolute bottom-6 left-6 sm:left-8 z-20 flex items-center space-x-2">
        {defaultHeroSlides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Buka slide ${idx + 1}`}
            aria-current={idx === currentSlide}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              idx === currentSlide ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      {/* Prev & Next Controls (kanan-bawah) */}
      <div className="absolute right-6 sm:right-8 bottom-5 z-20 flex items-center space-x-2">
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Slide Sebelumnya"
          className="min-h-[44px] w-11 h-11 rounded-[8px] bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/25 transition-colors cursor-pointer"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Slide Berikutnya"
          className="min-h-[44px] w-11 h-11 rounded-[8px] bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/25 transition-colors cursor-pointer"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
        <span className="text-xs font-semibold text-slate-200 ml-1 font-mono">{counter}</span>
      </div>
    </section>
  );
};
