"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, Zap, ShieldCheck, Wallet, ArrowRight, 
  RefreshCw, Cpu, HelpCircle, History,
  Coins, CheckCircle, Clock, Plus, Minus, ArrowDownRight,
  AlertTriangle, Loader2, ChevronDown, ChevronUp
} from "lucide-react";
import { useStacks } from "@/contexts/StacksProvider";
import { useBlockYield } from '@/lib/hooks/useBlockYield';
import { CONTRACT_NAME, DEPLOYER_ADDRESS, FUNCTION_NAMES } from "@/lib/constants/contracts";
import { openContractCall } from "@stacks/connect";
import { uintCV, contractPrincipalCV, PostConditionMode, Pc } from "@stacks/transactions";
import { STACKS_MAINNET } from "@stacks/network";
import { fetchDynamicRounds } from "./dynamicRounds";

// Strategy principal to pass to deposit-stx / withdraw-stx.
// When no live mainnet strategy is active the contract's match branch resolves to `true` (no-op),
// so this value is required by the function signature but is effectively inert until an admin
// activates a strategy via deploy-yield.
const MOCK_STRATEGY_PRINCIPAL = { address: "SP2C2YFP12AJZB4MABJEJ6QQFTXWQVNZ8SYWPWHF", name: "arkadiko-stx-reserve-v2-1" } as const;

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
  outcomeType: "parity" | "tx-count";
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
  const {
    stxBalance, rawMicroStx, vaultPrincipal, yieldCredits,
    isLoadingBalance, maxDepositSTX, maxRedeemCredits,
    fetchBalance, setStxBalance, setVaultPrincipal, setYieldCredits,
  } = useBlockYield();

  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(true);
  
  // Staking Input States
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [redeemAmount, setRedeemAmount] = useState("");

  // Transaction Simulation State
  const [simState, setSimState] = useState<"idle" | "simulating" | "pending_signature" | "submitted" | "confirming" | "success" | "error" | "rejected">("idle");
  const [simAction, setSimAction] = useState<"deposit" | "withdraw" | "redeem" | "bet">("deposit");
  const [simAmount, setSimAmount] = useState("");
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);
  
  // Smart Validation
  const depositMicro = BigInt(Math.floor(parseFloat(depositAmount || "0") * 1e6));
  const exceedsDeposit = depositMicro > rawMicroStx && rawMicroStx > BigInt(0);
  const exceedsWithdraw = parseFloat(withdrawAmount || "0") > parseFloat(vaultPrincipal);
  const exceedsRedeem = parseFloat(redeemAmount || "0") > parseFloat(yieldCredits);

  // Betting state
  const [selectedRound, setSelectedRound] = useState<number>(154210);
  const [predictionVal, setPredictionVal] = useState<number | null>(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const exceedsBet = parseFloat(stakeAmount || "0") > parseFloat(yieldCredits);
  
  // Open simulation modal before executing a tx
  function openSim(action: "deposit" | "withdraw" | "redeem" | "bet", amount: string, fn: () => Promise<void>) {
    setSimAction(action);
    setSimAmount(amount);
    setPendingAction(() => fn);
    setSimState("simulating");
  }
  
  const [rounds, setRounds] = useState<PredictionRound[]>([]);
  const [isFetchingRounds, setIsFetchingRounds] = useState(false);

  // Real-time compounding visual ticking yield counter — now handled by useBlockYield hook

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
          fees: b.txs.reduce((acc: number, tx: any) => acc + parseInt(tx.fee_rate || "0"), 0) / 1e6,
          timestamp: new Date(b.burn_block_time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setBlocks(parsed);
      }
    } catch (err) {
      console.error("Failed to fetch blocks:", err);
    } finally {
      setIsLoadingBlocks(false);
    }
  }

  // Balance and contract state logic is fully handled by useBlockYield

  async function fetchRounds() {
    setIsFetchingRounds(true);
    try {
      const dynamicRounds = await fetchDynamicRounds(address || null);
      if (dynamicRounds.length > 0) {
        setRounds(dynamicRounds as PredictionRound[]);
        if (!dynamicRounds.find(r => r.id === selectedRound)) {
          setSelectedRound(dynamicRounds[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to fetch rounds:", e);
    } finally {
      setIsFetchingRounds(false);
    }
  }

  useEffect(() => {
    fetchRecentBlocks();
    fetchRounds();
    const interval = setInterval(() => {
      fetchRecentBlocks();
      fetchRounds();
    }, 30000);
    return () => clearInterval(interval);
  }, [address]);

  // Balance fetching now handled by useBlockYield hook

  // Execute Deposit to Vault
  async function execDeposit() {
    const microStx = Math.floor(parseFloat(depositAmount) * 1e6);
    setSimState("pending_signature");
    try {
      await openContractCall({
        network: STACKS_MAINNET,
        contractAddress: DEPLOYER_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: FUNCTION_NAMES.DEPOSIT_STX,
        functionArgs: [
          uintCV(microStx),
          contractPrincipalCV(MOCK_STRATEGY_PRINCIPAL.address, MOCK_STRATEGY_PRINCIPAL.name),
        ],
        postConditions: [
          Pc.principal(address as string).willSendEq(microStx).ustx()
        ],
        postConditionMode: PostConditionMode.Deny,
        anchorMode: 3,
        onFinish: (data) => {
          setSimState("submitted");
          setStatusMsg(`Deposit broadcasted! TxID: ${data.txId.substring(0, 16)}...`);
          setTimeout(() => {
            setSimState("confirming");
            setTimeout(() => {
              setSimState("success");
              setVaultPrincipal(prev => (parseFloat(prev) + parseFloat(depositAmount)).toFixed(4));
              setStxBalance(prev => (parseFloat(prev) - parseFloat(depositAmount)).toFixed(4));
              setDepositAmount("");
              setTimeout(() => setSimState("idle"), 2000);
            }, 3000);
          }, 1000);
        },
        onCancel: () => { setSimState("rejected"); setStatusMsg("Transaction canceled."); setTimeout(() => setSimState("idle"), 2000); }
      });
    } catch (error: any) {
      setSimState("error");
      setStatusMsg(`Deposit error: ${error.message}`);
      setTimeout(() => setSimState("idle"), 2000);
    }
  }

  function handleDeposit() {
    if (!isConnected) { connect(); return; }
    if (!depositAmount || isNaN(parseFloat(depositAmount))) { setStatusMsg("Enter a valid deposit amount."); return; }
    if (exceedsDeposit) { setStatusMsg("Insufficient wallet balance."); return; }
    openSim("deposit", depositAmount, execDeposit);
  }

  // Execute Withdraw Principal
  async function execWithdraw() {
    const microStx = Math.floor(parseFloat(withdrawAmount) * 1e6);
    setSimState("pending_signature");
    try {
      await openContractCall({
        network: STACKS_MAINNET,
        contractAddress: DEPLOYER_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: FUNCTION_NAMES.WITHDRAW_STX,
        functionArgs: [
          uintCV(microStx),
          contractPrincipalCV(MOCK_STRATEGY_PRINCIPAL.address, MOCK_STRATEGY_PRINCIPAL.name),
        ],
        postConditionMode: PostConditionMode.Deny,
        anchorMode: 3,
        onFinish: (data) => {
          setSimState("submitted");
          setStatusMsg(`Withdrawal broadcasted! TxID: ${data.txId.substring(0, 16)}...`);
          setTimeout(() => {
            setSimState("confirming");
            setTimeout(() => {
              setSimState("success");
              setVaultPrincipal(prev => (parseFloat(prev) - parseFloat(withdrawAmount)).toFixed(4));
              setStxBalance(prev => (parseFloat(prev) + parseFloat(withdrawAmount)).toFixed(4));
              setWithdrawAmount("");
              setTimeout(() => setSimState("idle"), 2000);
            }, 3000);
          }, 1000);
        },
        onCancel: () => { setSimState("rejected"); setStatusMsg("Transaction canceled."); setTimeout(() => setSimState("idle"), 2000); }
      });
    } catch (error: any) {
      setSimState("error");
      setStatusMsg(`Withdrawal error: ${error.message}`);
      setTimeout(() => setSimState("idle"), 2000);
    }
  }

  function handleWithdraw() {
    if (!isConnected) { connect(); return; }
    if (!withdrawAmount || isNaN(parseFloat(withdrawAmount))) { setStatusMsg("Enter a valid withdrawal amount."); return; }
    if (exceedsWithdraw) { setStatusMsg("Withdrawal exceeds vault principal."); return; }
    openSim("withdraw", withdrawAmount, execWithdraw);
  }

  // Execute Yield Credits Redemption
  async function execRedeemYield() {
    const microStx = Math.floor(parseFloat(redeemAmount) * 1e6);
    setSimState("pending_signature");
    try {
      await openContractCall({
        network: STACKS_MAINNET,
        contractAddress: DEPLOYER_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: FUNCTION_NAMES.REDEEM_YIELD_CREDITS,
        functionArgs: [uintCV(microStx)],
        postConditionMode: PostConditionMode.Deny,
        anchorMode: 3,
        onFinish: (data) => {
          setSimState("submitted");
          setStatusMsg(`Yield redeemed! TxID: ${data.txId.substring(0, 16)}...`);
          setTimeout(() => {
            setSimState("confirming");
            setTimeout(() => {
              setSimState("success");
              setYieldCredits(prev => (parseFloat(prev) - parseFloat(redeemAmount)).toFixed(8));
              setStxBalance(prev => (parseFloat(prev) + parseFloat(redeemAmount)).toFixed(4));
              setRedeemAmount("");
              setTimeout(() => setSimState("idle"), 2000);
            }, 3000);
          }, 1000);
        },
        onCancel: () => { setSimState("rejected"); setStatusMsg("Transaction canceled."); setTimeout(() => setSimState("idle"), 2000); }
      });
    } catch (error: any) {
      setSimState("error");
      setStatusMsg(`Redemption error: ${error.message}`);
      setTimeout(() => setSimState("idle"), 2000);
    }
  }

  function handleRedeemYield() {
    if (!isConnected) { connect(); return; }
    if (!redeemAmount || isNaN(parseFloat(redeemAmount))) { setStatusMsg("Enter a valid yield amount."); return; }
    if (exceedsRedeem) { setStatusMsg("Redemption exceeds accumulated yield credits."); return; }
    openSim("redeem", redeemAmount, execRedeemYield);
  }

  // Execute Place Yield Bet
  async function execPlaceStake() {
    if (predictionVal === null) return;
    const microStx = Math.floor(parseFloat(stakeAmount) * 1e6);
    setSimState("pending_signature");
    try {
      await openContractCall({
        network: STACKS_MAINNET,
        contractAddress: DEPLOYER_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: FUNCTION_NAMES.PLACE_YIELD_BET,
        functionArgs: [uintCV(selectedRound), uintCV(microStx), uintCV(predictionVal)],
        postConditionMode: PostConditionMode.Deny,
        anchorMode: 3,
        onFinish: (data) => {
          setSimState("submitted");
          setStatusMsg(`Wager broadcasted! TxID: ${data.txId.substring(0, 16)}...`);
          setTimeout(() => {
            setSimState("confirming");
            setTimeout(() => {
              setSimState("success");
              setYieldCredits(prev => (parseFloat(prev) - parseFloat(stakeAmount)).toFixed(8));
              const updated = [...rounds];
              const round = updated.find(r => r.id === selectedRound);
              if (round) { round.myStake = { amount: stakeAmount, prediction: predictionVal }; }
              setRounds(updated);
              setStakeAmount("");
              setPredictionVal(null);
              setTimeout(() => setSimState("idle"), 2000);
            }, 3000);
          }, 1000);
        },
        onCancel: () => { setSimState("rejected"); setStatusMsg("Wager canceled."); setTimeout(() => setSimState("idle"), 2000); }
      });
    } catch (error: any) {
      setSimState("error");
      setStatusMsg(`Bet error: ${error.message}`);
      setTimeout(() => setSimState("idle"), 2000);
    }
  }

  function handlePlaceStake() {
    if (!isConnected) { connect(); return; }
    if (predictionVal === null) { setStatusMsg("Select a prediction option."); return; }
    if (!stakeAmount || isNaN(parseFloat(stakeAmount))) { setStatusMsg("Enter a valid wager amount."); return; }
    if (exceedsBet) { setStatusMsg("Wager exceeds available Yield Credits."); return; }
    openSim("bet", stakeAmount, execPlaceStake);
  }

  // Execute Claim Won Yield
  async function handleClaimPayout(roundId: number) {
    if (!isConnected) {
      connect();
      return;
    }
    setSimState("pending_signature");
    setStatusMsg(`Claiming rewards for round #${roundId}...`);
    try {
      await openContractCall({
        network: STACKS_MAINNET,
        contractAddress: DEPLOYER_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: FUNCTION_NAMES.CLAIM_REWARD,
        functionArgs: [uintCV(roundId)],
        postConditionMode: PostConditionMode.Deny,
        anchorMode: 3,
        onFinish: (data) => {
          setSimState("submitted");
          setStatusMsg(`Jackpot claimed successfully! TxID: ${data.txId.substring(0, 16)}...`);
          setTimeout(() => {
            setSimState("confirming");
            setTimeout(() => {
              setSimState("success");
              const updated = [...rounds];
              const round = updated.find(r => r.id === roundId);
              if (round) {
                round.hasClaimed = true;
              }
              setRounds(updated);
              if (address) fetchBalance();
              setTimeout(() => setSimState("idle"), 2000);
            }, 3000);
          }, 1000);
        },
        onCancel: () => {
          setSimState("rejected");
          setStatusMsg("Claim canceled.");
          setTimeout(() => setSimState("idle"), 2000);
        }
      });
    } catch (err: any) {
      setSimState("error");
      setStatusMsg(`Claim error: ${err.message}`);
      setTimeout(() => setSimState("idle"), 2000);
    }
  }

  return (
    <>
    <div className="min-h-screen bg-black text-zinc-150 font-sans selection:bg-orange-500 selection:text-black pb-16">
      
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-orange-650/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-zinc-800/10 rounded-full filter blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 pt-4 sm:pt-8">
        
        {/* Navigation & Wallet Dashboard */}
        <header className="flex flex-col lg:flex-row justify-between items-center bg-zinc-900/40 border border-zinc-800/60 rounded-3xl sm:rounded-[32px] p-4 sm:p-6 backdrop-blur-2xl gap-4 shadow-xl">
          <div className="flex items-center gap-4">

            <div>
              <h1 className="text-2xl font-extrabold tracking-tight uppercase bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                BLOCK<span className="text-orange-500">YIELD</span>
              </h1>
              <p className="text-[10px] text-orange-500/80 font-black uppercase tracking-widest">Lossless Yield Tournament Engine</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 w-full lg:w-auto">
            {isConnected ? (
              <>
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-3 sm:gap-4 bg-zinc-950/60 border border-zinc-800/80 px-3 py-2.5 sm:px-4 sm:py-2 rounded-2xl w-full sm:w-auto">
                  <div className="text-center sm:text-right flex-1 sm:flex-initial min-w-[70px] sm:min-w-0">
                    <p className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">WALLET</p>
                    <p className="text-xs font-extrabold text-white truncate">{stxBalance} STX</p>
                  </div>
                  <div className="hidden sm:block w-[1px] h-6 bg-zinc-800" />
                  <div className="text-center sm:text-right flex-1 sm:flex-initial min-w-[90px] sm:min-w-0">
                    <p className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">VAULT principal</p>
                    <p className="text-xs font-extrabold text-orange-500 truncate">{vaultPrincipal} STX</p>
                  </div>
                  <div className="hidden sm:block w-[1px] h-6 bg-zinc-800" />
                  <div className="text-center sm:text-right flex-1 sm:flex-initial min-w-[90px] sm:min-w-0">
                    <p className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">YIELD credits</p>
                    <p className="text-xs font-extrabold text-green-400 animate-pulse truncate">{yieldCredits}</p>
                  </div>
                </div>
                <div className="text-xs font-bold text-zinc-300 bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-2xl text-center w-full sm:w-auto">
                  {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
                </div>
              </>
            ) : (
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={connect}
                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black uppercase tracking-widest text-xs px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2"
              >
                <Wallet className="w-4 h-4" /> Connect Stacks Wallet
              </motion.button>
            )}
          </div>
        </header>

        {/* Status Message Prompt */}
        <AnimatePresence>
          {statusMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-zinc-900/90 border border-orange-500/30 p-4 rounded-2xl text-xs text-orange-400 font-semibold tracking-wide flex items-center justify-between shadow-lg shadow-orange-500/5"
            >
              <div className="flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                <span>{statusMsg}</span>
              </div>
              <button onClick={() => setStatusMsg("")} className="text-zinc-500 hover:text-white font-extrabold px-2">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* LEFT & CENTER: Vault HUD & Analytics Ledger */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            
            {/* STAKING VAULT HUB */}
            <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 backdrop-blur-2xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full filter blur-2xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-white tracking-wide">Lossless Staking Vault</h2>
                    <p className="text-[10px] text-zinc-500">Deposit principal to generate risk-free betting yield</p>
                  </div>
                </div>
                <div className="self-start sm:self-auto px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-wider">
                  0.5% APY compounding
                </div>
              </div>

              {/* Three Action columns: Deposit, Withdraw, Redeem Yield */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-2">
                
                {/* Deposit Column */}
                <div className="bg-zinc-950/60 border border-zinc-850 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-2">
                      <Plus className="w-4 h-4 text-green-400" /> Deposit Principal
                    </h3>
                    <p className="text-[10px] text-zinc-500 leading-relaxed mt-1">Stash STX securely to compound risk-free yield.</p>
                  </div>
                  <div>
                    <div className="relative">
                      <input 
                        type="number"
                        placeholder="Amount STX"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className={`w-full bg-zinc-900 border ${exceedsDeposit ? "border-red-500/50" : "border-zinc-800"} rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500 transition-all placeholder-zinc-600 pr-14`}
                      />
                      <button
                        type="button"
                        onClick={() => setDepositAmount(maxDepositSTX)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-orange-500 hover:text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-md"
                      >MAX</button>
                    </div>
                    {depositAmount && !isNaN(parseFloat(depositAmount)) && (
                      <div className="flex justify-end text-[9px] text-zinc-500 font-mono mt-1 pr-1">
                        Raw: {Math.floor(parseFloat(depositAmount) * 1e6).toLocaleString()} micro-STX
                      </div>
                    )}
                    {exceedsDeposit && <p className="text-[9px] text-red-500 font-bold mt-1 flex items-center gap-1 animate-pulse"><AlertTriangle className="w-3 h-3" /> Insufficient balance</p>}
                    <button 
                      onClick={handleDeposit}
                      disabled={exceedsDeposit}
                      className="w-full mt-3 bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black uppercase tracking-widest text-[9px] py-2.5 rounded-xl transition-all shadow-md disabled:opacity-40"
                    >
                      Deposit STX
                    </button>
                  </div>
                </div>

                {/* Withdraw Principal Column */}
                <div className="bg-zinc-950/60 border border-zinc-850 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-2">
                      <Minus className="w-4 h-4 text-orange-400" /> Pull Principal
                    </h3>
                    <p className="text-[10px] text-zinc-500 leading-relaxed mt-1">Withdraw principal instantly. Always 100% safe.</p>
                  </div>
                  <div>
                    <div className="relative">
                      <input 
                        type="number"
                        placeholder="Amount STX"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className={`w-full bg-zinc-900 border ${exceedsWithdraw ? "border-red-500/50" : "border-zinc-800"} rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500 transition-all placeholder-zinc-600 pr-14`}
                      />
                      <button
                        type="button"
                        onClick={() => setWithdrawAmount(vaultPrincipal)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-orange-500 hover:text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-md"
                      >MAX</button>
                    </div>
                    {withdrawAmount && !isNaN(parseFloat(withdrawAmount)) && (
                      <div className="flex justify-end text-[9px] text-zinc-500 font-mono mt-1 pr-1">
                        Raw: {Math.floor(parseFloat(withdrawAmount) * 1e6).toLocaleString()} micro-STX
                      </div>
                    )}
                    {exceedsWithdraw && <p className="text-[9px] text-red-500 font-bold mt-1 flex items-center gap-1 animate-pulse"><AlertTriangle className="w-3 h-3" /> Exceeds vault principal</p>}
                    <button 
                      onClick={handleWithdraw}
                      disabled={exceedsWithdraw}
                      className="w-full mt-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 font-black uppercase tracking-widest text-[9px] py-2.5 rounded-xl transition-all shadow-md disabled:opacity-40"
                    >
                      Withdraw STX
                    </button>
                  </div>
                </div>

                {/* Redeem Yield Column */}
                <div className="bg-zinc-950/60 border border-zinc-850 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-2">
                      <ArrowDownRight className="w-4 h-4 text-green-400 animate-bounce" /> Redeem Yield
                    </h3>
                    <p className="text-[10px] text-zinc-500 leading-relaxed mt-1">Convert earned yield/winnings to liquid STX.</p>
                  </div>
                  <div>
                    <div className="relative">
                      <input 
                        type="number"
                        placeholder="Credits to STX"
                        value={redeemAmount}
                        onChange={(e) => setRedeemAmount(e.target.value)}
                        className={`w-full bg-zinc-900 border ${exceedsRedeem ? "border-red-500/50" : "border-zinc-800"} rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500 transition-all placeholder-zinc-600 pr-14`}
                      />
                      <button
                        type="button"
                        onClick={() => setRedeemAmount(maxRedeemCredits)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-green-400 hover:text-green-300 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-md"
                      >MAX</button>
                    </div>
                    {redeemAmount && !isNaN(parseFloat(redeemAmount)) && (
                      <div className="flex justify-end text-[9px] text-zinc-500 font-mono mt-1 pr-1">
                        Raw: {Math.floor(parseFloat(redeemAmount) * 1e6).toLocaleString()} micro-STX
                      </div>
                    )}
                    {exceedsRedeem && <p className="text-[9px] text-red-500 font-bold mt-1 flex items-center gap-1 animate-pulse"><AlertTriangle className="w-3 h-3" /> Exceeds available credits</p>}
                    <button 
                      onClick={handleRedeemYield}
                      disabled={exceedsRedeem}
                      className="w-full mt-3 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 font-black uppercase tracking-widest text-[9px] py-2.5 rounded-xl transition-all shadow-md disabled:opacity-40"
                    >
                      Redeem as STX
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Recent Blocks Analytics Feed */}
            <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 backdrop-blur-2xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-24 h-24 bg-orange-500/5 rounded-full filter blur-2xl pointer-events-none" />
              
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-white tracking-wide">Recent Blocks Analytics</h2>
                    <p className="text-[10px] text-zinc-500">Real-time Stacks L2 blockchain timestamp parity metrics</p>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchRecentBlocks} 
                  className={`p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:bg-zinc-800 transition-all ${isLoadingBlocks ? "animate-spin" : ""}`}
                >
                  <RefreshCw className="w-4 h-4 text-zinc-400" />
                </motion.button>
              </div>
              
              {/* Responsive Visual Block Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                {isLoadingBlocks || blocks.length === 0 ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <div 
                      key={idx} 
                      className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 flex flex-col justify-between h-[108px] relative overflow-hidden"
                    >
                      <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                        <div className="h-3.5 w-16 bg-zinc-800/80 rounded animate-pulse" />
                        <div className="h-3 w-6 bg-zinc-800/50 rounded animate-pulse" />
                      </div>
                      <div className="space-y-2 mt-2">
                        <div className="h-3 w-full bg-zinc-800/60 rounded animate-pulse" />
                        <div className="h-3 w-2/3 bg-zinc-800/40 rounded animate-pulse" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                    </div>
                  ))
                ) : (
                  blocks.map((block, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      key={idx} 
                      className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-orange-500/20 transition-all shadow-md group relative gap-3"
                    >
                      <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                        <div>
                          <span className="text-[8px] font-black text-zinc-500 tracking-wider">BLOCK</span>
                          <p className="text-xs font-black text-orange-500">#{block.height}</p>
                        </div>
                        <span className="text-[9px] font-extrabold text-zinc-650">L2</span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                        <div>
                          <p className="text-[8px] text-zinc-500 font-medium">Tx Count</p>
                          <p className="text-[10px] font-bold text-zinc-200 leading-tight">{block.tx_count} Txs</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-zinc-500 font-medium">Parity</p>
                          <p className="text-[10px] font-bold text-orange-400 leading-tight">
                            {block.height % 2 === 0 ? "Even" : "Odd"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] text-zinc-500 font-medium">Fees (STX)</p>
                          <p className="text-[10px] font-bold text-zinc-200 leading-tight">{block.fees.toFixed(3)}</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-zinc-500 font-medium">Time</p>
                          <p className="text-[10px] font-bold text-zinc-350 leading-tight">{block.timestamp}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* My Prediction Ledger */}
            <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 backdrop-blur-2xl shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <History className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white tracking-wide">My Prediction Ledger</h2>
                  <p className="text-[10px] text-zinc-500">View and claim won predictive pooled yield credits</p>
                </div>
              </div>

              <div className="space-y-4">
                {rounds.filter(r => r.myStake).length === 0 ? (
                  <div className="text-center py-10 bg-zinc-950/40 border border-dashed border-zinc-850 rounded-2xl p-6 flex flex-col items-center justify-center">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">No prediction wagers found</p>
                    <p className="text-[10px] text-zinc-650 mt-1 max-w-xs mx-auto">
                      Deploy your compounding yield credits into active prediction pools to start earning risk-free yield jackpots!
                    </p>
                  </div>
                ) : (
                  rounds.filter(r => r.myStake).map((round, idx) => {
                    const isWon = round.status === "resolved" && round.myStake?.prediction === round.outcome;
                    
                    return (
                      <motion.div 
                        layout
                        key={idx} 
                        className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-950/60 border border-zinc-800/60 rounded-2xl p-5 gap-4 hover:border-zinc-800 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-zinc-350">Round #{round.id}</span>
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-orange-400 tracking-wider">
                              {round.outcomeType}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-zinc-400 mt-1">
                            Staked on target block <span className="text-white">#{round.targetBlock}</span>
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                            <span>Staked yield: <span className="text-green-400 font-extrabold">{round.myStake?.amount} Credits</span></span>
                            <span className="text-zinc-700">•</span>
                            <span>Predicted outcome Option: <span className="text-zinc-300 font-extrabold">#{round.myStake?.prediction}</span></span>
                          </div>
                        </div>

                        <div className="w-full md:w-auto flex justify-end">
                          {round.status === "open" ? (
                            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 bg-zinc-900/60 border border-zinc-850 px-4 py-2.5 rounded-xl">
                              <Clock className="w-3.5 h-3.5" /> Pending Block
                            </div>
                          ) : isWon ? (
                            round.hasClaimed ? (
                              <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-green-500 bg-green-500/10 border border-green-500/20 px-4 py-2.5 rounded-xl">
                                <CheckCircle className="w-3.5 h-3.5" /> Won & Claimed
                              </div>
                            ) : (
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleClaimPayout(round.id)}
                                className="text-[10px] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all shadow-md shadow-green-500/20 flex items-center gap-2"
                              >
                                🏆 Claim Yield Jackpot
                              </motion.button>
                            )
                          ) : (
                            <div className="text-[10px] font-extrabold uppercase tracking-widest text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">
                              Lossless Forfeit (0 STX lost!)
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Live Staking Panel */}
          <div className="space-y-6 sm:space-y-8">
            
            {/* Quick Rules - Moved Above Terminal */}
            <div className="bg-zinc-900/10 border border-zinc-800/80 rounded-2xl sm:rounded-3xl backdrop-blur-2xl overflow-hidden transition-all duration-300">
              <button 
                onClick={() => setIsHowItWorksOpen(!isHowItWorksOpen)}
                className="w-full flex items-center justify-between p-4 sm:p-6 cursor-pointer hover:bg-zinc-800/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-orange-500/60" />
                  <h3 className="text-xs font-extrabold uppercase text-zinc-400 tracking-wider">How It Works: YieldBet Protocol</h3>
                </div>
                {isHowItWorksOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
              </button>
              
              <AnimatePresence>
                {isHowItWorksOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ul className="px-4 pb-4 sm:px-6 sm:pb-6 pt-2 space-y-4 text-[11px] text-zinc-500 leading-relaxed font-medium">
                      <li className="flex gap-3">
                        <span className="text-orange-500 font-extrabold text-sm shrink-0">1.</span>
                        <span><strong className="text-zinc-300">Stake STX/sBTC</strong> into the lossless vault adapter contract. Your principal is always safe and completely withdrawable at any time.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-orange-500 font-extrabold text-sm shrink-0">2.</span>
                        <span><strong className="text-zinc-300">Compounding Yield</strong> generates "Yield Credits" automatically for you, minted directly block-by-block based on Stacks PoX returns.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-orange-500 font-extrabold text-sm shrink-0">3.</span>
                        <span><strong className="text-zinc-300">Deploy credits</strong> to predict future outcomes like target block timestamps or parity. If you lose, you only forfeit credits, <i>not</i> your principal.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-orange-500 font-extrabold text-sm shrink-0">4.</span>
                        <span><strong className="text-zinc-300">Claim winning pools</strong> directly to massively boost your effective Stacking APY!</span>
                      </li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
 
            <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 border border-orange-500/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/5 rounded-full filter blur-xl pointer-events-none" />
 
              <div className="flex items-center gap-3 mb-6 border-b border-zinc-800/80 pb-4">
                <Cpu className="w-5 h-5 text-orange-500" />
                <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Prediction Terminal</h2>
              </div>

              <div className="space-y-6">
                
                {/* Round Selector */}
                <div>
                  <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block mb-2.5">Select Target Round</label>
                  <div className="grid grid-cols-2 gap-2">
                    {rounds.filter(r => r.status === "open").map((r, i) => (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        key={i}
                        onClick={() => {
                          setSelectedRound(r.id);
                          setPredictionVal(null);
                        }}
                        className={`p-3.5 rounded-2xl border text-xs font-extrabold tracking-wide transition-all ${selectedRound === r.id ? "bg-orange-500/10 border-orange-500 text-orange-400 shadow-md shadow-orange-500/5" : "bg-zinc-950/60 border-zinc-800/60 hover:border-zinc-700 text-zinc-400"}`}
                      >
                        Block #{r.id}
                        <span className="block text-[8px] text-zinc-500 mt-0.5 uppercase font-medium">{r.outcomeType}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Prediction Options */}
                <div>
                  <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block mb-2.5">Choose Parity Prediction</label>
                  <div className="space-y-2.5">
                    {rounds.find(r => r.id === selectedRound)?.options.map((opt, i) => (
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        key={i}
                        onClick={() => setPredictionVal(opt.value)}
                        className={`w-full p-4 rounded-2xl border text-xs font-semibold text-left transition-all flex items-center justify-between ${predictionVal === opt.value ? "bg-orange-500/10 border-orange-500 text-orange-400 shadow-md" : "bg-zinc-950/60 border-zinc-800/60 hover:border-zinc-700 text-zinc-300"}`}
                      >
                        <span>{opt.label}</span>
                        {predictionVal === opt.value && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shadow-lg shadow-orange-500" />}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Stake Input */}
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Wager Credits (Yield Ammo)</label>
                    {isConnected && (
                      <button 
                        onClick={() => setStakeAmount(Math.max(0, parseFloat(yieldCredits) - 0.01).toFixed(4))}
                        className="text-[9px] font-black uppercase text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-lg hover:bg-green-500/20 transition-all"
                      >
                        MAX AMMO
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      placeholder="Credits amount"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    />
                    {stakeAmount && !isNaN(parseFloat(stakeAmount)) && (
                      <div className="flex justify-end text-[9px] text-zinc-500 font-mono mt-1 pr-1">
                        Raw: {Math.floor(parseFloat(stakeAmount) * 1e6).toLocaleString()} micro-STX
                      </div>
                    )}
                    <div className="mt-2.5 text-[10px] text-zinc-550 text-right font-bold tracking-wide">
                      {stakeAmount && !isNaN(parseFloat(stakeAmount))
                        ? `wager: ${parseFloat(stakeAmount).toLocaleString()} credits (principal completely safe)`
                        : "0 credits"}
                    </div>
                  </div>
                </div>

                {/* Place stake button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePlaceStake}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black uppercase tracking-widest py-4 px-6 rounded-2xl transition-all shadow-lg shadow-orange-500/15 flex items-center justify-center gap-3 text-xs"
                >
                  Deploy Lossless Wager <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Transaction Simulation Modal */}
    <AnimatePresence>
      {simState !== "idle" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-zinc-900 border border-orange-500/20 rounded-3xl p-8 shadow-2xl"
          >
            <div className="flex flex-col items-center text-center">
              {simState === "simulating" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6">
                    <Activity className="w-8 h-8 text-orange-500 animate-pulse" />
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-widest mb-2 text-white">Simulating Transaction</h2>
                  <p className="text-sm text-zinc-400 mb-6">
                    You are about to <span className="text-orange-400 font-bold capitalize">{simAction}</span>{" "}
                    <span className="text-white font-bold">{simAmount} {simAction === "redeem" ? "Credits" : "STX"}</span>
                  </p>
                  <div className="w-full bg-zinc-950 rounded-xl p-4 mb-8 text-left space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500 uppercase font-bold tracking-wider">Action</span>
                      <span className="text-white capitalize">{simAction}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500 uppercase font-bold tracking-wider">Amount</span>
                      <span className="text-white">{simAmount} {simAction === "redeem" ? "Credits" : "STX"}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500 uppercase font-bold tracking-wider">Est. Fee</span>
                      <span className="text-white">~0.002 STX</span>
                    </div>
                  </div>
                  <div className="flex gap-4 w-full">
                    <button
                      onClick={() => setSimState("idle")}
                      className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-black uppercase tracking-widest transition-colors"
                    >Cancel</button>
                    <button
                      onClick={async () => { if (pendingAction) await pendingAction(); }}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20"
                    >Sign & Confirm</button>
                  </div>
                </>
              )}
              {simState === "pending_signature" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-widest mb-2 text-white">Pending Signature</h2>
                  <p className="text-sm text-zinc-400">Please sign the transaction in your wallet...</p>
                </>
              )}
              {simState === "submitted" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-widest mb-2 text-white">Broadcasting</h2>
                  <p className="text-sm text-zinc-400">Transaction submitted. Waiting for network...</p>
                </>
              )}
              {simState === "confirming" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-widest mb-2 text-blue-400">Confirming</h2>
                  <p className="text-sm text-zinc-400">Waiting for block confirmation...</p>
                </>
              )}
              {simState === "success" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-widest mb-2 text-green-400">Confirmed!</h2>
                  <p className="text-sm text-zinc-400">Your transaction was confirmed on the network.</p>
                </>
              )}
              {simState === "error" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-widest mb-2 text-red-500">Error</h2>
                  <p className="text-sm text-zinc-400">There was an error processing the transaction.</p>
                </>
              )}
              {simState === "rejected" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-widest mb-2 text-red-500">Rejected</h2>
                  <p className="text-sm text-zinc-400">You rejected the transaction.</p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </>
  );
}
