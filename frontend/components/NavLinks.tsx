import Link from "next/link";
import { navItems } from "@/lib/navigation";

import { useStacksWallet } from "@/hooks/useStacksWallet";
import { ADMIN_WALLETS } from "@/lib/constants/contracts";

export function NavLinks() {
  const wallet = useStacksWallet();
  const isAdmin = wallet.address ? ADMIN_WALLETS.includes(wallet.address) : false;

  return (
    <nav aria-label="Primary navigation" className="hidden items-center gap-2 md:flex">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-full px-3 py-2 text-sm font-medium text-slate-200 transition-colors duration-150 hover:text-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          {item.label}
        </Link>
      ))}
      
      {isAdmin && (
        <Link
          href="/admin"
          className="rounded-full px-3 py-2 text-sm font-medium text-amber-500 transition-colors duration-150 hover:text-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          Admin
        </Link>
      )}
    </nav>
  );

}

