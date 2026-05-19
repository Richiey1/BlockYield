"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Zap, BarChart3, TrendingUp, Activity, ArrowRight, 
  Wallet, ShieldCheck, Trophy, Timer, Play, Cpu, 
  Sparkles, Layers, DollarSign, ChevronLeft, ChevronRight,
  Menu, Info, Eye, EyeOff
} from "lucide-react";
import { useStacks } from "@/contexts/StacksProvider";

export default function Home() {
  const { isConnected, connect } = useStacks();
  
  // Sidebar states (collapsed by default)
  const [leftExpanded, setLeftExpanded] = useState(false);
  const [rightExpanded, setRightExpanded] = useState(false);

  const [stats] = useState({
    rounds: 184,
    totalStaked: "64.2k STX",
    activePlayers: 142,
    accuracy: "74%"
  });

  return (
    <div className="min-h-screen bg-black text-zinc-150 font-sans selection:bg-orange-500 selection:text-black overflow-x-hidden flex flex-col justify-between">
      
      {/* Cyber Grid Backdrop */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-orange-650/5 rounded-full filter blur-[150px] pointer-events-none z-0" />

      {/* Main Command Console Layout */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto px-4 lg:px-8 pt-24 pb-12 gap-6 min-h-[calc(100vh-140px)]">
        
        {/* ================= LEFT SIDEBAR: DETERMINISTIC ARCHITECTURE ================= */}
        <motion.aside 
          animate={{ width: leftExpanded ? "380px" : "64px" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`bg-zinc-950/80 border border-zinc-900 rounded-[32px] backdrop-blur-2xl overflow-hidden flex flex-col shadow-2xl relative shrink-0 min-h-[400px] lg:min-h-0 ${!leftExpanded ? "items-center" : ""}`}
        >
          {/* Toggle Button */}
          <button 
            onClick={() => setLeftExpanded(!leftExpanded)}
            className="absolute top-6 right-4 z-20 p-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all shadow-md"
            title={leftExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {leftExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {/* Expanded Content */}
          <AnimatePresence mode="wait">
            {leftExpanded ? (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-6 flex-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Info className="w-4.5 h-4.5 text-orange-500" />
                    <div>
                      <h2 className="text-[10px] font-black uppercase text-orange-500 tracking-[0.2em]">Architecture</h2>
                      <p className="text-xs font-black text-white uppercase tracking-wider">How Predict-To-Earn Works</p>
                    </div>
                  </div>

                  <div className="space-y-6">
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
                        desc: "Select an active round. Stake micro-STX on block size, transaction count, or aggregate network fees.",
                        icon: Cpu
                      },
                      {
                        step: "03",
                        title: "Proportional Payouts",
                        desc: "Once resolved directly from Hiro's block API, winners claim their proportional share of the reward pool.",
                        icon: DollarSign
                      }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4.5 space-y-3 hover:border-orange-500/10 transition-all">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center">
                              <item.icon className="w-4 h-4 text-orange-500" />
                            </div>
                            <h4 className="text-xs font-bold text-white">{item.title}</h4>
                          </div>
                          <span className="text-xs font-black italic text-zinc-700">{item.step}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-900 text-[9px] text-zinc-600 font-black uppercase tracking-wider">
                  Verified Clarity Smart Contract
                </div>
              </motion.div>
            ) : (
              /* Collapsed Tab */
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setLeftExpanded(true)}
                className="flex-1 flex flex-col items-center justify-center py-8 cursor-pointer select-none group px-2"
              >
                <div className="h-8 w-8 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:bg-orange-500/20 transition-all border border-orange-500/20 mb-8">
                  <Info className="w-4 h-4 text-orange-500" />
                </div>
                <div 
                  style={{ writingMode: "vertical-rl" }} 
                  className="uppercase tracking-[0.2em] text-[9px] font-black text-center whitespace-nowrap select-none rotate-180"
                >
                  <span className="text-orange-500">Architecture</span>
                  <span className="text-zinc-600 mx-2 select-none">—</span>
                  <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors">How Predict-To-Earn Works</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.aside>

        {/* ================= MIDDLE CONSOLE: CORE LOGO & INTERACTIVE STATS ================= */}
        <motion.main 
          layout
          className="flex-1 bg-zinc-950/20 border border-zinc-900 rounded-[32px] p-8 flex flex-col justify-between items-center text-center backdrop-blur-2xl shadow-xl min-h-[500px]"
        >
          {/* Sparkle Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/60 border border-orange-500/10 text-orange-400 text-[9px] font-black uppercase tracking-[0.2em] shadow-sm"
          >
            <Sparkles className="w-3 h-3 fill-orange-500/20 animate-pulse text-orange-400" />
            Predict the Chain, Not the Market
          </motion.div>

          {/* Glowing Brand Name */}
          <div className="space-y-4 max-w-2xl py-6">
            <motion.h1 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.85] uppercase italic text-white"
            >
              BLOCK<span className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent">BET.</span>
            </motion.h1>
            
            <p className="max-w-md mx-auto text-zinc-400 font-bold uppercase text-[10px] tracking-widest leading-relaxed pt-2">
              An ultra-premium on-chain behavior prediction protocol. Stake micro-STX on Stacks block activity and claim rewards proportionally.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full max-w-sm">
            <Link href="/play" className="w-full">
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full px-8 py-4.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-black" /> Enter Prediction Terminal
              </motion.button>
            </Link>
          </div>

          {/* Active Stats Grid */}
          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-zinc-900">
            {[
              { label: "Prediction Rounds", value: stats.rounds, icon: Activity, suffix: "+" },
              { label: "Total STX Staked", value: stats.totalStaked, icon: BarChart3, suffix: "" },
              { label: "Active Players", value: stats.activePlayers, icon: TrendingUp, suffix: "" },
              { label: "Avg Accuracy", value: stats.accuracy, icon: Trophy, suffix: "" },
            ].map((stat, i) => (
              <div key={i} className="p-4.5 rounded-2xl bg-zinc-900/20 border border-zinc-900 text-center">
                <stat.icon className="w-4 h-4 text-orange-500/60 mx-auto mb-2" />
                <p className="text-xl font-extrabold tracking-tight text-white italic">{stat.value}{stat.suffix}</p>
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.main>

        {/* ================= RIGHT SIDEBAR: SUPPORTED OPERATIONS ================= */}
        <motion.aside 
          animate={{ width: rightExpanded ? "380px" : "64px" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`bg-zinc-950/80 border border-zinc-900 rounded-[32px] backdrop-blur-2xl overflow-hidden flex flex-col shadow-2xl relative shrink-0 min-h-[400px] lg:min-h-0 ${!rightExpanded ? "items-center" : ""}`}
        >
          {/* Toggle Button */}
          <button 
            onClick={() => setRightExpanded(!rightExpanded)}
            className="absolute top-6 left-4 z-20 p-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all shadow-md"
            title={rightExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {rightExpanded ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Expanded Content */}
          <AnimatePresence mode="wait">
            {rightExpanded ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="p-6 flex-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-6 justify-end text-right">
                    <div className="text-right">
                      <h2 className="text-[10px] font-black uppercase text-orange-500 tracking-[0.2em]">Supported Operations</h2>
                      <p className="text-xs font-black text-white uppercase tracking-wider">Interactive Game Modes</p>
                    </div>
                    <Layers className="w-4.5 h-4.5 text-orange-500" />
                  </div>

                  <div className="space-y-6">
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
                      <Link href="/play" key={i} className="block">
                        <div className="group p-4.5 rounded-2xl bg-zinc-900/20 border border-zinc-900 hover:border-orange-500/20 transition-all flex flex-col justify-between relative overflow-hidden h-[120px]">
                          <div className="flex justify-between items-start">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                              <mode.icon className="w-4.5 h-4.5 text-orange-500" />
                            </div>
                            <div className="flex items-center gap-1">
                              <Timer className="w-3 h-3 text-orange-500/60" />
                              <span className="text-[8px] font-black text-orange-500/60 uppercase tracking-wider">{mode.time}</span>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-xs font-extrabold text-white group-hover:text-orange-400 transition-colors uppercase italic">{mode.title}</h4>
                            <p className="text-[9px] text-zinc-500 font-medium leading-relaxed mt-1 line-clamp-2">{mode.desc}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-900 text-[9px] text-zinc-600 font-black uppercase tracking-wider text-right">
                  Active Hiro block indexing feed
                </div>
              </motion.div>
            ) : (
              /* Collapsed Tab */
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setRightExpanded(true)}
                className="flex-1 flex flex-col items-center justify-center py-8 cursor-pointer select-none group px-2"
              >
                <div className="h-8 w-8 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:bg-orange-500/20 transition-all border border-orange-500/20 mb-8">
                  <Layers className="w-4 h-4 text-orange-500" />
                </div>
                <div 
                  style={{ writingMode: "vertical-rl" }} 
                  className="uppercase tracking-[0.2em] text-[9px] font-black text-center whitespace-nowrap select-none rotate-180"
                >
                  <span className="text-orange-500">Supported Operations</span>
                  <span className="text-zinc-650 mx-2 select-none">—</span>
                  <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors">Interactive Game Modes</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.aside>

      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/40 py-6 text-center relative z-10 text-[9px] text-zinc-650 uppercase tracking-widest font-black">
        © 2026 BlockBet Protocol. ALL RIGHTS RESERVED ON-CHAIN.
      </footer>

    </div>
  );
}
