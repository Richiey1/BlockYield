export type NavItem = {
  label: string;
  href: string;
};

export const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Prediction Terminal", href: "/play" },
  { label: "Explorer", href: "https://explorer.hiro.so?chain=mainnet" },
];
