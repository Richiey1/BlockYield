"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Zap, BarChart3, TrendingUp, Activity, ArrowRight, 
  Wallet, ShieldCheck, Trophy, Timer, Play, Cpu, 
  Sparkles, Layers, DollarSign, ChevronRight
} from "lucide-react";
import { useStacks } from "@/contexts/StacksProvider";

export default function Home() {
  const { isConnected, connect } = useStacks();
  const [stats, setStats] = useState({
    rounds: 184,
    totalStaked: "64.2k STX",
    activePlayers: 142,
    accuracy: "74%"
  });

  return (
    <div className="min-h-screen bg-black text-zinc-150 font-sans selection:bg-orange-500 selection:text-black overflow-x-hidden">
      
      {/* Premium Cyber-grid Backdrop */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="fixed top-0 left-1/3 w-[600px] h-[600px] bg-orange-650/5 rounded-full filter blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[700px] h-[700px] bg-zinc-800/10 rounded-full filter blur-[160px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-16 flex flex-col items-center text-center space-y-10">
        
        {/* Animated Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full bg-zinc-900/60 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg"
        >
          <Sparkles className="w-3.5 h-3.5 fill-orange-500/20 text-orange-400 animate-pulse" />
          Predict the Chain, Not the Market
        </motion.div>

        {/* Master Heading */}
        <div className="space-y-4 max-w-5xl">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-6xl sm:text-8xl md:text-[9.5rem] font-black tracking-tighter leading-[0.85] uppercase italic text-white"
          >
            BLOCK<span className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent">BET.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="max-w-2xl mx-auto text-zinc-400 font-bold uppercase text-[11px] sm:text-xs tracking-widest leading-relaxed pt-2"
          >
            An ultra-premium on-chain behavior prediction protocol. Stake micro-STX on Stacks block activity and claim rewards proportionally.
          </motion.p>
        </div>

        {/* Action Buttons with active Link routing */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full max-w-md"
        >
          <Link href="/play" className="w-full sm:w-auto">
            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black uppercase tracking-widest text-xs shadow-lg shadow-orange-500/20 flex items-center justify-center gap-3"
            >
              <Play className="w-4.5 h-4.5 fill-black" /> Start Predicting
            </motion.button>
          </Link>
          
          <a href="#how-it-works" className="w-full sm:w-auto">
            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-zinc-300 font-black uppercase tracking-widest text-xs hover:bg-zinc-900 transition-all flex items-center justify-center gap-3"
            >
              How it works <ShieldCheck className="w-4.5 h-4.5 text-orange-500" />
            </motion.button>
          </a>
        </motion.div>

      </section>

      {/* Stats Counter Matrix */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Prediction Rounds", value: stats.rounds, icon: Activity, suffix: "+" },
            { label: "Total STX Staked", value: stats.totalStaked, icon: BarChart3, suffix: "" },
            { label: "Active Players", value: stats.activePlayers, icon: TrendingUp, suffix: "" },
            { label: "Avg Accuracy", value: stats.accuracy, icon: Trophy, suffix: "" },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.35 }}
              className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/80 backdrop-blur-2xl shadow-lg relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <stat.icon className="w-4 h-4 text-orange-500/60" />
              </div>
              <stat.icon className="w-5 h-5 text-orange-500 mb-4" />
              <p className="text-3xl font-extrabold tracking-tight text-white italic">
                {stat.value}{stat.suffix}
              </p>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Step-by-Step Pipeline (How It Works) */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-6 py-16 scroll-mt-24">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-xs font-black uppercase text-orange-500 tracking-[0.25em]">Deterministic Architecture</h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight italic">How Predict-To-Earn Works</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {[
            {
              step: "01",
              title: "Secure Authentication",
              desc: "Connect your Stacks L2 wallet natively. All bets and payouts are fully governed by transparent, on-chain smart contracts.",
              icon: Wallet
            },
            {
              step: "02",
              title: "Stake On Block Pulse",
              desc: "Select a future target block height. Stake micro-STX on outcomes like block size, transaction spikes, or aggregate network fees.",
              icon: Cpu
            },
            {
              step: "03",
              title: "Proportional Payouts",
              desc: "Once resolved directly from Hiro's block API, winners claim their proportional share of the reward pool, less a 2% platform fee.",
              icon: DollarSign
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-zinc-900/20 border border-zinc-800/80 rounded-3xl p-8 flex flex-col justify-between space-y-6 hover:border-orange-500/10 transition-all relative">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-orange-500" />
                </div>
                <span className="text-4xl font-black italic bg-gradient-to-r from-zinc-800 to-zinc-700 bg-clip-text text-transparent">{item.step}</span>
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white mb-2.5">{item.title}</h3>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cyber-Nodes Game Modes Showcase */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16 mb-16">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-xs font-black uppercase text-orange-500 tracking-[0.25em]">Supported Operations</h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight italic">Interactive Game Modes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              title: "Block Pulse", 
              desc: "Predict transactional metrics, fee surges, or bytecode size within the upcoming Stacks block cycles.", 
              time: "1-2 Blocks",
              icon: Zap
            },
            { 
              title: "DeFi Velocity", 
              desc: "Forecast active trading activity volume spikes or DEX transaction surges on Stacks-based exchanges.", 
              time: "3-5 Blocks",
              icon: Layers
            },
            { 
              title: "L2 Volatility", 
              desc: "Predict short-term STX asset fluctuations anchored by deterministic on-chain smart contract signals.", 
              time: "5-10 Blocks",
              icon: TrendingUp
            }
          ].map((mode, i) => (
            <Link href="/play" key={i}>
              <motion.div 
                whileHover={{ y: -6, borderColor: "rgba(249,115,22,0.3)" }}
                className="group p-8 rounded-[2.5rem] bg-zinc-900/30 border border-zinc-800/80 hover:border-orange-500/20 transition-all relative overflow-hidden h-full flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                  <mode.icon className="w-28 h-28 rotate-12" />
                </div>
                
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-8 border border-orange-500/20">
                    <mode.icon className="w-7 h-7 text-orange-500" />
                  </div>
                  
                  <h3 className="text-2xl font-black tracking-tight italic uppercase mb-3 text-white">{mode.title}</h3>
                  <p className="text-zinc-400 font-medium text-xs leading-relaxed mb-8">{mode.desc}</p>
                </div>
                
                <div className="flex items-center justify-between pt-6 border-t border-zinc-900">
                  <div className="flex items-center gap-2">
                    <Timer className="w-3.5 h-3.5 text-orange-500/60" />
                    <span className="text-[9px] font-black text-orange-500/60 uppercase tracking-widest">{mode.time}</span>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-zinc-950/60 border border-zinc-850 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-black transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/40 py-8 text-center relative z-10 text-[10px] text-zinc-500 uppercase tracking-widest font-black">
        © 2026 BlockBet Protocol. ALL RIGHT RESERVED ON-CHAIN.
      </footer>

    </div>
  );
}
