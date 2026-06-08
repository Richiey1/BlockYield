import type { Network } from "@/hooks/useStacksWallet";

const styles: Record<
  Network,
  { label: string; dot: string; bg: string; text: string }
> = {
  mainnet: {
    label: "Mainnet",
    dot: "bg-emerald-400",
    bg: "bg-emerald-400/10",
    text: "text-emerald-200",
  },
  testnet: {
    label: "Testnet",
    dot: "bg-sky-400",
    bg: "bg-sky-400/10",
    text: "text-sky-200",
  },
  disconnected: {
    label: "Disconnected",
    dot: "bg-slate-500",
    bg: "bg-slate-600/30",
    text: "text-slate-200",
  },
};

type Props = {
  network: Network;
};

export function NetworkBadge({ network }: Props) {
  const variant = styles[network];

  return (
    <span
      className={`hidden sm:inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${variant.bg} ${variant.text}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${variant.dot}`} />
      {variant.label}
    </span>
  );
}
