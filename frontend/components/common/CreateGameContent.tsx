"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStacks } from "@/contexts/StacksProvider";
import { useStacksTacToe } from "@/hooks/useStacksTacToe";
import { Loader2, Coins, AlertCircle, Wallet } from "lucide-react";
import { toast } from "react-hot-toast";
import { STACKS_API_URL } from "@/lib/stacksConfig";
import { formatStx } from "@/lib/gameUtils";

export function CreateGameContent() {
  const [betAmount, setBetAmount] = useState("");
  const [selectedMove, setSelectedMove] = useState<number | null>(null);
  const [boardSize, setBoardSize] = useState<3 | 5>(3);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const { isConnected, address } = useStacks();
  const { createGame } = useStacksTacToe();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
      return;
    }
  }, [isConnected, router]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) return;
      setLoadingBalance(true);
      try {
        const response = await fetch(`${STACKS_API_URL}/extended/v1/address/${address}/balances`);
        const data = await response.json();
        const stxBalance = parseInt(data.stx.balance) / 1_000_000;
        setBalance(stxBalance);
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      } finally {
        setLoadingBalance(false);
      }
    };
    fetchBalance();
  }, [address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!betAmount || parseFloat(betAmount) <= 0) {
      setError("Enter valid bet amount");
      return;
    }
    if (selectedMove === null) {
      setError("Select first move");
      return;
    }

    try {
      setIsCreating(true);
      await createGame(parseFloat(betAmount), selectedMove, boardSize);
      toast.success("Game created!");
      setBetAmount("");
      setSelectedMove(null);
      setBoardSize(3);
    } catch (err: any) {
      const errorMessage = err?.message || "Failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-8">
      <div className="max-w-xl w-full">
        <div className="p-4 sm:p-6">
          <div className="text-center mb-12 font-pixel text-shadow">
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 uppercase tracking-widest">Create Battle</h1>
            <p className="text-gray-300 text-sm sm:text-base uppercase tracking-tight">Set stakes and strike first</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-12">
            <div>
              <label className="block text-sm sm:text-base font-pixel text-gray-300 mb-5 uppercase tracking-wider">
                Grid Size
              </label>
              <div className="grid grid-cols-2 gap-4">
                {([
                  { size: 3, label: "3x3 (Classic)" },
                  { size: 5, label: "5x5 (Advance)" }
                ] as const).map(({ size, label }) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => { setBoardSize(size); setSelectedMove(null); }}
                    className={`
                      px-4 py-5 border-4 transition-all font-pixel uppercase text-xs
                      ${boardSize === size
                        ? "border-orange-500 bg-orange-500/10 text-white shadow-[2px_2px_0px_0px_#fff]"
                        : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                      }
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-5">
                <label htmlFor="betAmount" className="block text-sm sm:text-base font-pixel text-gray-300 uppercase tracking-wider">
                  Stakes (STX)
                </label>
                {balance !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      const maxStx = Math.max(0, balance - 0.05);
                      setBetAmount(maxStx.toFixed(6));
                    }}
                    className="px-3 py-1 bg-orange-500/10 hover:bg-orange-500/20 border-2 border-orange-500/30 text-orange-400 font-pixel text-[10px] uppercase transition-all"
                  >
                    MAX (Gas Reserved)
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="betAmount"
                  type="number"
                  step="0.000001"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="0.00"
                  className="block w-full px-5 py-5 bg-black border-4 border-white/20 text-white font-pixel text-base focus:outline-none focus:border-orange-500 transition-all placeholder:text-gray-800"
                  required
                />
              </div>
              
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 font-pixel text-xs text-gray-300 uppercase tracking-tight">
                <div className="flex items-center gap-3">
                  <Wallet className="w-4 h-4 text-orange-500" />
                  {loadingBalance ? "..." : balance !== null ? `Balance: ${formatStx(balance * 1_000_000)} STX` : "?"}
                </div>
                <div className="text-orange-500/70 font-semibold">
                  {betAmount && !isNaN(parseFloat(betAmount))
                    ? `≈ ${Math.floor(parseFloat(betAmount) * 1_000_000).toLocaleString()} micro-STX`
                    : "0 micro-STX"}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm sm:text-base font-pixel text-gray-300 mb-5 uppercase tracking-wider">
                Strike First
              </label>
              <div className={`grid gap-3 p-6 border-4 border-white/5 bg-white/5 ${boardSize === 3 ? 'grid-cols-3' : 'grid-cols-5'}`}>
                {Array.from({ length: boardSize * boardSize }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedMove(index)}
                    className={`
                      aspect-square flex items-center justify-center border-2 transition-all
                      ${selectedMove === index
                        ? "bg-orange-500 border-white"
                        : "bg-black border-white/10 hover:border-white/40"
                      }
                    `}
                  >
                    <span className={`text-xl font-black ${selectedMove === index ? "text-white" : "text-blue-500/20"}`}>X</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 border-4 border-red-500 bg-red-500/10 text-red-500 font-pixel text-[10px] uppercase">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isCreating}
              className="btn-retro w-full py-6 !text-base"
            >
              {isCreating ? "Deploying..." : "DEPLOY BATTLE"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
