"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Zap,
  BarChart3,
  TrendingUp,
  Activity,
  Wallet,
  Trophy,
  Play,
  Cpu,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info,
  ShieldCheck,
  Coins,
} from "lucide-react";
import { useStacks } from "@/contexts/StacksProvider";
import { StatSkeleton } from "@/components/ui/SkeletonLoaders";

export default function Home() {
  const { isConnected, connect } = useStacks();

  // Sidebar states (collapsed by default)
  const [leftExpanded, setLeftExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [stats, setStats] = useState({
    rounds: "...",
    totalStaked: "...",
    activePlayers: "...",
    currentBlock: "...",
  });

  useEffect(() => {
    async function fetchLiveStats() {
      try {
        const contractPrincipal =
          "SP258BY8D71JCTV73A4V3ADPHCVWSBEM6G4FETPYF.blockyields";

        // 1. Fetch Contract STX Balance
        const balRes = await fetch(
          `https://api.hiro.so/extended/v1/address/${contractPrincipal}/balances`,
        );
        const balData = await balRes.json();
        const balance = balData.stx
          ? (parseInt(balData.stx.balance) / 1e6).toFixed(2)
          : "0.00";

        // 2. Fetch Contract Transactions & Total Count
        const txRes = await fetch(
          `https://api.hiro.so/extended/v1/address/${contractPrincipal}/transactions?limit=50`,
        );
        const txData = await txRes.json();
        const totalTxs = txData.total || 0;

        // Calculate unique player addresses from tx senders
        const uniqueSenders = new Set();
        if (txData.results) {
          txData.results.forEach((tx: any) => {
            if (tx.sender_address) {
              uniqueSenders.add(tx.sender_address);
            }
          });
        }
        const activePlayersCount = uniqueSenders.size;

        // 3. Fetch latest Stacks block height
        const blockRes = await fetch(
          "https://api.hiro.so/extended/v1/block?limit=1",
        );
        const blockData = await blockRes.json();
        const latestBlock =
          blockData.results && blockData.results[0]
            ? blockData.results[0].height
            : "...";

        setStats({
          rounds: String(totalTxs),
          totalStaked: `${balance} STX`,
          activePlayers: String(activePlayersCount),
          currentBlock: String(latestBlock),
        });
      } catch (err) {
        console.error("Failed to fetch live stats:", err);
      }
    }

    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-zinc-150 font-sans selection:bg-orange-500 selection:text-black overflow-x-hidden flex flex-col justify-between">
      {/* Cyber Grid Backdrop */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-orange-650/5 rounded-full filter blur-[150px] pointer-events-none z-0" />

      {/* Main Command Console Layout */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto px-4 lg:px-8 pt-24 pb-12 gap-6 min-h-[calc(100vh-140px)]">
        {/* ================= LEFT SIDEBAR: DETERMINISTIC ARCHITECTURE ================= */}
        <motion.aside
          animate={{
            width: isMobile ? "100%" : leftExpanded ? "380px" : "64px",
            height: isMobile ? (leftExpanded ? "auto" : "70px") : "auto",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`bg-zinc-950/80 border border-zinc-900 rounded-[32px] backdrop-blur-2xl overflow-hidden flex flex-col shadow-2xl relative shrink-0 min-h-0 lg:min-h-0 ${!leftExpanded && !isMobile ? "items-center" : ""}`}
        >
          {/* Toggle Button */}
          <button
            onClick={() => setLeftExpanded(!leftExpanded)}
            className="absolute top-6 right-4 z-20 p-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all shadow-md"
            title={leftExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isMobile ? (
              leftExpanded ? (
                <ChevronLeft className="w-4 h-4 rotate-90" />
              ) : (
                <ChevronRight className="w-4 h-4 rotate-90" />
              )
            ) : leftExpanded ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
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
                      <h2 className="text-[10px] font-black uppercase text-orange-500 tracking-[0.2em]">
                        Architecture
                      </h2>
                      <p className="text-xs font-black text-white uppercase tracking-wider">
                        How Lossless Staking Works
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {[
                      {
                        step: "01",
                        title: "100% Protected Deposit",
                        desc: "Stake your STX or sBTC directly into the smart contract's lossless custody vault. Your principal is completely safe and withdrawable instantly at any time.",
                        icon: ShieldCheck,
                      },
                      {
                        step: "02",
                        title: "Accrue Yield Credits",
                        desc: "Your deposited principal generates simulated PoX (Proof of Transfer) compounding yield credits block-by-block. This acts as your risk-free wagering ammo.",
                        icon: Coins,
                      },
                      {
                        step: "03",
                        title: "Lossless Tournaments",
                        desc: "Deploy your yield credits into block prediction pools. Winners claim the pooled jackpot yield credits to convert back into STX, while losers lose nothing but virtual yield!",
                        icon: Trophy,
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4.5 space-y-3 hover:border-orange-500/10 transition-all"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center">
                              <item.icon className="w-4 h-4 text-orange-500" />
                            </div>
                            <h4 className="text-xs font-bold text-white">
                              {item.title}
                            </h4>
                          </div>
                          <span className="text-xs font-black italic text-zinc-700">
                            {item.step}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-900 text-[9px] text-zinc-600 font-black uppercase tracking-wider">
                  PoX Verified Clarity Smart Contract
                </div>
              </motion.div>
            ) : (
              /* Collapsed Tab */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setLeftExpanded(true)}
                className={`flex-1 flex ${isMobile ? "flex-row items-center justify-between px-6 py-4 w-full h-[70px]" : "flex-col items-center justify-center py-8 px-2 w-full"} cursor-pointer select-none group`}
              >
                <div
                  className={`${isMobile ? "mb-0 mr-4" : "mb-8"} h-8 w-8 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:bg-orange-500/20 transition-all border border-orange-500/20 shrink-0`}
                >
                  <Info className="w-4.5 h-4.5 text-orange-500" />
                </div>
                {isMobile ? (
                  <span className="text-[10px] font-black uppercase text-orange-500 tracking-[0.2em] flex-1 text-left">
                    Architecture & Info
                  </span>
                ) : (
                  <div
                    style={{ writingMode: "vertical-rl" }}
                    className="uppercase tracking-[0.2em] text-[9px] font-black text-center whitespace-nowrap select-none rotate-180"
                  >
                    <span className="text-orange-500">Architecture</span>
                    <span className="text-zinc-650 mx-2 select-none">—</span>
                    <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors">
                      Lossless Yield Staking
                    </span>
                  </div>
                )}
                {isMobile && <ChevronRight className="w-4 h-4 text-zinc-500" />}
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
            100% PRINCIPAL-PROTECTED PREDICT-TO-EARN
          </motion.div>

          {/* Glowing Brand Name */}
          <div className="space-y-4 max-w-2xl py-6">
            <motion.h1
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.85] uppercase italic text-white"
            >
              BLOCK
              <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
                YIELD.
              </span>
            </motion.h1>

            <p className="max-w-md mx-auto text-zinc-400 font-bold uppercase text-[10px] tracking-widest leading-relaxed pt-2">
              The Decentralized Lossless Yield-Backed Tournament Engine. 
              Stake STX safely, compound virtual stacking yields, and wager your 
              accumulated yield credits on live blockchain outcomes!
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
                <Play className="w-4 h-4 fill-black" /> Open Lossless Terminal
              </motion.button>
            </Link>
          </div>

          {/* Active Stats Grid */}
          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-zinc-900">
            {[
              {
                label: "Transaction Actions",
                value: stats.rounds,
                icon: Activity,
                suffix: "",
              },
              {
                label: "Vault Principal TVL",
                value: stats.totalStaked,
                icon: BarChart3,
                suffix: "",
              },
              {
                label: "Autonomous Earners",
                value: stats.activePlayers,
                icon: TrendingUp,
                suffix: "",
              },
              {
                label: "Stacks Block Height",
                value: stats.currentBlock,
                icon: Trophy,
                suffix: "",
              },
            ].map((stat, i) => (
              <div key={i}>
                {stat.value === "..." ? (
                  <StatSkeleton />
                ) : (
                  <div className="p-4.5 rounded-2xl bg-zinc-900/20 border border-zinc-900 text-center h-full">
                    <stat.icon className="w-4 h-4 text-orange-500/60 mx-auto mb-2" />
                    <p className="text-xl font-extrabold tracking-tight text-white italic">
                      {stat.value}
                      {stat.suffix}
                    </p>
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-1">
                      {stat.label}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.main>
      </div>
    </div>
  );
}
