"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Gamepad2, Globe, Coins, Grid3x3, Crown, TrendingUp, Plus } from "lucide-react";
import { TabType } from '@/components/features/navigation/TabNavigation';

interface HeroCarouselProps {
  onTabChange: (tab: TabType) => void;
}

const slides = [
  {
    title: "Play Tic-Tac-Toe",
    subtitle: "On Stacks Blockchain",
    description: "Compete with players worldwide in decentralized Tic-Tac-Toe",
    icons: [Gamepad2, Globe],
    tab: "games" as TabType,
    color: "bg-orange-600",
  },
  {
    title: "Create Your Game",
    subtitle: "Set Your Stakes",
    description: "Choose your bet amount and board size, make the first move",
    icons: [Coins, Grid3x3],
    tab: "create" as TabType,
    color: "bg-red-600",
  },
  {
    title: "Climb the Ranks",
    subtitle: "Prove Your Skills",
    description: "Compete for the top spot on the leaderboard",
    icons: [Crown, TrendingUp],
    tab: "leaderboard" as TabType,
    color: "bg-amber-600",
  },
];

export function HeroCarousel({ onTabChange }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const slide = slides[currentSlide];

  return (
    <div className="relative overflow-hidden border-4 border-orange-500 bg-black shadow-[4px_4px_0px_0px_#fff]">
      {/* Retro Pixel Pattern Overlay */}
      <div 
        className={`absolute inset-0 ${slide.color}`}
        style={{
          backgroundImage: `
            linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000),
            linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)
          `,
          backgroundSize: '4px 4px',
          backgroundPosition: '0 0, 2px 2px',
          opacity: 0.2
        }}
      ></div>

      <div className="relative p-8 sm:p-12 md:p-16 text-white z-10">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          
          {/* Feature Icons Section - Moved to Top */}
          <div className="flex justify-center items-center gap-6 mb-2">
            {slide.icons.map((Icon, index) => (
              <div key={index} className="flex items-center gap-6">
                <div 
                  className="bg-black/20 p-3 rounded-full border-2 border-white/50 backdrop-blur-sm transform hover:scale-110 transition-transform duration-300"
                >
                  <Icon className="w-8 h-8 text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]" />
                </div>
                {index < slide.icons.length - 1 && (
                  <Plus className="w-6 h-6 text-white/50" />
                )}
              </div>
            ))}
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 font-pixel leading-relaxed retro-text-shadow">
            {slide.title}
          </h2>
          <p className="text-sm sm:text-base md:text-lg font-bold mb-4 sm:mb-6 font-pixel uppercase tracking-widest text-white drop-shadow-md">
            {slide.subtitle}
          </p>
          <p className="text-xs sm:text-sm md:text-base mb-2 font-pixel leading-loose max-w-2xl mx-auto drop-shadow-md">
            {slide.description}
          </p>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black hover:bg-gray-900 border-2 border-white p-2 transition-all active:translate-y-1"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black hover:bg-gray-900 border-2 border-white p-2 transition-all active:translate-y-1"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-4 h-4 border-2 border-white transition-all ${
                index === currentSlide ? "bg-white" : "bg-black"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
