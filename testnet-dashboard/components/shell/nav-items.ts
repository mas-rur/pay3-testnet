import { IconOverview, IconExplorer, IconFaucet, IconWallet } from "@/components/icons";

export const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: IconOverview },
  { href: "/explorer", label: "Explorer", icon: IconExplorer },
  { href: "/faucet", label: "Faucet", icon: IconFaucet },
  { href: "/wallet", label: "Wallet", icon: IconWallet },
] as const;
