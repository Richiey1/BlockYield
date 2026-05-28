"use client";

import { toast, Toaster as HotToaster } from "react-hot-toast";
import { CheckCircle2, AlertCircle, Info, Trophy } from "lucide-react";

export const gameToast = {
  success: (message: string) =>
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-zinc-900 border border-green-500/50 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-bold text-white uppercase tracking-wider">Success</p>
              <p className="mt-1 text-sm text-zinc-400">{message}</p>
            </div>
          </div>
        </div>
      </div>
    )),
  error: (message: string) =>
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-zinc-900 border border-red-500/50 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-bold text-white uppercase tracking-wider">Failed</p>
              <p className="mt-1 text-sm text-zinc-400">{message}</p>
            </div>
          </div>
        </div>
      </div>
    )),
  win: (amount: string) =>
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-zinc-900 border border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)] rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <Trophy className="h-8 w-8 text-orange-500 animate-bounce" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-lg font-black text-white italic tracking-tighter uppercase">Big Win!</p>
              <p className="mt-1 text-sm text-zinc-300">You just collected <span className="text-orange-400 font-bold">{amount} STX</span></p>
            </div>
          </div>
        </div>
      </div>
    ), { duration: 5000 }),
};

export const GameToaster = () => (
  <HotToaster
    position="bottom-right"
    toastOptions={{
      duration: 3000,
    }}
  />
);
