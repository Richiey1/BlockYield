"use client";

import { motion } from "framer-motion";

const Shimmer = () => (
  <motion.div
    initial={{ x: "-100%" }}
    animate={{ x: "100%" }}
    transition={{
      repeat: Infinity,
      duration: 1.5,
      ease: "linear",
    }}
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
  />
);

export const RoundSkeleton = () => (
  <div className="relative overflow-hidden bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
    <div className="flex justify-between items-start">
      <div className="h-6 w-32 bg-zinc-800 rounded-lg" />
      <div className="h-6 w-16 bg-zinc-800 rounded-lg" />
    </div>
    <div className="h-4 w-full bg-zinc-800/50 rounded" />
    <div className="flex gap-4 mt-2">
      <div className="h-12 flex-1 bg-zinc-800 rounded-xl" />
      <div className="h-12 flex-1 bg-zinc-800 rounded-xl" />
    </div>
    <Shimmer />
  </div>
);

export const StatSkeleton = () => (
  <div className="relative overflow-hidden bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4 flex flex-col gap-2">
    <div className="h-3 w-20 bg-zinc-800/70 rounded" />
    <div className="h-8 w-24 bg-zinc-800 rounded-lg" />
    <Shimmer />
  </div>
);

export const ListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="flex flex-col gap-4 w-full">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="relative overflow-hidden h-20 bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-4 flex items-center justify-between">
        <div className="flex gap-4 items-center">
          <div className="w-10 h-10 bg-zinc-800 rounded-full" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-32 bg-zinc-800 rounded" />
            <div className="h-3 w-20 bg-zinc-800/50 rounded" />
          </div>
        </div>
        <div className="h-8 w-24 bg-zinc-800 rounded-lg" />
        <Shimmer />
      </div>
    ))}
  </div>
);
