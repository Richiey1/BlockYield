"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import UniversalProvider from "@walletconnect/universal-provider";
import { createAppKit, useAppKit } from "@reown/appkit/react";
// @ts-ignore
import { mainnet } from "@reown/appkit/networks";
import { type AppKit } from "@reown/appkit";

// 1. Get projectId from https://cloud.reown.com
const projectId =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ||
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  "YOUR_PROJECT_ID_Fallback";

// 2. Create a metadata object
const metadata = {
  name: "StacksTacToe",
  description: "Decentralized Tic-Tac-Toe on Stacks",
  url: "https://block-bets.vercel.app", // origin must match your domain & subdomain
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// 3. Define Stacks Network (Custom)
// Note: This is an experimental configuration for Stacks
const stacksNetwork = {
  id: "stacks:1", // CAIP-2 for Stacks Mainnet (Example)
  name: "Stacks",
  network: "stacks",
  nativeCurrency: {
    decimals: 6,
    name: "Stacks",
    symbol: "STX",
  },
  rpcUrls: {
    default: { http: ["https://api.mainnet.hiro.so"] },
    public: { http: ["https://api.mainnet.hiro.so"] },
  },
  blockExplorers: {
    default: { name: "Stacks Explorer", url: "https://explorer.hiro.so" },
  },
};

// 4. Create the AppKit instance
// We use a universal adapter if available, or just standard init
const modal = createAppKit({
  adapters: [],
  networks: [mainnet],
  projectId,
  metadata,
  features: {
    analytics: true,
  },
});

interface ReownContextType {
  open: () => void;
  isConnected: boolean;
  address: string | null;
}

const ReownContext = createContext<ReownContextType>({
  open: () => {},
  isConnected: false,
  address: null,
});

export function ReownProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<UniversalProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const { open: appKitOpen } = useAppKit();

  // Initialize Universal Provider
  useEffect(() => {
    async function initProvider() {
      try {
        const up = await UniversalProvider.init({
          projectId,
          metadata,
        });
        setProvider(up);

        // Check if already connected
        if (up.session) {
          handleSession(up.session);
        }
      } catch (error) {
        console.warn("Reown Universal Provider init error:", error);
      }
    }
    initProvider();
  }, []);

  // Hook into modal state events
  useEffect(() => {
    // @ts-ignore - subscribeState types might be tricky with raw JS usage
    const unsubscribe = modal.subscribeState((state: any) => {
      if (state.selectedNetworkId) {
        // Check provider session again
        if (provider?.session) {
          handleSession(provider.session);
        }
      }
    });
    return () => unsubscribe();
  }, [provider]);

  const handleSession = (session: any) => {
    setIsConnected(true);
    // Attempt to find Stacks address from namespaces
    // Usually Stacks is not in the default EVM namespaces, so we might need custom logic
    // For now, we will verify connection and later add Stacks address parsing

    // Example: parsing session.namespaces if available
    // const stxNamespace = session.namespaces['stacks'];
    // if (stxNamespace && stxNamespace.accounts.length > 0) {
    //    const fullAccount = stxNamespace.accounts[0]; // e.g. stacks:1:SP...
    //    setAddress(fullAccount.split(':')[2]);
    // }
  };

  const disconnect = async () => {
    if (provider) {
      await provider.disconnect();
    }
    await modal.disconnect();
    setIsConnected(false);
    setAddress(null);
  };

  const open = async () => {
    await appKitOpen();
  };

  return (
    <ReownContext.Provider
      value={{
        open,
        isConnected,
        address,
      }}
    >
      {children}
    </ReownContext.Provider>
  );
}

export const useReown = () => useContext(ReownContext);
