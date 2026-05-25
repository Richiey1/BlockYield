"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Gamepad2, TrendingUp, Wallet2 } from "lucide-react";

const slides = [
  {
    title: "Welcome to BlockBet",
    description: "The first on-chain prediction game where you bet on real-time blockchain events.",
    icon: <Gamepad2 className="w-12 h-12 text-orange-500" />,
    color: "from-orange-500/20 to-transparent",
  },
  {
    title: "Predict & Win",
    description: "Will the next block have more than 50 transactions? Analyze the pulse and place your STX.",
    icon: <TrendingUp className="w-12 h-12 text-blue-500" />,
    color: "from-blue-500/20 to-transparent",
  },
  {
    title: "Instant Rewards",
    description: "Winners are determined automatically by the smart contract. No oracles, just pure code.",
    icon: <Wallet2 className="w-12 h-12 text-green-500" />,
    color: "from-green-500/20 to-transparent",
  },
];

export default function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("blockbet_tour_seen");
    if (!hasSeenTour) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("blockbet_tour_seen", "true");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md overflow-hidden bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl"
      >
        {/* Background Glow */}
        <div className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].color} transition-colors duration-500`} />

        <div className="relative p-8 flex flex-col items-center text-center">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center"
            >
              <div className="mb-6 p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700">
                {slides[currentSlide].icon}
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                {slides[currentSlide].title}
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-8">
                {slides[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between w-full mt-auto">
            <div className="flex gap-1.5">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentSlide ? "w-8 bg-orange-500" : "w-2 bg-zinc-700"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all active:scale-95 group"
            >
              {currentSlide === slides.length - 1 ? "Start Playing" : "Next"}
              <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
