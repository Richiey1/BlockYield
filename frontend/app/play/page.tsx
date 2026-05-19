"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, Zap, ShieldCheck, Wallet, ArrowRight, 
  RefreshCw, TrendingUp, Cpu, Award, HelpCircle, History 
} from "lucide-react";
import { useStacks } from "@/contexts/StacksProvider";
import { CONTRACT_NAME, DEPLOYER_ADDRESS } from "@/lib/constants/contracts";
import { openContractCall } from "@stacks/connect";
import { uintCV, PostConditionMode } from "@stacks/transactions";

interface BlockData {
  height: number;
  tx_count: number;
  size: number;
  fees: number;
  timestamp: string;
}

interface PredictionRound {
  id: number;
  targetBlock: number;
  outcomeType: "tx-count" | "block-fees";
  status: "open" | "resolved";
  totalPool: string;
  myStake?: {
    amount: string;
    prediction: number;
  };
  options: { label: string; value: number }[];
  outcome?: number;
  hasClaimed?: boolean;
}

export default function PlayDashboard() {
  const { address, isConnected, connect } = useStacks();
  const [stxBalance, setStxBalance] = useState("0");
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  
  // Interactive Betting state
  const [selectedRound, setSelectedRound] = useState<number>(0);
  const [predictionVal, setPredictionVal] = useState<number | null>(null);
  const [stakeAmount, setStakeAmount] = useState("");
  
  // Mock interactive rounds (fully integrated structure mapping to the blockbet contract)
  const [rounds, setRounds] = useState<PredictionRound[]>([
    {
      id: 0,
      targetBlock: 145920,
      outcomeType: "tx-count",
      status: "open",
      totalPool: "1,420 STX",
      options: [
        { label: "Under 25 Transactions", value: 1 },
        { label: "25 or More Transactions", value: 2 },
      ]
    },
    {
      id: 1,
      targetBlock: 145921,
      outcomeType: "block-fees",
      status: "open",
      totalPool: "850 STX",
      options: [
        { label: "Under 0.05 STX Fees", value: 1 },
        { label: "0.05 STX or More Fees", value: 2 },
      ]
    },
    {
      id: 2,
      targetBlock: 145890,
      outcomeType: "tx-count",
      status: "resolved",
      totalPool: "3,200 STX",
      outcome: 2,
      myStake: {
        amount: "150",
        prediction: 2
      },
      hasClaimed: false,
      options: [
        { label: "Under 30 Transactions", value: 1 },
        { label: "30 or More Transactions", value: 2 },
      ]
    }
  ]);

  // Fetch recent Stacks blocks from Hiro API
  async function fetchRecentBlocks() {
    setIsLoadingBlocks(true);
    try {
      const res = await fetch("https://api.hiro.so/extended/v1/block?limit=5");
      const data = await res.json();
      if (data.results) {
        const parsed: BlockData[] = data.results.map((b: any) => ({
          height: b.height,
          tx_count: b.txs.length,
          size: b.size,
          fees: b.txs.reduce((acc: number, tx: any) => acc + parseInt(tx.fee_rate || "0"), 0) / 1e6, // Convert micro-STX to STX
          timestamp: new Date(b.burn_block_time * 1000).toLocaleTimeString()
        }));
        setBlocks(parsed);
      }
    } catch (err) {
      console.error("Failed to fetch blocks:", err);
    } finally {
      setIsLoadingBlocks(false);
    }
  }

  // Fetch Stacks Balance
  async function fetchBalance(userAddr: string) {
    try {
      const res = await fetch(`https://api.hiro.so/extended/v1/address/${userAddr}/balances`);
      const data = await res.json();
      if (data.stx) {
        const bal = parseInt(data.stx.balance) / 1e6; // Convert micro-STX to STX
        setStxBalance(bal.toFixed(4));
      }
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  }

  useEffect(() => {
    fetchRecentBlocks();
    const interval = setInterval(fetchRecentBlocks, 30000); // Polling every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      fetchBalance(address);
    }
  }, [isConnected, address]);

  // Execute on-chain place-stake transaction call
  async function handlePlaceStake() {
    if (!isConnected) {
      connect();
      return;
    }
    if (predictionVal === null) {
      setStatusMsg("Error: Please select a prediction option.");
      return;
    }
    if (!stakeAmount || isNaN(parseFloat(stakeAmount))) {
      setStatusMsg("Error: Please enter a valid stake amount.");
      return;
    }

    const microStx = Math.floor(parseFloat(stakeAmount) * 1e6);
    setStatusMsg("Preparing prediction transaction...");

    try {
      await openContractCall({
        contractAddress: DEPLOYER_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: "place-stake",
        functionArgs: [
          uintCV(selectedRound),
          uintCV(microStx),
          uintCV(predictionVal)
        ],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: 3, // AnchorMode.Any
        onFinish: (data) => {
          setStatusMsg(`Prediction broadcasted successfully! TxID: ${data.txId.substring(0, 16)}...`);
          // Optimistically update the UI round stakes
          const updated = [...rounds];
          updated[selectedRound].myStake = {
            amount: stakeAmount,
            prediction: predictionVal
          };
          setRounds(updated);
          if (address) fetchBalance(address);
        },
        onCancel: () => {
          setStatusMsg("Transaction canceled by player.");
        }
      });
    } catch (error: any) {
      setStatusMsg(`Transaction error: ${error.message}`);
    }
  }

  // Execute on-chain claim-reward transaction call
  async function handleClaimPayout(roundId: number) {
    if (!isConnected) {
      connect();
      return;
    }
    setStatusMsg(`Claiming rewards for round #${roundId}...`);
    try {
      await openContractCall({
        contractAddress: DEPLOYER_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: "claim-reward",
        functionArgs: [uintCV(roundId)],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: 3,
        onFinish: (data) => {
          setStatusMsg(`Payout claim broadcasted! TxID: ${data.txId.substring(0, 16)}...`);
          const updated = [...rounds];
          const round = updated.find(r => r.id === roundId);
          if (round) {
            round.hasClaimed = true;
          }
          setRounds(updated);
          if (address) fetchBalance(address);
        },
        onCancel: () => {
          setStatusMsg("Claim canceled.");
        }
      });
    } catch (err: any) {
      setStatusMsg(`Claim error: ${err.message}`);
    }
  }

  const handleMax = () => {
    if (stxBalance) {
      // Leave gas safety buffer of 0.05 STX
      const maxVal = Math.max(0, parseFloat(stxBalance) - 0.05);
      setStakeAmount(maxVal.toFixed(4));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-orange-500 selection:text-black p-4 md:p-8">
      {/* Background Grids */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-zinc-900 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* Navigation & Wallet Dashboard */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 backdrop-blur-xl gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-widest italic">BLOCK<span className="text-orange-500">BET.</span></h1>
              <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Predictive On-Chain Terminal</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isConnected ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] text-zinc-500 uppercase font-black">STX BALANCE</p>
                  <p className="text-sm font-black text-orange-500">{stxBalance} STX</p>
                </div>
                <div className="bg-zinc-850 px-4 py-2 border border-zinc-800 rounded-2xl text-xs font-black uppercase tracking-widest text-zinc-300">
                  {address?.substring(0, 5)}...{address?.substring(address.length - 4)}
                </div>
              </div>
            ) : (
              <button 
                onClick={connect}
                className="bg-orange-500 hover:bg-orange-600 text-black font-black uppercase tracking-widest text-xs px-6 py-3 rounded-2xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] flex items-center gap-2"
              >
                <Wallet className="w-4 h-4" /> Connect Wallet
              </button>
            )}
          </div>
        </header>

        {/* Status Prompt */}
        {statusMsg && (
          <div className="bg-zinc-900/90 border-l-4 border-orange-500 p-4 rounded-xl text-xs text-orange-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>⚡ {statusMsg}</span>
            <button onClick={() => setStatusMsg("")} className="text-zinc-500 hover:text-white font-black">X</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Live Block Analytics Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-black uppercase tracking-wider">Live Stacks Analytics Feed</h2>
                </div>
                <button 
                  onClick={fetchRecentBlocks} 
                  className={`p-2 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 transition-all ${isLoadingBlocks ? "animate-spin" : ""}`}
                >
                  <RefreshCw className="w-4 h-4 text-zinc-400" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest">
                      <th className="pb-3 font-black">Block Height</th>
                      <th className="pb-3 font-black">Transactions</th>
                      <th className="pb-3 font-black">Block Size</th>
                      <th className="pb-3 font-black">Total Fees</th>
                      <th className="pb-3 font-black text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blocks.map((block, idx) => (
                      <tr key={idx} className="border-b border-zinc-800/40 hover:bg-zinc-800/20 transition-all">
                        <td className="py-4 font-black text-orange-500">#{block.height}</td>
                        <td className="py-4 font-black">{block.tx_count} Txs</td>
                        <td className="py-4 font-bold text-zinc-400">{(block.size / 1024).toFixed(2)} KB</td>
                        <td className="py-4 font-mono text-zinc-400">{block.fees.toFixed(6)} STX</td>
                        <td className="py-4 text-right text-zinc-500">{block.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Prediction Ledger / "My Bets" */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <History className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-black uppercase tracking-wider">My Prediction Ledger</h2>
              </div>

              <div className="space-y-4">
                {rounds.filter(r => r.myStake).map((round, idx) => {
                  const isWon = round.status === "resolved" && round.myStake?.prediction === round.outcome;
                  
                  return (
                    <div key={idx} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black uppercase text-zinc-400">Round #{round.id}</span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-zinc-800 text-orange-400 border border-zinc-700">
                            {round.outcomeType}
                          </span>
                        </div>
                        <p className="text-sm font-bold mt-1">Staked on target block: #{round.targetBlock}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">My Stake: <span className="text-zinc-300 font-bold">{round.myStake?.amount} STX</span> (Predicted Option: #{round.myStake?.prediction})</p>
                      </div>

                      <div>
                        {round.status === "open" ? (
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl">
                            Pending Block
                          </span>
                        ) : isWon ? (
                          round.hasClaimed ? (
                            <span className="text-[10px] font-black uppercase tracking-widest text-green-500 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl">
                              Won & Claimed
                            </span>
                          ) : (
                            <button
                              onClick={() => handleClaimPayout(round.id)}
                              className="text-[10px] bg-green-500 hover:bg-green-600 text-black font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                            >
                              🏆 Claim STX Payout
                            </button>
                          )
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl">
                            Unsuccessful
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Live Staking Panel */}
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-orange-500/20 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Cpu className="w-16 h-16 text-orange-500" />
              </div>

              <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
                <Cpu className="w-5 h-5 text-orange-500" />
                <h2 className="text-md font-black uppercase tracking-widest">Prediction Terminal</h2>
              </div>

              <div className="space-y-6">
                
                {/* Round Selector */}
                <div>
                  <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block mb-2">Select Active Round</label>
                  <div className="grid grid-cols-2 gap-2">
                    {rounds.filter(r => r.status === "open").map((r, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedRound(r.id);
                          setPredictionVal(null);
                        }}
                        className={`p-3 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all ${selectedRound === r.id ? "bg-orange-500/10 border-orange-500 text-orange-500" : "bg-zinc-950/40 border-zinc-800 hover:border-zinc-700 text-zinc-400"}`}
                      >
                        Round #{r.id} ({r.outcomeType})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prediction Options */}
                <div>
                  <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block mb-2">Choose Prediction</label>
                  <div className="space-y-2">
                    {rounds[selectedRound]?.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => setPredictionVal(opt.value)}
                        className={`w-full p-4 rounded-2xl border text-xs font-bold text-left transition-all flex items-center justify-between ${predictionVal === opt.value ? "bg-orange-500/10 border-orange-500 text-orange-500" : "bg-zinc-950/40 border-zinc-800 hover:border-zinc-700 text-zinc-300"}`}
                      >
                        <span>{opt.label}</span>
                        {predictionVal === opt.value && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stake Input */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Stake Amount (STX)</label>
                    {isConnected && (
                      <button 
                        onClick={handleMax}
                        className="text-[9px] font-black uppercase text-orange-500 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded"
                      >
                        MAX
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Amount STX"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-orange-500"
                    />
                    <div className="mt-2 text-[9px] text-zinc-500 text-right font-black">
                      {stakeAmount && !isNaN(parseFloat(stakeAmount))
                        ? `≈ ${(parseFloat(stakeAmount) * 1e6).toLocaleString()} micro-STX`
                        : "0 micro-STX"}
                    </div>
                  </div>
                </div>

                {/* Submit action */}
                <button
                  onClick={handlePlaceStake}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-black font-black uppercase tracking-widest py-4 px-6 rounded-2xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.15)] flex items-center justify-center gap-3 text-xs"
                >
                  Confirm Prediction Stake <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Rules */}
            <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="w-4 h-4 text-orange-500/60" />
                <h3 className="text-xs font-black uppercase text-zinc-400">Prediction Protocol</h3>
              </div>
              <ul className="space-y-2 text-[10px] text-zinc-500 leading-relaxed">
                <li>1. Choose an active round targeting a future Stacks block height.</li>
                <li>2. Stake STX on your prediction outcome. Stakes are held in the contract.</li>
                <li>3. When the block height is reached, the automated resolver submits the outcome.</li>
                <li>4. Proportional pool shares are instantly claimable by winners (2% protocol fee).</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
