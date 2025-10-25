import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { celoAlfajores } from 'wagmi/chains';

// Get WalletConnect Project ID from environment or use a placeholder
// Get your own from https://cloud.walletconnect.com
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'c1c9a92e0c94b4f2f9d8e3f1a2b3c4d5';

// Celo Alfajores testnet configuration
export const config = getDefaultConfig({
  appName: 'Campus Food Waste Reduction',
  projectId,
  chains: [celoAlfajores],
  ssr: false,
});
