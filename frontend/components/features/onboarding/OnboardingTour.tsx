"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Gamepad2, TrendingUp, Wallet2 } from "lucide-react";

const slides = [
  {
    title: "Welcome to BlockYield",
    description: "The first on-chain prediction game where you bet on real-time blockchain events.",
    icon: <Gamepad2 className="w-10 h-10 text-orange-500" />,
    color: "from-orange-500/10 to-transparent",
  },
  {
    title: "Predict & Win",
    description: "Will the next block have more than 50 transactions? Analyze the pulse and place your STX.",
    icon: <TrendingUp className="w-10 h-10 text-blue-500" />,
    color: "from-blue-500/10 to-transparent",
  },
  {
    title: "Instant Rewards",
    description: "Winners are determined automatically by the smart contract. No oracles, just pure code.",
    icon: <Wallet2 className="w-10 h-10 text-green-500" />,
    color: "from-green-500/10 to-transparent",
  },
];

export default function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("blockyield_tour_seen");
    if (!hasSeenTour) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("blockyield_tour_seen", "true");
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-sm overflow-hidden bg-zinc-950/90 border border-zinc-800 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_30px_rgba(249,115,22,0.05)] backdrop-blur-xl"
      >
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

        {/* Dynamic Background Glow */}
        <div className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].color} transition-colors duration-500 opacity-60 pointer-events-none`} />

        <div className="relative p-6 flex flex-col items-center text-center">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer"
            title="Skip Tour"
          >
            <X size={16} />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="flex flex-col items-center w-full"
            >
              <div className="mb-4 p-3 bg-zinc-900/80 rounded-xl border border-zinc-800/80 shadow-inner">
                {slides[currentSlide].icon}
              </div>
              <h2 className="text-xl font-black text-white mb-2 tracking-tight uppercase italic">
                {slides[currentSlide].title}
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6 max-w-[280px]">
                {slides[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between w-full mt-2 pt-2 border-t border-zinc-900">
            {/* Dots */}
            <div className="flex gap-1">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentSlide ? "w-6 bg-orange-500" : "w-1.5 bg-zinc-800"
                  }`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={nextSlide}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] active:scale-95 group cursor-pointer"
            >
              <span>{currentSlide === slides.length - 1 ? "Start Playing" : "Next"}</span>
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform text-black" strokeWidth={3} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
